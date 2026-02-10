import { setDocInInsforge, getDocFromInsforge } from './insforgeUtils';
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

  // Check if chat exists in InsForge
  const existingChat = await getDocFromInsforge('chats', chatId);

  if (!existingChat) {
    // Chat doesn't exist, create it with the deterministic ID
    const newChatData = {
      participantIds: participantIds,
      participantsInfo: {
        [currentUserId]: {
          name: currentUserData.name ?? (currentUserData as any).displayName ?? 'User',
          avatarUrl: currentUserData.avatarUrl ?? (currentUserData as any).photoURL ?? '',
        },
        [contact.id]: {
          name: contact.name ?? (contact as any).displayName ?? 'User',
          avatarUrl: contact.avatarUrl ?? (contact as any).photoURL ?? '',
        },
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      lastMessage: null,
    };

    try {
      await setDocInInsforge('chats', chatId, newChatData);
    } catch (error: any) {
      console.error("InsForge createOrNavigateToChat failed:", error);
      throw new Error(error.message || "InsForge chat creation failed");
    }
  }

  return chatId;
};
