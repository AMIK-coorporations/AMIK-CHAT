
"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Chat } from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Search, Plus, MessageCircle, UserPlus, ScanLine, Landmark } from 'lucide-react';

function formatUrduDistanceToNow(date: Date): string {
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    const urduNumbers: { [key: number]: string } = {
        1: 'ایک', 2: 'دو', 3: 'تین', 4: 'چار', 5: 'پانچ',
        6: 'چھ', 7: 'سات', 8: 'آٹھ', 9: 'نو', 10: 'دس',
    };
    const toUrduWord = (n: number) => urduNumbers[n] || String(n);

    if (seconds < 2) return "ابھی ابھی";
    
    if (seconds < 60) {
        const numWord = toUrduWord(seconds);
        return `${numWord} سیکنڈ پہلے`;
    }
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
        const numWord = toUrduWord(minutes);
        return `${numWord} منٹ پہلے`;
    }
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
        if (hours === 1) return 'ایک گھنٹہ پہلے';
        const numWord = toUrduWord(hours);
        return `${numWord} گھنٹے پہلے`;
    }
    
    const days = Math.floor(hours / 24);
    if (days < 30) {
        const numWord = toUrduWord(days);
        return `${numWord} دن پہلے`;
    }

    const months = Math.floor(days / 30);
    if (months < 12) {
        if (months === 1) return 'ایک مہینہ پہلے';
        const numWord = toUrduWord(months);
        return `${numWord} مہینے پہلے`;
    }

    const years = Math.floor(days / 365);
    const numWord = toUrduWord(years);
    return `${numWord} سال پہلے`;
}

function ChatItem({ chat, currentUserId }: { chat: Chat; currentUserId: string }) {
  const otherParticipantId = chat.participantIds.find(id => id !== currentUserId);
  const otherParticipant = otherParticipantId ? chat.participantsInfo[otherParticipantId] : null;
  const [time, setTime] = useState('');
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (!hasMounted) return;

    let timeoutId: NodeJS.Timeout;
    const updateFuzzyTime = () => {
      if (chat.lastMessage?.timestamp) {
        try {
          const ts: any = chat.lastMessage.timestamp as any;
          const date = typeof ts?.toDate === 'function' ? ts.toDate() : new Date();
          setTime(formatUrduDistanceToNow(date));
        } catch (e) {
          setTime('');
        }
      } else {
        setTime('');
      }
      timeoutId = setTimeout(updateFuzzyTime, 60000);
    };

    updateFuzzyTime();
    return () => clearTimeout(timeoutId);
  }, [chat.lastMessage?.timestamp, hasMounted]);

  if (!otherParticipant) return null;

  return (
    <Link href={`/chats/${chat.id}`} className="block transition-colors hover:bg-muted/50">
      <div className="flex items-center gap-4 p-4">
        <Avatar className="h-12 w-12 border">
          <AvatarImage src={otherParticipant.avatarUrl} alt={otherParticipant.name} data-ai-hint="person avatar" />
          <AvatarFallback>{otherParticipant.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 overflow-hidden">
          <div className="flex items-center justify-between">
            <p className="font-semibold truncate text-base">{otherParticipant.name}</p>
            {hasMounted && chat.lastMessage && <p className="text-xs text-muted-foreground">{time}</p>}
          </div>
          <p className="text-sm text-muted-foreground truncate">{chat.lastMessage?.text || 'ابھی تک کوئی پیغام نہیں'}</p>
        </div>
      </div>
    </Link>
  );
}

export default function ChatsPage() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading] = useState(false);
  const router = useRouter();
  const { user: currentUser } = useAuth();
  
  const filteredChats = chats.filter(chat => {
    if (!currentUser) return false;
    const otherParticipantId = chat.participantIds.find(id => id !== currentUser.uid);
    if (!otherParticipantId) return false;
    const otherParticipant = chat.participantsInfo[otherParticipantId];
    return otherParticipant?.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div>
      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-background p-4">
        <h1 className="text-xl font-bold">AMIK CHAT</h1>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
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
      </header>
       <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            dir="rtl"
            placeholder="تلاش کریں" 
            className="pr-10 text-right"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      <div className="divide-y">
        {loading ? (
          <p className="p-4 text-center text-muted-foreground">چیٹس لوڈ ہو رہی ہیں...</p>
        ) : filteredChats.length > 0 ? (
          filteredChats.map(chat => (
            currentUser && <ChatItem key={chat.id} chat={chat} currentUserId={currentUser.uid} />
          ))
        ) : (
           <p className="p-4 text-center text-muted-foreground">کوئی چیٹ نہیں ملی۔</p>
        )}
      </div>
    </div>
  );
}
