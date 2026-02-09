"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ChevronLeft, MoreHorizontal, Phone, Video } from 'lucide-react';
import ChatView from '@/components/chat/ChatView';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { notFound, useRouter } from 'next/navigation';
import { doc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getDocWithRetry, getQueryWithRetry, updateDocWithRetry } from '@/lib/firestoreUtils';
import type { User } from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';
import { useCall } from '@/hooks/useCall';
import { Button } from '@/components/ui/button';

export default function ChatPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [otherParticipant, setOtherParticipant] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { user: currentUser } = useAuth();
  const { initiateCall } = useCall();
  const router = useRouter();

  useEffect(() => {
    if (!currentUser) return;

    const fetchChatInfo = async () => {
      try {
        const chatDocRef = doc(db, 'chats', id);
        const chatData = await getDocWithRetry(chatDocRef);

        if (!chatData) {
          console.error("Chat not found:", id);
          router.push('/chats');
          return;
        }

        if (!chatData.participantIds || !chatData.participantIds.includes(currentUser.id)) {
          console.error("Current user not in this chat");
          router.push('/chats');
          return;
        }

        const otherParticipantId = chatData.participantIds.find((participantId: string) => participantId !== currentUser.id);

        if (otherParticipantId && chatData.participantsInfo) {
          const otherInfo = chatData.participantsInfo[otherParticipantId];
          if (otherInfo) {
            setOtherParticipant({
              id: otherParticipantId,
              email: otherInfo.email ?? '',
              displayName: otherInfo.displayName ?? otherInfo.name ?? 'Unknown',
              name: otherInfo.name ?? otherInfo.displayName ?? 'Unknown',
              avatarUrl: otherInfo.avatarUrl ?? otherInfo.photoURL ?? '',
              photoURL: otherInfo.photoURL ?? otherInfo.avatarUrl ?? '',
              phoneNumber: otherInfo.phoneNumber ?? '',
              createdAt: new Date(),
              lastSeen: new Date(),
              isOnline: otherInfo.isOnline ?? false,
              status: otherInfo.status ?? '',
              bio: otherInfo.bio ?? ''
            });
          }
        } else if (chatData.participantsInfo && chatData.participantsInfo[currentUser.id]) {
          // Handle self-chat case by loading current user's info
          const selfInfo = chatData.participantsInfo[currentUser.id];
          setOtherParticipant({
            id: currentUser.id,
            email: selfInfo.email ?? '',
            displayName: selfInfo.displayName ?? selfInfo.name ?? 'Unknown',
            name: selfInfo.name ?? selfInfo.displayName ?? 'Unknown',
            avatarUrl: selfInfo.avatarUrl ?? selfInfo.photoURL ?? '',
            photoURL: selfInfo.photoURL ?? selfInfo.avatarUrl ?? '',
            phoneNumber: selfInfo.phoneNumber ?? '',
            createdAt: new Date(),
            lastSeen: new Date(),
            isOnline: selfInfo.isOnline ?? false,
            status: selfInfo.status ?? '',
            bio: selfInfo.bio ?? ''
          });
        }
      } catch (error: any) {
        console.error("Error fetching chat info:", error);

        // Handle specific error cases
        if (error.code === 'permission-denied') {
          console.error("Permission denied accessing chat");
          router.push('/chats');
        } else {
          // For other errors, redirect to chats page instead of calling notFound()
          router.push('/chats');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchChatInfo();
  }, [id, currentUser, router]);

  useEffect(() => {
    if (!currentUser || !id) return;

    const markMessagesAsRead = async () => {
      const messagesRef = collection(db, 'chats', id, 'messages');
      const unreadMessagesQuery = query(messagesRef, where('isRead', '==', false));
      const querySnapshot = await getDocs(unreadMessagesQuery);

      if (querySnapshot.empty) return;

      const batch = writeBatch(db);
      let needsCommit = false;
      querySnapshot.docs.forEach(doc => {
        if (doc.data().senderId !== currentUser.id) {
          batch.update(doc.ref, { isRead: true });
          needsCommit = true;
        }
      });

      if (!needsCommit) return;

      const chatRef = doc(db, 'chats', id);
      const chatData = await getDocWithRetry(chatRef);
      if (chatData) {
        if (chatData.lastMessage && chatData.lastMessage.senderId !== currentUser.id) {
          batch.update(chatRef, { 'lastMessage.isRead': true });
          // Note: updateDocWithRetry isn't batch-compatible, 
          // but we'll trigger a separate sync for the chat object if it's the last message
          updateDocWithRetry(chatRef, { 'lastMessage.isRead': true }).catch(console.error);
        }
      }

      await batch.commit();

      // InsForge Sync (Mark Messages as Read)
      // Ideally we'd iterate and update each in InsForge too
      for (const doc of querySnapshot.docs) {
        if (doc.data().senderId !== currentUser.id) {
          updateDocWithRetry(doc.ref, { isRead: true }).catch(console.error);
        }
      }
    };

    markMessagesAsRead().catch(console.error);
  }, [id, currentUser]);

  if (loading) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <p>چیٹ لوڈ ہو رہی ہے...</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <header className="sticky top-0 z-10 flex items-center gap-4 border-b bg-background p-3">
        <Link href="/chats" className="p-1 rounded-md hover:bg-muted">
          <ChevronLeft className="h-6 w-6" />
        </Link>
        {otherParticipant ? (
          <>
            <Avatar className="h-10 w-10 border">
              <AvatarImage src={otherParticipant.avatarUrl} alt={otherParticipant.name ?? 'User'} data-ai-hint="person avatar" />
              <AvatarFallback>{(otherParticipant.name ?? 'U').charAt(0)}</AvatarFallback>
            </Avatar>
            <h1 className="flex-1 truncate text-lg font-semibold">{otherParticipant.name ?? 'Unknown User'}</h1>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => otherParticipant && initiateCall(otherParticipant.id, false)}
                data-testid="voice-call-btn"
                title="وائس کال"
              >
                <Phone className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => otherParticipant && initiateCall(otherParticipant.id, true)}
                data-testid="video-call-btn"
                title="ویڈیو کال"
              >
                <Video className="h-5 w-5" />
              </Button>
            </div>
          </>
        ) : (
          <div className="flex-1 h-10 bg-muted rounded-md animate-pulse" />
        )}
        <button className="p-1 rounded-md hover:bg-muted">
          <MoreHorizontal className="h-6 w-6" />
        </button>
      </header>
      <ChatView chatId={id} />
    </div>
  );
}
