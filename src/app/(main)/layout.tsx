
"use client";

import BottomNav from "@/components/BottomNav";
import { useAuth } from '@/hooks/useAuth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState, useRef, cloneElement } from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import type { Chat } from "@/lib/types";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export default function MainAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { toast, dismiss } = useToast();
  const notifiedMessageKeys = useRef(new Set<string>());
  
  const [chats, setChats] = useState<Chat[]>([]);
  const [chatsLoading, setChatsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) {
        setChatsLoading(false);
        return;
    }

    const chatsQuery = query(
      collection(db, 'chats'),
      where('participantIds', 'array-contains', user.uid)
    );

    const unsubscribe = onSnapshot(chatsQuery, (snapshot) => {
        setChatsLoading(true);
        const chatsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Chat[];
        
        chatsData.sort((a, b) => {
            const t1: any = a.lastMessage?.timestamp as any;
            const c1: any = a.createdAt as any;
            const t2: any = b.lastMessage?.timestamp as any;
            const c2: any = b.createdAt as any;
            const timeA = (typeof t1?.toDate === 'function' ? t1.toDate().getTime() : (typeof c1?.toDate === 'function' ? c1.toDate().getTime() : 0));
            const timeB = (typeof t2?.toDate === 'function' ? t2.toDate().getTime() : (typeof c2?.toDate === 'function' ? c2.toDate().getTime() : 0));
            return timeB - timeA;
        });

        setChats(chatsData);

        snapshot.docChanges().forEach(async (change) => {
            if (change.type === 'added' || change.type === 'modified') {
            const chat = change.doc.data() as Chat;
            const chatId = change.doc.id;
            const { lastMessage } = chat;

            const isViewingChat = pathname === `/chats/${chatId}`;

            if (lastMessage && lastMessage.senderId !== user.uid && !lastMessage.isRead && !isViewingChat) {
                const messageTimestamp = lastMessage.timestamp?.toMillis() ?? Date.now();
                const messageKey = `${chatId}-${messageTimestamp}`;

                if (notifiedMessageKeys.current.has(messageKey)) {
                return;
                }
                notifiedMessageKeys.current.add(messageKey);

                const senderInfo = chat.participantsInfo?.[lastMessage.senderId];
                if (!senderInfo) return;

                const toastId = `new-message-${messageKey}`;
                
                toast({
                id: toastId,
                className: "bg-primary text-primary-foreground p-2 rounded-full cursor-pointer w-auto max-w-[320px] shadow-lg data-[state=open]:sm:slide-in-from-bottom-full",
                duration: 6000,
                description: (
                    <div 
                    className="flex items-center gap-2" 
                    onClick={() => {
                        router.push(`/chats/${chatId}`);
                        dismiss(toastId);
                    }}
                    >
                    <Avatar className="h-8 w-8 border">
                        <AvatarImage src={senderInfo.avatarUrl} alt={senderInfo.name} data-ai-hint="person avatar" />
                        <AvatarFallback>{senderInfo.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden">
                        <p className="font-semibold truncate">{senderInfo.name}</p>
                        <p className="text-sm truncate">{lastMessage.text}</p>
                    </div>
                    </div>
                )
                });
            }
            }
        });
        setChatsLoading(false);
    },
    (error) => {
      console.error("Firestore permission error in main layout:", error);
      setChatsLoading(false);
      if (error.code === 'permission-denied') {
        toast({
          variant: "destructive",
          title: "اجازت کی خرابی",
          description: "چیٹ کی فہرست لوڈ نہیں ہو سکی۔ براہ کرم 'chats' کلیکشن سے استفسار کی اجازت دینے کے لیے اپنے Firestore سیکیورٹی قوانین کو چیک کریں۔",
          duration: 10000,
        });
      }
    });

    return () => unsubscribe();
  }, [user, pathname, router, toast, dismiss]);

  if (authLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
         <div className="w-full max-w-sm space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-12 w-full" />
         </div>
      </div>
    );
  }

  // Inject props into the child component if it's the ChatsPage
  const childrenWithProps = cloneElement(children as React.ReactElement, {
    ...(pathname === '/chats' ? { chats: chats, loading: chatsLoading } : {}),
  });

  return (
    <div className="mx-auto flex h-screen max-w-2xl flex-col bg-background">
      <main className="flex-1 overflow-y-auto pb-20">
        {childrenWithProps}
      </main>
      <BottomNav />
    </div>
  );
}
