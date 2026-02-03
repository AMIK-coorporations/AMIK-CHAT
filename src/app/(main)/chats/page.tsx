
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Search, Plus, MessageCircle, UserPlus, ScanLine, Landmark, ChevronRight } from 'lucide-react';
import LoadingOverlay from '@/components/LoadingOverlay';
import type { Chat } from '@/lib/types';
import ChatRow from '@/components/chat/ChatRow';

import { useChatContext } from '@/context/ChatContext';

export default function ChatsPage() {
  const { chats, loading } = useChatContext();
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();
  const { user: currentUser } = useAuth();

  // Filter chats based on search term
  const filteredChats = chats.filter(chat => {
    if (!currentUser) return false;
    const otherParticipantId = chat.participantIds?.find(id => id !== currentUser.uid);
    // If self chat
    const targetId = otherParticipantId || currentUser.uid;

    const participantInfo = chat.participantsInfo?.[targetId];
    if (!participantInfo) return false;

    // Check name
    const name = participantInfo.name || participantInfo.displayName || '';
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="relative h-full flex flex-col">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-background p-4">
        <h1 className="text-xl font-bold">AMIK CHAT</h1>
      </header>

      <div className="p-4 border-b flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            dir="rtl"
            placeholder="تلاش کریں"
            className="pr-10 text-right"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-10 w-10 border shrink-0">
              <Plus className="h-5 w-5" />
              <span className="sr-only">شامل کریں</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => router.push('/chats/new')}>
              <MessageCircle className="h-4 w-4 mr-2" />
              <span>نئی چیٹ</span>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => router.push('/contacts/add')}>
              <UserPlus className="h-4 w-4 mr-2" />
              <span>رابطے شامل کریں</span>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => router.push('/scan')}>
              <ScanLine className="h-4 w-4 mr-2" />
              <span>کیو آر اسکین</span>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => router.push('/money')}>
              <Landmark className="h-4 w-4 mr-2" />
              <span>پیسے</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex-1 overflow-y-auto divide-y">
        {loading ? (
          <LoadingOverlay message="چیٹ لوڈ ہو رہی ہے..." />
        ) : filteredChats.length > 0 ? (
          filteredChats.map(chat => (
            currentUser && <ChatRow key={chat.id} chat={chat} currentUserId={currentUser.uid} />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground h-full space-y-4">
            <div className="bg-muted p-4 rounded-full">
              <MessageCircle className="h-8 w-8 text-muted-foreground" />
            </div>
            <p>ابھی تک کوئی چیٹ نہیں ہے۔</p>
            <Button onClick={() => router.push('/chats/new')}>
              نئی گفتگو شروع کریں
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
