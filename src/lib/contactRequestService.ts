import { collection, doc, getDoc, serverTimestamp, setDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { setDocInInsforge, getDocFromInsforge, updateDocInInsforge } from './insforgeUtils';
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
  const existingContact = await getDocFromInsforge('user_contacts', `${senderId}_${targetUserId}`);
  if (existingContact) {
    throw new ContactRequestError('already-contact', 'پہلے سے رابطہ ہے');
  }

  // Check for existing requests in InsForge
  // We use a consistent composite ID format: smallerId_largerId or just from_to
  // To avoid confusion, let's stick to from_to as the primary ID for the request itself
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
  const otherUserId = request.fromUserId === currentUserId ? request.toUserId : request.fromUserId;

  const otherUser = await getDocFromInsforge<User>('users', otherUserId);
  if (!otherUser) {
    throw new ContactRequestError('user-not-found', 'درخواست بھیجنے والا صارف نہیں ملا۔');
  }

  const timestamp = new Date();

  // Primary Storage: InsForge user_contacts
  try {
    await setDocInInsforge('user_contacts', `${currentUserId}_${otherUserId}`, {
      userId: currentUserId,
      contactId: otherUserId,
      contactName: otherUser.name ?? otherUser.displayName ?? 'Unknown User',
      contactAvatarUrl: otherUser.avatarUrl ?? otherUser.photoURL ?? '',
      addedAt: timestamp
    });

    await setDocInInsforge('user_contacts', `${otherUserId}_${currentUserId}`, {
      userId: otherUserId,
      contactId: currentUserId,
      contactName: currentUserProfile.name ?? currentUserProfile.displayName ?? 'Unknown User',
      contactAvatarUrl: currentUserProfile.avatarUrl ?? (currentUserProfile as any).photoURL ?? '',
      addedAt: timestamp
    });

    // Update Request Status in InsForge
    // IDs are senderId_targetUserId. 
    // If currentUserId accepted, senderId is otherUserId.
    const reqId = `${otherUserId}_${currentUserId}`;
    await updateDocInInsforge('contact_requests', reqId, { status: 'accepted', updatedAt: timestamp });
  } catch (error: any) {
    console.error("InsForge acceptContactRequest failed:", error);
    throw new Error(error.message || "InsForge contact sync failed");
  }

  const chatId = await createOrNavigateToChat(currentUserId, currentUserProfile, otherUser);

  // Send automated acceptance message in Firestore (where chats are stored)
  try {
    const chatRef = doc(db, 'chats', chatId);
    const messagesColRef = collection(chatRef, 'messages');
    const acceptanceMessageRef = doc(messagesColRef);
    const messageTimestamp = serverTimestamp();

    await setDoc(acceptanceMessageRef, {
      text: 'میں نے آپ کی درخواست قبول کر لی ہے، آئیے چیٹ کریں',
      senderId: currentUserId,
      timestamp: messageTimestamp,
      isRead: false,
      type: 'text',
    });

    await updateDoc(chatRef, {
      lastMessage: {
        text: 'میں نے آپ کی درخواست قبول کر لی ہے، آئیے چیٹ کریں',
        senderId: currentUserId,
        timestamp: messageTimestamp,
        isRead: false,
      },
    });
  } catch (err) {
    console.error("Firestore acceptance message failed (non-critical):", err);
  }

  return { chatId, otherUser };
};

export const rejectContactRequest = async ({
  currentUserId,
  request,
}: {
  currentUserId: string;
  request: ContactRequest;
}) => {
  const otherUserId = request.fromUserId === currentUserId ? request.toUserId : request.fromUserId;
  const timestamp = new Date();

  // Update Status in InsForge
  try {
    // ID is always senderId_targetUserId. 
    // If request was FROM otherUser TO currentUserId, ID is otherUserId_currentUserId
    const reqId = `${otherUserId}_${currentUserId}`;
    await updateDocInInsforge('contact_requests', reqId, { status: 'rejected', updatedAt: timestamp });
  } catch (error: any) {
    console.error("InsForge rejectContactRequest failed:", error);
    throw new Error(error.message || "InsForge contact sync failed");
  }
};


