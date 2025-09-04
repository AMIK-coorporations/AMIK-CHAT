
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
import { db } from "@/lib/firebase";
import { collection, serverTimestamp, query, orderBy, onSnapshot, writeBatch, doc, updateDoc, getDoc } from "firebase/firestore";
// Translation is handled server-side via API to avoid bundling AI SDK on client
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
        const chatDocRef = doc(db, 'chats', chatId);
        const chatDoc = await getDoc(chatDocRef);

        if (chatDoc.exists()) {
          const chatData = chatDoc.data();
          const otherParticipantId = chatData.participantIds.find((participantId: string) => participantId !== currentUser.uid);

          if (otherParticipantId && chatData.participantsInfo) {
            const otherInfo = chatData.participantsInfo[otherParticipantId];
            if (otherInfo) {
              setOtherParticipant({
                id: otherParticipantId,
                name: otherInfo.name ?? otherInfo.displayName ?? 'Unknown',
                avatarUrl: otherInfo.avatarUrl ?? otherInfo.photoURL ?? ''
              });
            }
          }
        }
      } catch (error) {
        console.error("Error fetching chat info:", error);
      }
    };

    fetchChatInfo();
  }, [chatId, currentUser]);

  useEffect(() => {
    const q = query(collection(db, `chats/${chatId}/messages`), orderBy("timestamp", "asc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const msgs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      setMessages(msgs);
      setLoading(false);
      
      // Auto-translate incoming messages that aren't in Urdu
      msgs.forEach(async (msg) => {
        if (msg.senderId !== currentUser?.uid && // Only incoming messages
            !translations[msg.id] && // Not already translated
            !isUrduText(msg.text)) { // Not already in Urdu
          // Auto-translate after a short delay
          setTimeout(() => {
            handleAutoTranslate(msg.id, msg.text);
          }, 1000);
        }
      });
    });

    return () => unsubscribe();
  }, [chatId, currentUser, translations]);
  
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
    
    if (message.senderId !== currentUser.uid) {
      toast({ title: 'آپ صرف اپنے پیغامات حذف کر سکتے ہیں' });
      return;
    }
    
    // Confirm deletion
    if (!confirm('کیا آپ واقعی اس پیغام کو سب کے لیے حذف کرنا چاہتے ہیں؟')) {
      return;
    }
    
    const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
    try {
        await updateDoc(messageRef, {
            text: 'یہ پیغام حذف کر دیا گیا',
            isDeleted: true,
            reactions: {},
            deletedAt: serverTimestamp(),
            deletedBy: currentUser.uid
        });
        
        // Update local state
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, isDeleted: true, text: 'یہ پیغام حذف کر دیا گیا' }
            : msg
        ));
        
        toast({ title: 'پیغام حذف کر دیا گیا', description: 'پیغام سب کے لیے حذف کر دیا گیا ہے۔' });
    } catch (error) {
        console.error("Error deleting message:", error);
        toast({ variant: 'destructive', title: 'خرابی', description: 'پیغام حذف نہیں کیا جا سکا' });
    }
  };

  const handleDeleteForMe = async (messageId: string) => {
    if (!currentUser) return;
    
    const message = messages.find(m => m.id === messageId);
    if (!message || message.isDeleted || message.deletedFor?.[currentUser.uid]) {
      toast({ title: 'پیغام پہلے سے حذف شدہ ہے' });
      return;
    }
    
    try {
      // Mark message as deleted for current user only
      const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
      await updateDoc(messageRef, {
        [`deletedFor.${currentUser.uid}`]: true
      });
      
      // Remove from local state
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, [`deletedFor.${currentUser.uid}`]: true }
          : msg
      ));
      
      toast({ title: 'پیغام حذف کر دیا گیا', description: 'پیغام آپ کے لیے حذف کر دیا گیا ہے۔' });
    } catch (error) {
      console.error("Error deleting message for me:", error);
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
          setTranslations(prev => ({...prev, [messageId]: result.translatedText}));
          
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
    
    const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
    
    try {
        const messageDoc = await getDoc(messageRef);
        if (!messageDoc.exists()) return;
        
        const messageData = messageDoc.data() as Message;
        const reactions = messageData.reactions || {};
        
        const uidsWithThisReaction = reactions[emoji] || [];

        Object.keys(reactions).forEach(key => {
            if (key !== emoji) {
                reactions[key] = reactions[key]?.filter(uid => uid !== currentUser.uid);
                if(reactions[key]?.length === 0) {
                    delete reactions[key];
                }
            }
        });
        
        if (uidsWithThisReaction.includes(currentUser.uid)) {
            reactions[emoji] = uidsWithThisReaction.filter(uid => uid !== currentUser.uid);
            if (reactions[emoji].length === 0) {
                delete reactions[emoji];
            }
        } else {
            reactions[emoji] = [...uidsWithThisReaction, currentUser.uid];
        }
        
        await updateDoc(messageRef, { reactions });
        
    } catch (error) {
        console.error("Error reacting to message:", error);
        toast({ variant: 'destructive', title: 'خرابی', description: 'ردعمل نہیں دے سکے' });
    }
  };

  const handleForwardMessage = async (selectedContactIds: string[]) => {
    if (!messageToForward || !currentUser || !userData) return;

    const toastRef = toast({ description: "فارورڈ کیا جا رہا ہے..." });

    try {
        const batch = writeBatch(db);
        
        const contactDocs = await Promise.all(
            selectedContactIds.map(id => getDoc(doc(db, 'users', id)))
        );

        for (const contactDoc of contactDocs) {
            if (!contactDoc.exists()) continue;
            const contact = { id: contactDoc.id, ...contactDoc.data() } as User;

            const chatId = await createOrNavigateToChat(currentUser.uid, userData, contact);
            const chatRef = doc(db, 'chats', chatId);
            const messagesColRef = collection(chatRef, 'messages');
            const newMessageRef = doc(messagesColRef);

            const timestamp = serverTimestamp();
            
            const forwardedMessageData: Partial<Message> = {
                text: messageToForward.text,
                senderId: currentUser.uid,
                timestamp: timestamp,
                isRead: false,
                isForwarded: true,
            };

            batch.set(newMessageRef, forwardedMessageData);
            batch.update(chatRef, {
                lastMessage: {
                    text: forwardedMessageData.text,
                    senderId: currentUser.uid,
                    timestamp: timestamp,
                    isRead: false,
                }
            });
        }
        
        await batch.commit();
        toast({ title: "کامیابی", description: `پیغام ${selectedContactIds.length} رابطوں کو فارورڈ کر دیا گیا ہے۔` });
        setMessageToForward(null);

    } catch (error) {
        console.error("Error forwarding message:", error);
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
          setTranslations(prev => ({...prev, [messageId]: result.translatedText}));
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
          ) : messages.map((message) => (
            <MessageBubble 
                key={message.id} 
                message={message}
                translation={translations[message.id]}
                isTranslated={!!translations[message.id]}
                isTranslating={translatingId === message.id}
                onCopy={handleCopy}
                onTranslate={handleToggleTranslation}
                onDeleteForEveryone={handleDeleteMessage}
                onForward={() => setMessageToForward(message)}
                onReact={handleReactToMessage}
                onDeleteForMe={() => handleDeleteForMe(message.id)}
            />
          ))}
        </div>
      </ScrollArea>
      <ForwardMessageDialog
        message={messageToForward}
        onClose={() => setMessageToForward(null)}
        onForward={handleForwardMessage}
      />
      <ChatInput 
        chatId={chatId} 
        onMessageSent={() => {}} 
        remoteUserId={otherParticipant?.id}
      />
    </div>
  );
}
