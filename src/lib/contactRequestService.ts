import { setDocInInsforge, getDocFromInsforge, getContactDoc, updateDocInInsforge } from './insforgeUtils';
import type { ContactRequest, User } from '@/lib/types';
import { createOrNavigateToChat } from './chatUtils';

export class ContactRequestError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

const buildUserSnapshot = (userData: Partial<User> | null | undefined) => ({
  name: userData?.name ?? (userData as any)?.displayName ?? 'نامعلوم صارف',
  avatarUrl: userData?.avatarUrl ?? (userData as any)?.photoURL ?? '',
});

export const sendContactRequest = async ({
  senderId,
  senderProfile,
  targetUserId,
}: {
  senderId: string;
  senderProfile?: Partial<User> | null;
  targetUserId: string;
}) => {
  const senderInfo = buildUserSnapshot(senderProfile);

  // First, check if the target user exists in InsForge
  const targetUser = await getDocFromInsforge<User>('users', targetUserId);
  if (!targetUser) {
    throw new ContactRequestError('user-not-found', 'صارف نہیں ملا');
  }

  const targetInfo = {
    name: targetUser.name ?? (targetUser as any)?.displayName ?? 'نامعلوم صارف',
    avatarUrl: targetUser.avatarUrl ?? (targetUser as any)?.photoURL ?? '',
  };

  // Check if already contacts in InsForge
  const existingContact = await getContactDoc(senderId, targetUserId);
  if (existingContact) {
    throw new ContactRequestError('already-contact', 'پہلے سے رابطہ ہے');
  }

  // Check for existing requests in InsForge
  // We use a consistent composite ID format: fromUserId_toUserId
  const reqId = `${senderId}_${targetUserId}`;
  const inverseReqId = `${targetUserId}_${senderId}`;

  const existingRequest = await getDocFromInsforge<ContactRequest>('contact_requests', reqId);
  const existingInverseRequest = await getDocFromInsforge<ContactRequest>('contact_requests', inverseReqId);

  if (existingRequest && existingRequest.status === 'accepted') {
    throw new ContactRequestError('already-accepted', 'درخواست پہلے ہی قبول ہو چکی ہے۔');
  }

  if (existingRequest && existingRequest.status === 'pending') {
    throw new ContactRequestError('already-pending', 'درخواست پہلے سے بھیجی جا چکی ہے۔');
  }

  if (existingInverseRequest && existingInverseRequest.status === 'pending') {
    throw new ContactRequestError('incoming-exists', 'دوسرے صارف نے پہلے ہی درخواست بھیجی ہے۔');
  }

  // Save request to InsForge
  try {
    const timestamp = new Date();
    const requestData = {
      fromUserId: senderId,
      toUserId: targetUserId,
      fromName: senderInfo.name,
      toName: targetInfo.name,
      fromAvatarUrl: senderInfo.avatarUrl,
      toAvatarUrl: targetInfo.avatarUrl,
      status: 'pending' as const,
      updatedAt: timestamp,
      createdAt: timestamp,
    };

    await setDocInInsforge('contact_requests', reqId, requestData);
  } catch (error: any) {
    console.error("InsForge sendContactRequest failed:", error);
    throw new ContactRequestError('insforge-error', error.message || 'درخواست بھیجنے میں خرابی۔');
  }

  return { targetName: targetInfo.name };
};

export const acceptContactRequest = async ({
  currentUserId,
  currentUserProfile,
  request,
}: {
  currentUserId: string;
  currentUserProfile: User;
  request: ContactRequest;
}) => {
  // sender is request.fromUserId, receiver (me) is request.toUserId
  const otherUserId = request.fromUserId;
  const requestId = request.id || `${request.fromUserId}_${request.toUserId}`;

  const otherUser = await getDocFromInsforge<User>('users', otherUserId);
  if (!otherUser) {
    throw new ContactRequestError('user-not-found', 'درخواست بھیجنے والا صارف نہیں ملا۔');
  }

  const timestamp = new Date();

  // Primary Storage: InsForge user_contacts
  // We prioritize updating our OWN contact list. 
  // Updating the OTHER person's list might fail due to RLS, but that shouldn't block us.
  try {
    // 1. Update MY contacts
    await setDocInInsforge('user_contacts', `${currentUserId}_${otherUserId}`, {
      userId: currentUserId,
      contactId: otherUserId,
      contactName: otherUser.name ?? otherUser.displayName ?? 'Unknown User',
      contactAvatarUrl: otherUser.avatarUrl ?? otherUser.photoURL ?? '',
      addedAt: timestamp
    });

    // 2. Try to update THEIR contacts (non-blocking in case of RLS)
    try {
      await setDocInInsforge('user_contacts', `${otherUserId}_${currentUserId}`, {
        userId: otherUserId,
        contactId: currentUserId,
        contactName: currentUserProfile.name ?? currentUserProfile.displayName ?? 'Unknown User',
        contactAvatarUrl: currentUserProfile.avatarUrl ?? (currentUserProfile as any).photoURL ?? '',
        addedAt: timestamp
      });
    } catch (rlsError) {
      console.warn("Could not sync mutual contact in InsForge (expected if RLS is strict):", rlsError);
    }

    // 3. Update Request Status in InsForge
    await updateDocInInsforge('contact_requests', requestId, {
      status: 'accepted',
      updatedAt: timestamp
    });
  } catch (error: any) {
    console.error("InsForge acceptContactRequest critical failure:", error);
    throw new Error(error.message || "InsForge contact sync failed");
  }

  // Create Chat in InsForge
  const chatId = await createOrNavigateToChat(currentUserId, currentUserProfile, otherUser);

  return { chatId, otherUser };
};

export const rejectContactRequest = async ({
  currentUserId,
  request,
}: {
  currentUserId: string;
  request: ContactRequest;
}) => {
  const requestId = request.id || `${request.fromUserId}_${request.toUserId}`;
  const timestamp = new Date();

  // Update Status in InsForge
  try {
    await updateDocInInsforge('contact_requests', requestId, {
      status: 'rejected',
      updatedAt: timestamp
    });
  } catch (error: any) {
    console.error("InsForge rejectContactRequest failed:", error);
    throw new Error(error.message || "InsForge contact sync failed");
  }
};


