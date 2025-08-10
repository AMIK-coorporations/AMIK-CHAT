"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ChevronLeft, MoreHorizontal } from 'lucide-react';
import ChatView from '@/components/chat/ChatView';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { notFound, useRouter } from 'next/navigation';
import { doc, getDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { User } from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';

export default function ChatPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [otherParticipant, setOtherParticipant] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { user: currentUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!currentUser) return;

    const fetchChatInfo = async () => {
      try {
        const chatDocRef = doc(db, 'chats', id);
        const chatDoc = await getDoc(chatDocRef);

        if (!chatDoc.exists()) {
          notFound();
          return;
        }

        const chatData = chatDoc.data();
        if (!chatData.participantIds.includes(currentUser.uid)) {
            console.error("Current user not in this chat");
            router.push('/chats');
            return;
        }

        const otherParticipantId = chatData.participantIds.find((participantId: string) => participantId !== currentUser.uid);

        if (otherParticipantId && chatData.participantsInfo) {
          const otherInfo = chatData.participantsInfo[otherParticipantId];
          if (otherInfo) {
            setOtherParticipant({
                id: otherParticipantId,
                name: otherInfo.name,
                avatarUrl: otherInfo.avatarUrl
            });
          }
        } else if (chatData.participantsInfo && chatData.participantsInfo[currentUser.uid]) {
            // Handle self-chat case by loading current user's info
            const selfInfo = chatData.participantsInfo[currentUser.uid];
            setOtherParticipant({
                id: currentUser.uid,
                name: selfInfo.name,
                avatarUrl: selfInfo.avatarUrl,
            });
        }
      } catch (error) {
        console.error("Error fetching chat info:", error);
        notFound();
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
        if (doc.data().senderId !== currentUser.uid) {
            batch.update(doc.ref, { isRead: true });
            needsCommit = true;
        }
      });

      if (!needsCommit) return;
      
      const chatRef = doc(db, 'chats', id);
      const chatSnap = await getDoc(chatRef);
      if (chatSnap.exists()) {
          const chatData = chatSnap.data();
          if (chatData.lastMessage && chatData.lastMessage.senderId !== currentUser.uid) {
               batch.update(chatRef, { 'lastMessage.isRead': true });
          }
      }
      
      await batch.commit();
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
              <AvatarImage src={otherParticipant.avatarUrl} alt={otherParticipant.name} data-ai-hint="person avatar" />
              <AvatarFallback>{otherParticipant.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <h1 className="flex-1 truncate text-lg font-semibold">{otherParticipant.name}</h1>
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
