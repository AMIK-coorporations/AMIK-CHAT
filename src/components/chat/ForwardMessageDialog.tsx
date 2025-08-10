
"use client";

import { useEffect, useState } from 'react';
import { collection, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import type { User, Message } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Send } from 'lucide-react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Skeleton } from '../ui/skeleton';

interface ForwardMessageDialogProps {
  message: Message | null;
  onClose: () => void;
  onForward: (selectedContactIds: string[]) => Promise<void>;
}

export default function ForwardMessageDialog({ message, onClose, onForward }: ForwardMessageDialogProps) {
  const { user: currentUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [contacts, setContacts] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isForwarding, setIsForwarding] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setOpen(!!message);
    if (!message) {
      // Reset state when dialog closes
      setSelectedContacts([]);
      setSearchTerm('');
    }
  }, [message]);
  
  useEffect(() => {
    if (!open || !currentUser) return;
    
    setLoading(true);
    const contactsColRef = collection(db, 'users', currentUser.uid, 'contacts');
    const unsubscribe = onSnapshot(contactsColRef, async (snapshot) => {
      try {
        if (snapshot.empty) {
          setContacts([]);
          setLoading(false);
          return;
        }
        const contactPromises = snapshot.docs.map(contactDoc => getDoc(doc(db, 'users', contactDoc.id)));
        const contactDocs = await Promise.all(contactPromises);
        const contactsData = contactDocs
          .filter(doc => doc.exists())
          .map(doc => ({ id: doc.id, ...doc.data() } as User));
        setContacts(contactsData);
      } catch (error) {
        console.error("Error fetching contacts for forwarding:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [open, currentUser]);

  const handleToggleContact = (contactId: string) => {
    setSelectedContacts(prev => 
      prev.includes(contactId) 
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };
  
  const handleForwardClick = async () => {
      setIsForwarding(true);
      await onForward(selectedContacts);
      setIsForwarding(false);
  }

  const filteredContacts = contacts.filter(contact => 
    contact.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="sm:max-w-[425px] flex flex-col h-[70vh]">
        <DialogHeader>
          <DialogTitle>پیغام فارورڈ کریں</DialogTitle>
        </DialogHeader>
        <div className="relative">
            <Input 
                placeholder="رابطے تلاش کریں..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
        <ScrollArea className="flex-1 -mx-6">
          <div className="px-6">
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <Skeleton className="h-5 flex-1" />
                </div>
              ))}
            </div>
          ) : filteredContacts.length > 0 ? (
            filteredContacts.map(contact => (
              <div
                key={contact.id}
                onClick={() => handleToggleContact(contact.id)}
                className="flex items-center gap-4 p-2 -mx-2 rounded-md hover:bg-muted/50 cursor-pointer"
              >
                <Checkbox 
                    id={`contact-${contact.id}`}
                    checked={selectedContacts.includes(contact.id)}
                    onCheckedChange={() => handleToggleContact(contact.id)}
                />
                <Avatar className="h-10 w-10 border">
                  <AvatarImage src={contact.avatarUrl} alt={contact.name} data-ai-hint="person avatar" />
                  <AvatarFallback>{contact.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <Label htmlFor={`contact-${contact.id}`} className="font-semibold flex-1 cursor-pointer">{contact.name}</Label>
              </div>
            ))
          ) : (
            <p className="p-4 text-center text-muted-foreground">کوئی رابطہ نہیں ملا۔</p>
          )}
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>منسوخ کریں</Button>
          <Button 
            onClick={handleForwardClick}
            disabled={selectedContacts.length === 0 || isForwarding}
          >
            {isForwarding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            فارورڈ کریں ({selectedContacts.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
