
"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Users, UserPlus, Loader2, Plus, MessageCircle, ScanLine, Landmark, Clock3, CheckCheck, XCircle } from "lucide-react";
import ContactSuggestions from "@/components/contacts/ContactSuggestions";
import { Button } from "@/components/ui/button";
import { collection, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import type { ContactRequest, User } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from "@/hooks/use-toast";
import { createOrNavigateToChat } from '@/lib/chatUtils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { acceptContactRequest, rejectContactRequest } from '@/lib/contactRequestService';

function ContactItem({ contact, onClick, isCreatingChat }: { contact: User; onClick: () => void; isCreatingChat: boolean; }) {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-4 p-4 hover:bg-muted/50 cursor-pointer"
      data-testid={`contact-item-${contact.id}`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={`${contact.name ?? 'Unknown User'} کے ساتھ چیٹ کریں`}
    >
      <Avatar className="h-10 w-10 border">
        <AvatarImage src={contact.avatarUrl} alt={contact.name ?? 'User'} data-ai-hint="person avatar" />
        <AvatarFallback>{(contact.name ?? 'U').charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 overflow-hidden">
        <p className="font-semibold truncate">{contact.name ?? 'Unknown User'}</p>
      </div>
       {isCreatingChat && <Loader2 className="h-5 w-5 animate-spin" data-testid="creating-chat-spinner" />}
    </div>
  );
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [receivedRequests, setReceivedRequests] = useState<ContactRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<ContactRequest[]>([]);
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);
  const { user: currentUser, userData } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [creatingChat, setCreatingChat] = useState<string | null>(null);
  const { toast } = useToast();

  const activeTab = useMemo(
    () => searchParams?.get('tab') === 'requests' ? 'requests' : 'contacts',
    [searchParams]
  );

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

  useEffect(() => {
    if (!currentUser) {
      setRequestsLoading(false);
      return;
    }

    const requestsColRef = collection(db, 'users', currentUser.uid, 'contactRequests');
    const unsubscribe = onSnapshot(requestsColRef, (snapshot) => {
      setRequestsLoading(true);
      try {
        const reqs = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as ContactRequest));
        setReceivedRequests(reqs.filter(r => r.direction === 'received'));
        setSentRequests(reqs.filter(r => r.direction === 'sent'));
      } catch (error) {
        console.error("Error fetching requests:", error);
      } finally {
        setRequestsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [currentUser]);
  
  const handleStartChat = async (contact: User) => {
    if (!currentUser || !userData) {
      toast({
        variant: 'destructive',
        title: 'خرابی',
        description: 'چیٹ شروع کرنے کے لیے لاگ ان ہونا ضروری ہے',
      });
      return;
    }
    
    if (creatingChat) {
      return; // Already creating a chat
    }
    
    setCreatingChat(contact.id);

    try {
      const chatId = await createOrNavigateToChat(currentUser.uid, userData, contact);
      
      // Clear creating state before navigation
      setCreatingChat(null);
      
      // Use replace to avoid back button issues
      router.replace(`/chats/${chatId}`);
    } catch (error: any) {
      console.error("Error creating or finding chat: ", error);
      setCreatingChat(null);
      
      const errorMessage = error.code === 'permission-denied' 
        ? 'اجازت مسترد کر دی گئی۔ براہ کرم اپنے Firestore سیکیورٹی قوانین کو چیک کریں۔'
        : error.message || 'ایک نامعلوم خرابی پیش آگئی۔';
      
      toast({
        variant: 'destructive',
        title: 'چیٹ شروع کرنے میں خرابی',
        description: errorMessage,
        duration: 5000,
      });
      
      // Fallback: try direct navigation with sorted IDs
      try {
        const fallbackChatId = [currentUser.uid, contact.id].sort().join('_');
        router.push(`/chats/${fallbackChatId}`);
      } catch (fallbackError) {
        console.error('Fallback navigation also failed:', fallbackError);
      }
    }
  };

  const handleAcceptRequest = async (request: ContactRequest) => {
    if (!currentUser || !userData) return;
    setProcessingRequestId(request.id);
    try {
      const { chatId } = await acceptContactRequest({
        currentUserId: currentUser.uid,
        currentUserProfile: userData,
        request,
      });
      toast({ title: 'درخواست قبول کر لی گئی', description: 'اب آپ بات چیت شروع کر سکتے ہیں۔' });
      router.push(`/chats/${chatId}`);
    } catch (error) {
      console.error("Error accepting request:", error);
      toast({
        variant: 'destructive',
        title: 'درخواست قبول نہ ہو سکی',
        description: 'براہ کرم دوبارہ کوشش کریں۔',
      });
    } finally {
      setProcessingRequestId(null);
    }
  };

  const handleRejectRequest = async (request: ContactRequest) => {
    if (!currentUser) return;
    setProcessingRequestId(request.id);
    try {
      await rejectContactRequest({ currentUserId: currentUser.uid, request });
      toast({ title: 'درخواست مسترد کر دی گئی' });
    } catch (error) {
      console.error("Error rejecting request:", error);
      toast({
        variant: 'destructive',
        title: 'مسترد نہ ہو سکی',
        description: 'براہ کرم دوبارہ کوشش کریں۔',
      });
    } finally {
      setProcessingRequestId(null);
    }
  };

  const renderStatusBadge = (status: ContactRequest['status']) => {
    if (status === 'accepted') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 text-green-700 px-2 py-1 text-xs">
          <CheckCheck className="h-3 w-3" /> قبول شدہ
        </span>
      );
    }
    if (status === 'rejected') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 text-red-700 px-2 py-1 text-xs">
          <XCircle className="h-3 w-3" /> مسترد
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-700 px-2 py-1 text-xs">
        <Clock3 className="h-3 w-3" /> زیر التواء
      </span>
    );
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

      <Tabs defaultValue={activeTab} className="w-full">
        <TabsList className="mx-4 mt-4 w-[calc(100%-2rem)]">
          <TabsTrigger value="contacts">رابطے</TabsTrigger>
          <TabsTrigger value="requests">درخواستیں</TabsTrigger>
        </TabsList>

        <TabsContent value="contacts">
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
        </TabsContent>

        <TabsContent value="requests">
          <div className="p-4 space-y-8">
            <section>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold text-muted-foreground">موصولہ درخواستیں</h2>
                {requestsLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              </div>
              {receivedRequests.filter(r => r.status === 'pending').length === 0 ? (
                <p className="text-sm text-muted-foreground">کوئی نئی درخواست نہیں۔</p>
              ) : (
                <div className="space-y-3">
                  {receivedRequests.filter(r => r.status === 'pending').map(request => (
                    <div key={request.id} className="flex items-center gap-3 rounded-lg border p-3">
                      <Avatar className="h-10 w-10 border">
                        <AvatarImage src={request.fromAvatarUrl} alt={request.fromName ?? 'User'} />
                        <AvatarFallback>{(request.fromName ?? 'U').charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{request.fromName ?? 'نامعلوم صارف'}</p>
                        <p className="text-xs text-muted-foreground">AMIK ID: {request.fromUserId}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleAcceptRequest(request)}
                          disabled={processingRequestId === request.id}
                          data-testid={`accept-request-${request.id}`}
                          aria-label="درخواست قبول کریں"
                        >
                          {processingRequestId === request.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'قبول کریں'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRejectRequest(request)}
                          disabled={processingRequestId === request.id}
                          data-testid={`reject-request-${request.id}`}
                          aria-label="درخواست مسترد کریں"
                        >
                          مسترد کریں
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold text-muted-foreground">بھیجی گئی درخواستیں</h2>
                {requestsLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              </div>
              {sentRequests.length === 0 ? (
                <p className="text-sm text-muted-foreground">ابھی تک کوئی درخواست نہیں بھیجی گئی۔</p>
              ) : (
                <div className="space-y-3">
                  {sentRequests.map(request => (
                    <div key={request.id} className="flex items-center gap-3 rounded-lg border p-3">
                      <Avatar className="h-10 w-10 border">
                        <AvatarImage src={request.toAvatarUrl} alt={request.toName ?? 'User'} />
                        <AvatarFallback>{(request.toName ?? 'U').charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{request.toName ?? 'نامعلوم صارف'}</p>
                        <p className="text-xs text-muted-foreground">AMIK ID: {request.toUserId}</p>
                        <p className="text-xs mt-1 text-muted-foreground">
                          {request.status === 'accepted'
                            ? 'آپ کی درخواست قبول کر لی گئی ہے'
                            : request.status === 'rejected'
                              ? 'آپ کی درخواست مسترد کر دی گئی ہے'
                              : 'آپ کی درخواست بھیج دی گئی ہے'}
                        </p>
                      </div>
                      {renderStatusBadge(request.status)}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
