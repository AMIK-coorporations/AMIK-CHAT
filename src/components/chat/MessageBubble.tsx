
"use client";

import type { Message } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Loader2, CornerUpRight, CheckCircle2 } from "lucide-react";
import { Popover, PopoverTrigger } from "@/components/ui/popover";
import ChatMessageActions from './ChatMessageActions';

interface MessageBubbleProps {
    message: Message;
    translation?: string;
    isTranslated: boolean;
    isTranslating: boolean;
    onDeleteForEveryone: (messageId: string) => void;
    onTranslate: (messageId: string, text: string) => void;
    onForward: (message: Message) => void;
    onReact: (messageId: string, emoji: string) => void;
    onDeleteForMe: () => void;
    onCopy: (text: string) => void;
}

export default function MessageBubble({ message, translation, isTranslated, isTranslating, ...handlers }: MessageBubbleProps) {
  const { user: currentUser } = useAuth();
  const isSentByMe = message.senderId === currentUser?.uid;

  const hasReactions = message.reactions && Object.values(message.reactions).some(uids => uids.length > 0);

  return (
    <div className={cn("flex flex-col gap-1.5", isSentByMe ? "items-end" : "items-start")}>
      <Popover>
        <PopoverTrigger asChild>
          <div
            className={cn(
              "group relative max-w-sm rounded-lg px-3 py-2 lg:max-w-lg cursor-pointer",
              isSentByMe
                ? "rounded-br-none bg-primary text-primary-foreground"
                : "rounded-bl-none bg-card text-card-foreground border",
              message.isDeleted && "bg-muted text-muted-foreground italic",
              hasReactions && "pb-5"
            )}
            onContextMenu={(e) => e.preventDefault()}
          >
            {message.isForwarded && !message.isDeleted && (
              <div className="flex items-center gap-1 text-xs opacity-70 mb-1">
                  <CornerUpRight className="h-3 w-3" />
                  <span>فارورڈ شدہ</span>
              </div>
            )}
            <p className="text-base" style={{ wordBreak: 'break-word' }}>
                {message.text}
            </p>
            {hasReactions && (
              <div className={cn("absolute -bottom-3 flex items-center gap-0.5 z-10", isSentByMe ? "right-2" : "left-2")}>
                  {Object.entries(message.reactions!).map(([emoji, uids]) => (
                      uids.length > 0 && (
                          <div key={emoji} className="flex items-center bg-background border rounded-full px-1.5 py-0.5 shadow-sm text-xs">
                              <span>{emoji}</span>
                              {uids.length > 1 && <span className="ml-1 text-muted-foreground">{uids.length}</span>}
                          </div>
                      )
                  ))}
              </div>
            )}
          </div>
        </PopoverTrigger>
        <ChatMessageActions message={message} isTranslated={isTranslated} {...handlers} />
      </Popover>

      {isTranslating && (
          <div className={cn(
              "flex items-center gap-2 text-sm max-w-sm rounded-lg px-3 py-2 lg:max-w-lg",
              isSentByMe
                  ? "rounded-br-none bg-primary text-primary-foreground"
                  : "rounded-bl-none bg-card text-card-foreground border"
          )}>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>ترجمہ کیا جا رہا ہے...</span>
          </div>
      )}
      
      {translation && !isTranslating && (
          <div className={cn(
              "max-w-sm rounded-lg px-3 py-2 lg:max-w-lg",
              isSentByMe
                  ? "rounded-br-none bg-primary text-primary-foreground"
                  : "rounded-bl-none bg-card text-card-foreground border"
          )}>
              <p className="text-base" style={{ wordBreak: 'break-word' }}>
                  {translation}
              </p>
              <div className="flex items-center gap-1.5 text-xs opacity-80 pt-1.5 mt-1.5 border-t border-t-black/10 dark:border-t-white/20">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>اے ایم آئی کے سے ترجمہ شدہ</span>
              </div>
          </div>
      )}
    </div>
  );
}
