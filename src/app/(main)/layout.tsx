"use client";

import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/hooks/useAuth";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import type React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import type { Chat } from "@/lib/types";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { MiniProgramsTopSheet } from "@/components/MiniProgramsTopSheet";
import { ChatProvider } from "@/context/ChatContext";
import { onSnapshotFromInsforge, getQueryFromInsforge, getDocFromInsforge } from "@/lib/insforgeUtils";

export default function MainAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, userData, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { toast, dismiss } = useToast();
  const notifiedMessageKeys = useRef<Set<string>>(new Set());

  const [chats, setChats] = useState<Chat[]>([]);
  const [chatsLoading, setChatsLoading] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [miniOpen, setMiniOpen] = useState(false);
  const mainRef = useRef<HTMLDivElement | null>(null);
  const pullStartYRef = useRef<number | null>(null);
  const [isPulling, setIsPulling] = useState(false);

  // pathname کو ref میں رکھیں تاکہ ہر صفحہ بدلنے پر چیٹس دوبارہ لوڈ اور ریئل ٹائم دوبارہ سبسکرائب نہ ہو
  const pathnameRef = useRef(pathname);
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  // جو چیٹس ایک بار درست (self-heal) ہو چکیں انہیں اس سیشن میں دوبارہ نہ چھیڑیں
  const healedChatIds = useRef<Set<string>>(new Set());

  // لاگ اِن نہیں (یا سیشن ختم) تو خالی اسکرین کے بجائے لاگ اِن صفحے پر بھیجیں
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!authLoading && user) {
      const hasPendingOtp = typeof window !== 'undefined' && sessionStorage.getItem(`otp_${user.id}`);
      if (userData?.isOtpVerified === false || hasPendingOtp) {
        router.replace('/otp');
      }
    }
  }, [user, userData, authLoading, router]);

  useEffect(() => {
    const hasPendingOtp = user && typeof window !== 'undefined' && sessionStorage.getItem(`otp_${user.id}`);
    if (!user || userData?.isOtpVerified === false || hasPendingOtp) {
      setChatsLoading(false);
      return;
    }

    const fetchChats = async () => {
      // Only show loading on initial load
      if (!initialLoadComplete) {
        setChatsLoading(true);
      }
      try {
        // Equivalent of array-contains in InsForge (PostgreSQL)
        const data = await getQueryFromInsforge<Chat>('chats', (q) =>
          q.filter('participant_ids', 'cs', `{"${user.id}"}`)
        );

        const chatsData = data || [];
        chatsData.sort((a: any, b: any) => {
          const timeA = new Date(a.lastMessage?.timestamp || a.createdAt || 0).getTime();
          const timeB = new Date(b.lastMessage?.timestamp || b.createdAt || 0).getTime();
          return timeB - timeA;
        });
        setChats(chatsData);

        // Self-healing: Check for missing participant info and fix it
        chatsData.forEach(async (chat) => {
          if (healedChatIds.current.has(chat.id)) return;
          const otherId = chat.participantIds.find(id => id !== user.id) || user.id;
          if (!chat.participantsInfo || !chat.participantsInfo[otherId] || !chat.participantsInfo[user.id]) {
            healedChatIds.current.add(chat.id);
            console.log(`Self-healing chat ${chat.id}: missing info for ${otherId} or ${user.id}`);
            try {
              // Fetch missing user data
              let updates: any = {};
              let paramsToFetch = [otherId];
              if (otherId !== user.id) paramsToFetch.push(user.id);

              const usersData = await Promise.all(paramsToFetch.map(async (uid) => {
                const u = await getDocFromInsforge<any>('users', uid);
                return { uid, data: u };
              }));

              const newParticipantsInfo = { ...(chat.participantsInfo || {}) };

              usersData.forEach(({ uid, data }) => {
                if (data) {
                  newParticipantsInfo[uid] = {
                    name: data.name || data.displayName || 'User',
                    avatarUrl: data.avatarUrl || data.photoURL || '',
                    email: data.email
                  };
                }
              });

              // Update database if we found new info
              if (JSON.stringify(newParticipantsInfo) !== JSON.stringify(chat.participantsInfo)) {
                const { updateDocInInsforge } = await import("@/lib/insforgeUtils");
                await updateDocInInsforge('chats', chat.id, { participantsInfo: newParticipantsInfo });
                console.log(`Self-healed chat ${chat.id}`);
              }
            } catch (err) {
              console.error(`Failed to self-heal chat ${chat.id}`, err);
            }
          }
        });

      } catch (error) {
        console.error("Failed to fetch chats from InsForge:", error);
      } finally {
        setChatsLoading(false);
        setInitialLoadComplete(true);
      }
    };

    fetchChats();

    // Subscribe to REALTIME chat updates
    const unsubscribe = onSnapshotFromInsforge(`chats:*`, '*', (payload: any) => {
      if (payload?.participantIds?.includes(user!.id)) {
        setChats((prev: Chat[]) => {
          const index = prev.findIndex((c: Chat) => c.id === payload.id);
          let newList = [...prev];
          if (index >= 0) {
            newList[index] = { ...newList[index], ...payload };
          } else {
            newList.push(payload);
          }

          const chat = payload as Chat;
          const lastMessage = chat.lastMessage;
          const isViewingChat = pathnameRef.current === `/chats/${chat.id}`;

          if (lastMessage && lastMessage.senderId !== user.id && !lastMessage.isRead && !isViewingChat) {
            const messageKey = `${chat.id}-${lastMessage.timestamp}`;
            if (!notifiedMessageKeys.current.has(messageKey)) {
              notifiedMessageKeys.current.add(messageKey);
              const senderInfo = chat.participantsInfo?.[lastMessage.senderId];
              const toastId = `new-message-${messageKey}`;

              toast({
                id: toastId,
                description: (
                  <div className="flex items-center gap-2 cursor-pointer" onClick={() => { router.push(`/chats/${chat.id}`); dismiss(toastId); }}>
                    <Avatar className="h-8 w-8 border">
                      <AvatarImage src={senderInfo?.avatarUrl} />
                      <AvatarFallback>{senderInfo?.name?.charAt(0) || '?'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden">
                      <p className="font-semibold truncate text-primary">{senderInfo?.name || 'New Message'}</p>
                      <p className="text-sm truncate opacity-80">{lastMessage.text}</p>
                    </div>
                  </div>
                ),
                duration: 5000,
              });
            }
          }

          return newList.sort((a: any, b: any) => {
            const timeA = new Date(a.lastMessage?.timestamp || a.createdAt || 0).getTime();
            const timeB = new Date(b.lastMessage?.timestamp || b.createdAt || 0).getTime();
            return timeB - timeA;
          });
        });
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user?.id, router, toast, dismiss]);

  const handleMainTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const el = mainRef.current;
    if (!el || miniOpen || pathname !== '/chats') return;
    if (el.scrollTop <= 0) {
      pullStartYRef.current = e.touches[0]?.clientY ?? 0;
      setIsPulling(true);
    }
  };

  const handleMainTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isPulling || pullStartYRef.current == null || miniOpen) return;
    const currentY = e.touches[0]?.clientY ?? 0;
    const delta = currentY - pullStartYRef.current;
    if (delta > 60) {
      setMiniOpen(true);
      pullStartYRef.current = null;
      setIsPulling(false);
    }
  };

  const handleMainTouchEnd = () => {
    pullStartYRef.current = null;
    setIsPulling(false);
  };

  if (authLoading || !user || (userData && userData.isOtpVerified === false)) {
    return (
      <div className="flex h-screen items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-4">
          <Skeleton className="h-12 w-3/4 mx-auto" />
          <Skeleton className="h-[400px] w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex h-screen max-w-2xl flex-col bg-background overflow-hidden">
      <ChatProvider value={{ chats, loading: chatsLoading && !initialLoadComplete }}>
        <MiniProgramsTopSheet open={miniOpen} onOpenChange={setMiniOpen} />
        <main
          ref={mainRef}
          className="flex-1 overflow-y-auto pb-20 scroll-smooth"
          onTouchStart={handleMainTouchStart}
          onTouchMove={handleMainTouchMove}
          onTouchEnd={handleMainTouchEnd}
        >
          {children}
        </main>
      </ChatProvider>
      <BottomNav />
    </div>
  );
}
