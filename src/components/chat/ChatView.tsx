
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
import { translateText } from "@/ai/flows/translate-text";
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
    });

    return () => unsubscribe();
  }, [chatId]);
  
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
    const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
    try {
        await updateDoc(messageRef, {
            text: 'یہ پیغام حذف کر دیا گیا',
            isDeleted: true,
            reactions: {},
        });
        toast({ title: 'پیغام حذف کر دیا گیا' });
    } catch (error) {
        console.error("Error deleting message:", error);
        toast({ variant: 'destructive', title: 'خرابی', description: 'پیغام حذف نہیں کیا جا سکا' });
    }
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
    try {
        const result = await translateText({ text: textToTranslate, targetLanguage: 'English' });
        setTranslations(prev => ({...prev, [messageId]: result.translatedText}));
    } catch (error) {
        console.error("Error translating message:", error);
        toast({ variant: 'destructive', title: 'ترجمہ میں خرابی', description: 'پیغام کا ترجمہ نہیں کیا جا سکا۔' });
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
                onDeleteForMe={showComingSoonToast}
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
          <Button type="submit" size="icon" disabled={!newMessage.trim() || !currentUser}>
            <SendHorizonal className="h-5 w-5" />
            <span className="sr-only">بھیجیں</span>
          </Button>
        </form>
      </div>
    </div>
  );
}
