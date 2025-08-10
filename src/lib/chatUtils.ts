
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { User as AppUser } from '@/lib/types';

/**
 * Creates a chat if it doesn't exist, then returns the chat ID.
 * Throws an error if chat creation fails.
 * @param currentUserId The UID of the currently authenticated user.
 * @param currentUserData The profile data of the current user.
 * @param contact The profile data of the contact to chat with.
 * @returns The ID of the chat.
 */
export const createOrNavigateToChat = async (
  currentUserId: string,
  currentUserData: AppUser,
  contact: AppUser
): Promise<string> => {
  // Create a deterministic chat ID from sorted user IDs to ensure 1-on-1 chats are unique
  const participantIds = [currentUserId, contact.id].sort();
  const chatId = participantIds.join('_');

  const chatDocRef = doc(db, 'chats', chatId);
  const chatDocSnap = await getDoc(chatDocRef);

  if (!chatDocSnap.exists()) {
    // Chat doesn't exist, create it with the deterministic ID
    const newChatData = {
      participantIds: participantIds,
      participantsInfo: {
        [currentUserId]: {
          name: currentUserData.name,
          avatarUrl: currentUserData.avatarUrl,
        },
        [contact.id]: {
          name: contact.name,
          avatarUrl: contact.avatarUrl,
        },
      },
      createdAt: serverTimestamp(),
      lastMessage: null,
    };
    await setDoc(chatDocRef, newChatData);
  }
  
  return chatId;
};
