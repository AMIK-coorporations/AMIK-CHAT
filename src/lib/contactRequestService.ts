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

  const targetUserRef = doc(db, 'users', targetUserId);
  const targetUserSnap = await getDoc(targetUserRef);
  if (!targetUserSnap.exists()) {
    throw new ContactRequestError('user-not-found', 'صارف نہیں ملا');
  }

  const targetUserData = targetUserSnap.data() as Partial<User>;
  const targetInfo = {
    name: targetUserData.name ?? (targetUserData as any)?.displayName ?? 'نامعلوم صارف',
    avatarUrl: targetUserData.avatarUrl ?? (targetUserData as any)?.photoURL ?? '',
  };

  const existingContactRef = doc(db, 'users', senderId, 'contacts', targetUserId);
  const existingContactSnap = await getDoc(existingContactRef);
  if (existingContactSnap.exists()) {
    throw new ContactRequestError('already-contact', 'پہلے سے رابطہ ہے');
  }

  const senderRequestRef = doc(db, 'users', senderId, 'contactRequests', targetUserId);
  const receiverRequestRef = doc(db, 'users', targetUserId, 'contactRequests', senderId);

  const senderRequestSnap = await getDoc(senderRequestRef);
  const receiverRequestSnap = await getDoc(receiverRequestRef);

  // If any side already marked accepted, no need to re-request
  if (senderRequestSnap.exists() && senderRequestSnap.data().status === 'accepted') {
    throw new ContactRequestError('already-accepted', 'درخواست پہلے ہی قبول ہو چکی ہے۔');
  }

  if (senderRequestSnap.exists() && senderRequestSnap.data().status === 'pending') {
    throw new ContactRequestError('already-pending', 'درخواست پہلے سے بھیجی جا چکی ہے۔');
  }

  // If the other user already sent a request, surface that so UI can guide
  if (receiverRequestSnap.exists() && receiverRequestSnap.data().status === 'pending') {
    throw new ContactRequestError('incoming-exists', 'دوسرے صارف نے پہلے ہی درخواست بھیجی ہے۔');
  }

  const timestamp = serverTimestamp();
  const batch = writeBatch(db);

  batch.set(senderRequestRef, {
    fromUserId: senderId,
    toUserId: targetUserId,
    fromName: senderInfo.name,
    toName: targetInfo.name,
    fromAvatarUrl: senderInfo.avatarUrl,
    toAvatarUrl: targetInfo.avatarUrl,
    direction: 'sent' as const,
    status: 'pending' as const,
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  batch.set(receiverRequestRef, {
    fromUserId: senderId,
    toUserId: targetUserId,
    fromName: senderInfo.name,
    toName: targetInfo.name,
    fromAvatarUrl: senderInfo.avatarUrl,
    toAvatarUrl: targetInfo.avatarUrl,
    direction: 'received' as const,
    status: 'pending' as const,
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  await batch.commit();

  // InsForge Sync
  try {
    const requestData = {
      fromUserId: senderId,
      toUserId: targetUserId,
      fromName: senderInfo.name,
      toName: targetInfo.name,
      fromAvatarUrl: senderInfo.avatarUrl,
      toAvatarUrl: targetInfo.avatarUrl,
      status: 'pending' as const,
      updatedAt: new Date(),
    };
    // We only need one record in InsForge for both directions if we query by from_user_id or to_user_id
    // But since the IDs might conflict if we use doc ID, we'll use a composite ID
    await setDocInInsforge('contact_requests', `${senderId}_${targetUserId}`, requestData);
  } catch (error) {
    console.error("InsForge sendContactRequest sync failed:", error);
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
  const otherUserRef = doc(db, 'users', otherUserId);
  const otherUserSnap = await getDoc(otherUserRef);

  if (!otherUserSnap.exists()) {
    throw new ContactRequestError('user-not-found', 'درخواست بھیجنے والا صارف نہیں ملا۔');
  }

  const otherUser = { id: otherUserId, ...otherUserSnap.data() } as User;

  const timestamp = serverTimestamp();
  const batch = writeBatch(db);

  const myContactRef = doc(db, 'users', currentUserId, 'contacts', otherUserId);
  const theirContactRef = doc(db, 'users', otherUserId, 'contacts', currentUserId);

  batch.set(myContactRef, {
    addedAt: timestamp,
    contactName: otherUser.name ?? otherUser.displayName ?? 'Unknown User',
    contactAvatarUrl: otherUser.avatarUrl ?? otherUser.photoURL ?? '',
  });

  batch.set(theirContactRef, {
    addedAt: timestamp,
    contactName: currentUserProfile.name ?? currentUserProfile.displayName ?? 'Unknown User',
    contactAvatarUrl: currentUserProfile.avatarUrl ?? (currentUserProfile as any).photoURL ?? '',
  });

  batch.set(doc(db, 'users', currentUserId, 'contactRequests', otherUserId), {
    status: 'accepted',
    updatedAt: timestamp,
  }, { merge: true });

  batch.set(doc(db, 'users', otherUserId, 'contactRequests', currentUserId), {
    status: 'accepted',
    updatedAt: timestamp,
  }, { merge: true });

  await batch.commit();

  // InsForge Sync (Accept)
  try {
    const timestamp = new Date();
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
    // For contact requests, we use a consistent ID format
    const reqId1 = currentUserId < otherUserId ? `${currentUserId}_${otherUserId}` : `${otherUserId}_${currentUserId}`;
    await updateDocInInsforge('contact_requests', reqId1, { status: 'accepted', updatedAt: timestamp });
  } catch (error) {
    console.error("InsForge acceptContactRequest sync failed:", error);
  }

  const chatId = await createOrNavigateToChat(currentUserId, currentUserProfile, otherUser);

  // Send automated acceptance message
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
  const timestamp = serverTimestamp();
  const batch = writeBatch(db);

  batch.set(doc(db, 'users', currentUserId, 'contactRequests', otherUserId), {
    status: 'rejected',
    updatedAt: timestamp,
  }, { merge: true });

  batch.set(doc(db, 'users', otherUserId, 'contactRequests', currentUserId), {
    status: 'rejected',
    updatedAt: timestamp,
  }, { merge: true });

  await batch.commit();

  // InsForge Sync (Reject)
  try {
    const timestamp = new Date();
    const reqId = currentUserId < otherUserId ? `${currentUserId}_${otherUserId}` : `${otherUserId}_${currentUserId}`;
    await updateDocInInsforge('contact_requests', reqId, { status: 'rejected', updatedAt: timestamp });
  } catch (error) {
    console.error("InsForge rejectContactRequest sync failed:", error);
  }
};


