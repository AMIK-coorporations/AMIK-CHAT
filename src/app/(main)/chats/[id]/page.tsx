"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ChevronLeft, MoreHorizontal, Phone, Video } from 'lucide-react';
import ChatView from '@/components/chat/ChatView';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { notFound, useRouter } from 'next/navigation';
import { getDocFromInsforge, updateDocInInsforge, getQueryFromInsforge } from '@/lib/insforgeUtils';
import type { User, Message } from '@/lib/types';
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
        const chatData = await getDocFromInsforge<any>('chats', id);

        if (!chatData) {
          console.error("Chat not found in InsForge:", id);
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
        }
      } catch (error: any) {
        console.error("Error fetching chat info via InsForge:", error);
        router.push('/chats');
      } finally {
        setLoading(false);
      }
    };

    fetchChatInfo();
  }, [id, currentUser, router]);

  useEffect(() => {
    if (!currentUser || !id) return;

    const markMessagesAsRead = async () => {
      try {
        const unreadMessages = await getQueryFromInsforge<Message>('messages', q =>
          q.eq('chat_id', id).eq('is_read', false).neq('sender_id', currentUser.id)
        );

        if (unreadMessages.length === 0) return;

        // Update each message in InsForge
        await Promise.all(unreadMessages.map(msg =>
          updateDocInInsforge('messages', msg.id, { isRead: true })
        ));

        // Update Chat unreadCount and lastMessage status
        const chatData = await getDocFromInsforge<any>('chats', id);
        if (chatData) {
          const updates: any = {};
          if (chatData.lastMessage && chatData.lastMessage.senderId !== currentUser.id) {
            updates.lastMessage = { ...chatData.lastMessage, isRead: true };
          }

          // Clear unread count for current user
          if (chatData.unreadCount && chatData.unreadCount[currentUser.id]) {
            updates.unreadCount = { ...chatData.unreadCount, [currentUser.id]: 0 };
          }

          if (Object.keys(updates).length > 0) {
            await updateDocInInsforge('chats', id, updates);
          }
        }
      } catch (error) {
        console.error("Error marking messages as read in InsForge:", error);
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
