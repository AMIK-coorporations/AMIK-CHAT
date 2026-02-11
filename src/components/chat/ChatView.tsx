
"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Message } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";
import { SendHorizonal } from "lucide-react";
import MessageBubble from "./MessageBubble";
import { Label } from "@/components/ui/label";
import { onSnapshotFromInsforge, getQueryFromInsforge, setDocInInsforge, updateDocInInsforge, getDocFromInsforge } from '@/lib/insforgeUtils';
import { useToast } from "@/hooks/use-toast";
import ForwardMessageDialog from "./ForwardMessageDialog";
import { createOrNavigateToChat } from "@/lib/chatUtils";
import type { User } from '@/lib/types';
import ChatInput from "./ChatInput";

export default function ChatView({ chatId }: { chatId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const { user: currentUser, userData } = useAuth();
  const { toast } = useToast();

  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [translatingId, setTranslatingId] = useState<string | null>(null);
  const [messageToForward, setMessageToForward] = useState<Message | null>(null);
  const [otherParticipant, setOtherParticipant] = useState<User | null>(null);

  // Fetch chat info and other participant
  useEffect(() => {
    if (!currentUser) return;

    const fetchChatInfo = async () => {
      try {
        const chatData = await getDocFromInsforge<any>('chats', chatId);

        if (chatData) {
          const otherParticipantId = chatData.participantIds?.find((participantId: string) => participantId !== currentUser.id);

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
        }
      } catch (error) {
        console.error("Error fetching chat info via InsForge:", error);
      }
    };

    fetchChatInfo();
  }, [chatId, currentUser?.id]);

  useEffect(() => {
    if (!chatId || !currentUser) {
      setLoading(false);
      return;
    }

    // Set loading timeout
    let loadingTimeout: NodeJS.Timeout | null = setTimeout(() => {
      setLoading(false);
    }, 10000);

    const loadInitialMessages = async () => {
      try {
        const msgs = await getQueryFromInsforge<Message>('messages', q =>
          q.eq('chat_id', chatId).order('timestamp', { ascending: true })
        );

        if (loadingTimeout) {
          clearTimeout(loadingTimeout);
          loadingTimeout = null;
        }

        setMessages(msgs);
        setLoading(false);

        // Auto-translate logic
        msgs.forEach(async (msg) => {
          if (msg.senderId !== currentUser?.id && !translations[msg.id] && !isUrduText(msg.text)) {
            setTimeout(() => handleAutoTranslate(msg.id, msg.text), 1000);
          }
        });
      } catch (error) {
        console.error("Error loading initial messages from InsForge:", error);
        setLoading(false);
      }
    };

    loadInitialMessages();

    // Real-time updates from InsForge
    const insforgeUnsubscribe = onSnapshotFromInsforge(`messages:${chatId}`, 'UPDATE_message', (payload) => {
      setMessages(prev => {
        const index = prev.findIndex(m => m.id === payload.id);
        if (index >= 0) {
          const newMsgs = [...prev];
          newMsgs[index] = { ...newMsgs[index], ...payload };
          return newMsgs;
        } else {
          if (payload.chatId === chatId) {
            const newMsgs = [...prev, payload].sort((a, b) =>
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            );
            return newMsgs;
          }
        }
        return prev;
      });
    });

    return () => {
      if (loadingTimeout) clearTimeout(loadingTimeout);
      insforgeUnsubscribe();
    };
  }, [chatId, currentUser?.id]);
  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messages, translations]);



  const showComingSoonToast = () => {
    toast({ title: "فیچر جلد آرہا ہے۔" });
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!currentUser) return;

    const message = messages.find(m => m.id === messageId);
    if (!message) {
      toast({ title: 'پیغام نہیں مل سکا' });
      return;
    }

    if (message.isDeleted) {
      toast({ title: 'پیغام پہلے سے حذف شدہ ہے' });
      return;
    }

    if (message.senderId !== currentUser.id) {
      toast({ title: 'آپ صرف اپنے پیغامات حذف کر سکتے ہیں' });
      return;
    }

    // Confirm deletion
    if (!confirm('کیا آپ واقعی اس پیغام کو سب کے لیے حذف کرنا چاہتے ہیں؟')) {
      return;
    }

    try {
      const timestamp = new Date();
      await updateDocInInsforge('messages', messageId, {
        text: 'یہ پیغام حذف کر دیا گیا',
        isDeleted: true,
        reactions: {},
        deletedAt: timestamp,
        deletedBy: currentUser.id
      });

      // Update local state
      setMessages(prev => prev.map(msg =>
        msg.id === messageId
          ? { ...msg, isDeleted: true, text: 'یہ پیغام حذف کر دیا گیا' }
          : msg
      ));

      toast({ title: 'پیغام حذف کر دیا گیا', description: 'پیغام سب کے لیے حذف کر دیا گیا ہے۔' });
    } catch (error) {
      console.error("Error deleting message via InsForge:", error);
      toast({ variant: 'destructive', title: 'خرابی', description: 'پیغام حذف نہیں کیا جا سکا' });
    }
  };

  const handleDeleteForMe = async (messageId: string) => {
    if (!currentUser) return;

    const message = messages.find(m => m.id === messageId);
    if (!message || message.isDeleted || message.deletedFor?.[currentUser.id]) {
      toast({ title: 'پیغام پہلے سے حذف شدہ ہے' });
      return;
    }

    try {
      // Mark message as deleted for current user only
      await updateDocInInsforge('messages', messageId, {
        [`deletedFor.${currentUser.id}`]: true
      });

      // Remove from local state
      setMessages(prev => prev.map(msg =>
        msg.id === messageId
          ? { ...msg, [`deletedFor.${currentUser.id}`]: true }
          : msg
      ));

      toast({ title: 'پیغام حذف کر دیا گیا', description: 'پیغام آپ کے لیے حذف کر دیا گیا ہے۔' });
    } catch (error) {
      console.error("Error deleting message for me via InsForge:", error);
      toast({ variant: 'destructive', title: 'خرابی', description: 'پیغام حذف نہیں کیا جا سکا' });
    }
  };

  const fallbackTranslation = (text: string): string => {
    // Return original text if no AI translation available
    return text;
  };

  const handleToggleTranslation = async (messageId: string, textToTranslate: string) => {
    if (translatingId === messageId) return;

    if (translations[messageId]) {
      const newTranslations = { ...translations };
      delete newTranslations[messageId];
      setTranslations(newTranslations);
      return;
    }

    setTranslatingId(messageId);

    const targetLanguage = 'Urdu';

    try {
      // Show translation progress for long messages
      if (textToTranslate.length > 100) {
        toast({
          title: 'ترجمہ جاری ہے',
          description: 'بڑے پیغام کا ترجمہ ہو رہا ہے، براہ کرم انتظار کریں...'
        });
      }

      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToTranslate, targetLanguage })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`);
      }

      const result = await res.json();

      if (result.translatedText) {
        setTranslations(prev => ({ ...prev, [messageId]: result.translatedText }));

        // Show success message with metadata for long translations
        if (textToTranslate.length > 100) {
          toast({
            title: 'ترجمہ مکمل',
            description: `${result.sourceLanguage} سے اردو میں ترجمہ مکمل ہوا۔ ${result.originalLength} حروف کا ترجمہ ${result.translatedLength} حروف میں۔`
          });
        } else {
          toast({
            title: 'ترجمہ مکمل',
            description: `پیغام کا ترجمہ اردو میں کر لیا گیا ہے۔`
          });
        }
      } else {
        throw new Error('No translation received');
      }
    } catch (error) {
      console.error("Error translating message:", error);

      // If AI translation fails, show error and keep original text
      toast({
        variant: 'destructive',
        title: 'ترجمہ ناکام',
        description: 'AI ترجمہ سسٹم فی الحال دستیاب نہیں ہے۔ براہ کرم بعد میں کوشش کریں۔'
      });

      // Don't set any fallback translation, keep original text
    } finally {
      setTranslatingId(null);
    }
  };

  const handleReactToMessage = async (messageId: string, emoji: string) => {
    if (!currentUser) return;

    try {
      const messageData = await getDocFromInsforge<Message>('messages', messageId);
      if (!messageData) return;

      const reactions = messageData.reactions || {};
      const uidsWithThisReaction = reactions[emoji] || [];

      Object.keys(reactions).forEach(key => {
        if (key !== emoji) {
          reactions[key] = reactions[key]?.filter(id => id !== currentUser.id);
          if (reactions[key]?.length === 0) {
            delete reactions[key];
          }
        }
      });

      if (uidsWithThisReaction.includes(currentUser.id)) {
        reactions[emoji] = uidsWithThisReaction.filter(id => id !== currentUser.id);
        if (reactions[emoji].length === 0) {
          delete reactions[emoji];
        }
      } else {
        reactions[emoji] = [...uidsWithThisReaction, currentUser.id];
      }

      await updateDocInInsforge('messages', messageId, { reactions });

    } catch (error) {
      console.error("Error reacting to message via InsForge:", error);
      toast({ variant: 'destructive', title: 'خرابی', description: 'ردعمل نہیں دے سکے' });
    }
  };

  const handleForwardMessage = async (selectedContactIds: string[]) => {
    if (!messageToForward || !currentUser || !userData) return;

    const toastRef = toast({ description: "فارورڈ کیا جا رہا ہے..." });

    try {
      const contactDocs = await Promise.all(
        selectedContactIds.map(id => getDocFromInsforge<User>('users', id))
      );

      for (const contact of contactDocs) {
        if (!contact) continue;

        const chatId = await createOrNavigateToChat(currentUser.id, userData, contact);
        const messageId = crypto.randomUUID();
        const timestamp = new Date();

        const forwardedMessageData: Partial<Message> = {
          id: messageId,
          text: messageToForward.text,
          senderId: currentUser.id,
          timestamp: timestamp,
          isRead: false,
          isForwarded: true,
          chatId: chatId,
          type: messageToForward.type || 'text'
        };

        // InsForge Only - Forwarded Message
        await setDocInInsforge('messages', messageId, forwardedMessageData);

        await updateDocInInsforge('chats', chatId, {
          lastMessage: {
            text: forwardedMessageData.text,
            senderId: currentUser.id,
            timestamp: timestamp,
            isRead: false,
          },
          updatedAt: timestamp
        });
      }

      toast({ title: "کامیابی", description: `پیغام ${selectedContactIds.length} رابطوں کو فارورڈ کر دیا گیا ہے۔` });
      setMessageToForward(null);

    } catch (error) {
      console.error("Error forwarding message via InsForge:", error);
      toast({ variant: 'destructive', title: 'خرابی', description: 'پیغام فارورڈ نہیں کیا جا سکا' });
    } finally {
      toastRef.dismiss();
    }
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'کاپی ہو گیا',
      description: 'پیغام کلپ بورڈ پر کاپی کر لیا گیا ہے۔',
    });
  };

  // Helper function to check if text is in Urdu/Arabic script
  const isUrduText = (text: string): boolean => {
    return /[\u0600-\u06FF]/.test(text);
  };

  // Enhanced auto-translation for incoming messages
  const handleAutoTranslate = async (messageId: string, textToTranslate: string) => {
    // Don't auto-translate if already translated or if it's a short message
    if (translations[messageId] || textToTranslate.length < 10) return;

    // Don't auto-translate if it's already in Urdu
    if (isUrduText(textToTranslate)) return;

    try {
      const targetLanguage = 'Urdu';

      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToTranslate, targetLanguage })
      });

      if (res.ok) {
        const result = await res.json();
        if (result.translatedText) {
          setTranslations(prev => ({ ...prev, [messageId]: result.translatedText }));
          console.log(`Auto-translated message ${messageId}: ${textToTranslate.substring(0, 50)}...`);
        }
      }
    } catch (error) {
      console.error("Auto-translation error:", error);
      // Silent fail for auto-translation
    }
  };



  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <ScrollArea className="flex-1" ref={scrollAreaRef}>
        <div className="space-y-4 p-4">
          {loading ? (
            <p className="text-center text-muted-foreground">پیغامات لوڈ ہو رہے ہیں...</p>
          ) : messages.length === 0 ? (
            <p className="text-center text-muted-foreground">ابھی تک کوئی پیغام نہیں۔ گفتگو شروع کریں!</p>
          ) : messages.map((msg) => {
            const isMe = msg.senderId === currentUser?.id;
            // Handle timestamp: it could be a string (ISO), a Date object, or a Firestore-like object
            const ts = msg.timestamp;
            const msgDate = ts && typeof ts === 'object' && 'seconds' in ts
              ? new Date(ts.seconds * 1000)
              : new Date(ts || Date.now());

            const showDateSeparator = false; // Placeholder for now

            return (
              <div key={msg.id} id={`message-${msg.id}`}>
                {showDateSeparator && (
                  <div className="flex items-center justify-center my-4">
                    <span className="bg-muted text-muted-foreground text-xs px-2 py-1 rounded-full">
                      {/* {formatDateSeparator(msgDate)} */} {/* Uncomment and implement formatDateSeparator if needed */}
                    </span>
                  </div>
                )}
                <MessageBubble
                  message={msg}
                  senderName={isMe ? (userData?.name || currentUser?.displayName || 'You') : (otherParticipant?.name || 'User')}
                  senderAvatar={isMe ? (userData?.avatarUrl || currentUser?.photoURL || '') : (otherParticipant?.avatarUrl || '')}
                  isTranslated={!!translations[msg.id]}
                  translation={translations[msg.id]}
                  isTranslating={translatingId === msg.id}
                  onDeleteForEveryone={handleDeleteMessage} // Assuming handleDeleteMessage is the correct function
                  onTranslate={handleToggleTranslation} // Assuming handleToggleTranslation is the correct function
                  onForward={(m) => setMessageToForward(m)}
                  onReact={handleReactToMessage} // Assuming handleReactToMessage is the correct function
                  onDeleteForMe={() => handleDeleteForMe(msg.id)} // Assuming this function exists in scope
                  onCopy={handleCopy}
                />
              </div>
            );
          })}
        </div>
      </ScrollArea>
      <ForwardMessageDialog
        message={messageToForward}
        onClose={() => setMessageToForward(null)}
        onForward={handleForwardMessage}
      />
      <ChatInput
        chatId={chatId}
        onMessageSent={() => { }}
        remoteUserId={otherParticipant?.id}
      />
    </div>
  );
}
