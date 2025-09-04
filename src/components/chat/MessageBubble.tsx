
"use client";

import type { Message } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Loader2, CornerUpRight, CheckCircle2, Play, Pause, Download, MapPin, FileText, ImageIcon } from "lucide-react";
import { Popover, PopoverTrigger } from "@/components/ui/popover";
import ChatMessageActions from './ChatMessageActions';
import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { FileMessageCard } from "./FileCards";

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
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Check if message is deleted for current user
  const isDeletedForMe = message.deletedFor?.[currentUser?.uid || ''] || false;
  
  // Hide message if it's deleted for current user
  if (isDeletedForMe) return null;

  const hasReactions = message.reactions && Object.values(message.reactions).some(uids => uids.length > 0);

  const handleVoicePlay = () => {
    if (!message.audioUrl) return;
    
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  const handleFileDownload = () => {
    if (message.fileUrl) {
      const link = document.createElement('a');
      link.href = message.fileUrl;
      link.download = message.fileName || 'download';
      link.click();
    } else if (message.imageUrl) {
      const link = document.createElement('a');
      link.href = message.imageUrl;
      link.download = message.fileName || 'image';
      link.click();
    }
  };

  const renderMessageContent = () => {
    if (message.isDeleted) {
      return 'یہ پیغام حذف کر دیا گیا';
    }

    // Debug logging
    console.log('Message type:', message.type);
    console.log('Message data:', message);

    switch (message.type) {
      case 'voice':
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleVoicePlay}
              className="h-8 w-8 p-0"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <div className="flex-1">
              <div className="w-32 h-2 bg-gray-300 rounded-full overflow-hidden">
                <div className="h-full bg-current rounded-full" style={{ width: '60%' }} />
              </div>
              <span className="text-xs text-muted-foreground">
                {message.duration ? `${message.duration}s` : 'Voice message'}
              </span>
            </div>
            {message.audioUrl && (
              <audio
                ref={audioRef}
                src={message.audioUrl}
                onEnded={handleAudioEnded}
                className="hidden"
              />
            )}
          </div>
        );

      case 'file':
        return (
          <FileMessageCard
            fileName={message.fileName || 'File'}
            fileSize={message.fileSize || 0}
            fileType={message.fileType || 'application/octet-stream'}
            fileUrl={message.fileUrl || ''}
            onDownload={handleFileDownload}
          />
        );

      case 'image':
        return (
          <FileMessageCard
            fileName={message.fileName || 'Image'}
            fileSize={message.fileSize || 0}
            fileType={message.fileType || 'image/jpeg'}
            fileUrl={message.imageUrl || ''}
            isImage={true}
            onDownload={handleFileDownload}
          />
        );

      case 'location':
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              <span>مقام شیئر کیا گیا</span>
            </div>
            {message.location && (
              <div className="text-sm text-muted-foreground">
                <p>Latitude: {message.location.latitude.toFixed(6)}</p>
                <p>Longitude: {message.location.longitude.toFixed(6)}</p>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (message.location) {
                  const url = `https://www.google.com/maps?q=${message.location.latitude},${message.location.longitude}`;
                  window.open(url, '_blank');
                }
              }}
              className="w-full"
            >
              نقشے میں دیکھیں
            </Button>
          </div>
        );

      default:
        return (
          <p className="text-base text-left" style={{ wordBreak: 'break-word', direction: 'ltr' }}>
            {message.text}
          </p>
        );
    }
  };

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
            {renderMessageContent()}
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
              <p className="text-base text-right" style={{ wordBreak: 'break-word', direction: 'rtl' }}>
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
