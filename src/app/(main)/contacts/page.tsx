
"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Users, UserPlus, Loader2, Plus, MessageCircle, ScanLine, Landmark } from "lucide-react";
import ContactSuggestions from "@/components/contacts/ContactSuggestions";
import { Button } from "@/components/ui/button";
import { collection, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import type { User } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from "@/hooks/use-toast";
import { createOrNavigateToChat } from '@/lib/chatUtils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

function ContactItem({ contact, onClick, isCreatingChat }: { contact: User; onClick: () => void; isCreatingChat: boolean; }) {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-4 p-4 hover:bg-muted/50 cursor-pointer"
    >
      <Avatar className="h-10 w-10 border">
        <AvatarImage src={contact.avatarUrl} alt={contact.name} data-ai-hint="person avatar" />
        <AvatarFallback>{contact.name.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 overflow-hidden">
        <p className="font-semibold truncate">{contact.name}</p>
      </div>
       {isCreatingChat && <Loader2 className="h-5 w-5 animate-spin" />}
    </div>
  );
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { user: currentUser, userData } = useAuth();
  const router = useRouter();
  const [creatingChat, setCreatingChat] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    };
    
    const contactsColRef = collection(db, 'users', currentUser.uid, 'contacts');
    
    const unsubscribe = onSnapshot(contactsColRef, async (snapshot) => {
      setLoading(true);
      try {
        if (snapshot.empty) {
            setContacts([]);
            return;
        }
        const contactPromises = snapshot.docs.map(contactDoc => getDoc(doc(db, 'users', contactDoc.id)));
        const contactDocs = await Promise.all(contactPromises);
        const contactsData = contactDocs
          .filter(doc => doc.exists())
          .map(doc => ({ id: doc.id, ...doc.data() } as User));
        setContacts(contactsData);
      } catch (error) {
        console.error("Error fetching contacts:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [currentUser]);
  
  const handleStartChat = async (contact: User) => {
    if (!currentUser || !userData || creatingChat) return;
    setCreatingChat(contact.id);

    try {
      const chatId = await createOrNavigateToChat(currentUser.uid, userData, contact);
      router.push(`/chats/${chatId}`);
    } catch (error: any) {
      console.error("Error creating or finding chat: ", error);
      toast({
        variant: 'destructive',
        title: 'چیٹ شروع کرنے میں خرابی',
        description: error.code === 'permission-denied' 
          ? 'اجازت مسترد کر دی گئی۔ براہ کرم اپنے Firestore سیکیورٹی قوانین کو چیک کریں۔' 
          : error.message || 'ایک نامعلوم خرابی پیش آگئی۔',
      });
    } finally {
      setCreatingChat(null);
    }
  };

  return (
    <div>
      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-background p-4">
        <h1 className="text-xl font-bold">رابطے</h1>
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

      <div className="p-4">
        <ContactSuggestions />
      </div>

      <div className="border-t">
        <h2 className="p-4 text-sm font-semibold text-muted-foreground">میرے رابطے</h2>
        {loading ? (
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-5 w-32" />
            </div>
             <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-5 w-40" />
            </div>
          </div>
        ) : contacts.length > 0 ? (
          <div className="divide-y">
            {contacts.map(contact => (
              <ContactItem 
                key={contact.id} 
                contact={contact} 
                onClick={() => handleStartChat(contact)}
                isCreatingChat={creatingChat === contact.id}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
            <Users className="h-16 w-16 mb-4" />
            <h3 className="text-lg font-semibold">ابھی تک کوئی رابطہ نہیں</h3>
            <p className="text-sm">نئے رابطے شامل کرنے کے لیے '+' بٹن کا استعمال کریں۔</p>
          </div>
        )}
      </div>
    </div>
  );
}
