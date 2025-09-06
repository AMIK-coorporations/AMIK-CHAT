
"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { User } from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Search, Plus, MessageCircle, UserPlus, ScanLine, Landmark } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { createOrNavigateToChat } from '@/lib/chatUtils';

function ContactRow({ contact, onClick }: { contact: User; onClick: () => void }) {
  return (
    <div onClick={onClick} className="flex items-center gap-4 p-4 hover:bg-muted/50 cursor-pointer">
      <Avatar className="h-10 w-10 border">
        <AvatarImage src={contact.avatarUrl} alt={contact.name ?? 'User'} data-ai-hint="person avatar" />
        <AvatarFallback>{(contact.name ?? 'U').charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 overflow-hidden">
        <p className="font-semibold truncate">{contact.name ?? 'Unknown User'}</p>
      </div>
    </div>
  );
}

export default function ChatsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [contacts, setContacts] = useState<User[]>([]);
  const [contactsLoading, setContactsLoading] = useState(true);
  const router = useRouter();
  const { user: currentUser, userData } = useAuth();

  useEffect(() => {
    if (!currentUser) { setContactsLoading(false); return; }
    const contactsColRef = collection(db, 'users', currentUser.uid, 'contacts');
    const unsub = onSnapshot(contactsColRef, async snapshot => {
      setContactsLoading(true);
      try {
        if (snapshot.empty) { setContacts([]); return; }
        const contactDocs = await Promise.all(snapshot.docs.map(c => getDoc(doc(db, 'users', c.id))));
        const contactsData = contactDocs.filter(d => d.exists()).map(d => ({ id: d.id, ...d.data() } as User));
        setContacts(contactsData);
      } finally { setContactsLoading(false); }
    });
    return () => unsub();
  }, [currentUser]);

  const filteredContacts = (contacts || []).filter(c => c.name?.toLowerCase().includes(searchTerm.toLowerCase()));

  const startChat = async (contact: User) => {
    if (!currentUser || !userData) return;
    const chatId = await createOrNavigateToChat(currentUser.uid, userData, contact);
    router.push(`/chats/${chatId}`);
  };

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
                <Landmark className="h-4 و-4 mr-2" />
                <span>پیسے</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input dir="rtl" placeholder="تلاش کریں" className="pr-10 text-right" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
      </div>
      <div className="divide-y">
        {contactsLoading ? (
          <p className="p-4 text-center text-muted-foreground">رابطے لوڈ ہو رہے ہیں...</p>
        ) : filteredContacts.length > 0 ? (
          filteredContacts.map(contact => (
            <ContactRow key={contact.id} contact={contact} onClick={() => startChat(contact)} />
          ))
        ) : (
          <p className="p-4 text-center text-muted-foreground">کوئی رابطہ نہیں ملا۔ <Link href="/contacts/add" className="text-primary underline">ایک شامل کریں</Link></p>
        )}
      </div>
    </div>
  );
}
