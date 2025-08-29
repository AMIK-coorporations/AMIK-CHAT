
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

export default function ChatView({ chatId }: { chatId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const { user: currentUser, userData } = useAuth();
  const { toast } = useToast();

  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [translatingId, setTranslatingId] = useState<string | null>(null);
  const [messageToForward, setMessageToForward] = useState<Message | null>(null);

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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === "" || !currentUser) return;
    
    const messageText = newMessage;
    setNewMessage("");

    const chatRef = doc(db, 'chats', chatId);
    const messagesColRef = collection(chatRef, 'messages');
    const newMessageRef = doc(messagesColRef);

    const batch = writeBatch(db);

    const timestamp = serverTimestamp();

    const messageData = {
      text: messageText,
      senderId: currentUser.uid,
      timestamp: timestamp,
      isRead: false,
    };
    batch.set(newMessageRef, messageData);

    batch.update(chatRef, {
      lastMessage: {
        text: messageText,
        senderId: currentUser.uid,
        timestamp: timestamp,
        isRead: false,
      }
    });

    await batch.commit();
  };
  
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
    // Simple fallback translation for common words/phrases (to Urdu)
    const englishToUrdu: Record<string, string> = {
      'wahab': 'وہاب',
      'who are you': 'آپ کون ہیں؟',
      'hello': 'ہیلو',
      'hi': 'ہائے',
      'how are you': 'آپ کیسے ہیں؟',
      'good morning': 'صبح بخیر',
      'good night': 'شب بخیر',
      'thank you': 'شکریہ',
      'welcome': 'خوش آمدید',
      'yes': 'ہاں',
      'no': 'نہیں',
      'okay': 'ٹھیک ہے',
      'good': 'اچھا',
      'bad': 'برا',
      'love': 'محبت',
      'friend': 'دوست',
      'family': 'خاندان',
      'home': 'گھر',
      'work': 'کام',
      'time': 'وقت',
      'day': 'دن',
      'night': 'رات',
      'morning': 'صبح',
      'evening': 'شام'
    };

    const lowerText = text.toLowerCase();
    return englishToUrdu[lowerText] || englishToUrdu[text] || `[${text}]`;
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
          toast({ title: 'ترجمہ مکمل', description: `پیغام کا ترجمہ اردو میں کر لیا گیا ہے۔` });
        } else {
          throw new Error('No translation received');
        }
    } catch (error) {
        console.error("Error translating message:", error);
        // Use fallback translation
        const fallbackText = fallbackTranslation(textToTranslate);
        setTranslations(prev => ({...prev, [messageId]: fallbackText}));
        toast({ title: 'ترجمہ مکمل', description: 'پیغام کا ترجمہ اردو میں کر لیا گیا ہے۔ (Fallback)' });
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

  // Auto-translate function for incoming messages
  const handleAutoTranslate = async (messageId: string, textToTranslate: string) => {
    if (translatingId === messageId || translations[messageId]) return;

    setTranslatingId(messageId);
    const targetLanguage = 'Urdu';

    try {
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
        } else {
          throw new Error('No translation received');
        }
    } catch (error) {
        console.error("Error auto-translating message:", error);
        // Use fallback translation
        const fallbackText = fallbackTranslation(textToTranslate);
        setTranslations(prev => ({...prev, [messageId]: fallbackText}));
    } finally {
        setTranslatingId(null);
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
      <div className="border-t bg-background p-4">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <Label htmlFor="message-input" className="sr-only">
            ایک پیغام لکھیں
          </Label>
          <Input
            id="message-input"
            name="message-input"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="ایک پیغام لکھیں..."
            autoComplete="off"
            className="text-base"
          />
          <Button type="submit" className="shrink-0">
            <SendHorizonal className="h-5 w-5" />
            <span className="sr-only">پیغام بھیجیں</span>
          </Button>
        </form>
      </div>
    </div>
  );
}
