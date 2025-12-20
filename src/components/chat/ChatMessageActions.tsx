
"use client";

import * as React from 'react';
import { PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import type { Message } from "@/lib/types";
import { Copy, Forward, Languages, Trash, Trash2, Plus, Share2 } from "lucide-react";

interface ChatMessageActionsProps {
  message: Message;
  isTranslated: boolean;
  onDeleteForEveryone: (messageId: string) => void;
  onTranslate: (messageId: string, text: string) => void;
  onForward: (message: Message) => void;
  onReact: (messageId: string, emoji: string) => void;
  onDeleteForMe: () => void;
  onCopy: (text: string) => void;
  onClose?: () => void;
}

export default function ChatMessageActions({
  message,
  isTranslated,
  onDeleteForEveryone,
  onTranslate,
  onForward,
  onReact,
  onDeleteForMe,
  onCopy,
  onClose
}: ChatMessageActionsProps) {
  const { user: currentUser } = useAuth();

  if (!message || !currentUser) return null;

  const isSentByMe = message.senderId === currentUser?.uid;
  const isDeletedForMe = message.deletedFor?.[currentUser.uid] || false;

  const reactions = ["👍", "❤️", "😂", "😯", "😢", "🙏"];

  const handleActionClick = (action: () => void) => {
    action();
    if (onClose) {
      onClose();
    }
  };

  const handleShare = async () => {
    try {
      let shareData: ShareData = {
        text: message.text || '',
      };

      // Handle different message types
      if (message.type === 'image' && message.imageUrl) {
        // For images, try to fetch and share as File
        try {
          const response = await fetch(message.imageUrl);
          const blob = await response.blob();
          const file = new File([blob], message.fileName || 'image.jpg', { type: blob.type });
          
          if (navigator.share && navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: message.fileName || 'Image',
              text: message.text || '',
            });
            if (onClose) {
              onClose();
            }
            return;
          }
        } catch (fileError) {
          console.log('File sharing not supported, falling back to URL');
        }
        
        // Fallback: share URL
        shareData.url = message.imageUrl;
        shareData.title = message.fileName || 'Image';
      } else if (message.type === 'file' && message.fileUrl) {
        shareData.url = message.fileUrl;
        shareData.title = message.fileName || 'File';
      } else if (message.type === 'location' && message.location) {
        const locationUrl = `https://www.google.com/maps?q=${message.location.latitude},${message.location.longitude}`;
        shareData.url = locationUrl;
        shareData.title = 'Location';
        shareData.text = message.text || 'Location shared';
      }

      // Use Web Share API if available
      if (navigator.share) {
        // Check if we can share this data
        if (navigator.canShare && navigator.canShare(shareData)) {
          await navigator.share(shareData);
          if (onClose) {
            onClose();
          }
          return;
        } else if (!navigator.canShare) {
          // Some browsers don't support canShare, try sharing anyway
          await navigator.share(shareData);
          if (onClose) {
            onClose();
          }
          return;
        }
      }

      // Fallback: copy to clipboard
      const shareText = message.text || message.fileName || message.imageUrl || message.fileUrl || 'Shared from AMIK Chat';
      await navigator.clipboard.writeText(shareText);
      alert('متن کاپی کر لیا گیا ہے۔ اب آپ کسی بھی ایپ میں پیسٹ کر سکتے ہیں۔');
      if (onClose) {
        onClose();
      }
    } catch (error: any) {
      // User cancelled sharing (AbortError) - don't show error
      if (error.name === 'AbortError') {
        return;
      }
      
      // Other errors - fallback to copy
      console.error('Error sharing:', error);
      try {
        const shareText = message.text || message.fileName || message.imageUrl || message.fileUrl || 'Shared from AMIK Chat';
        await navigator.clipboard.writeText(shareText);
        alert('متن کاپی کر لیا گیا ہے۔ اب آپ کسی بھی ایپ میں پیسٹ کر سکتے ہیں۔');
      } catch (copyError) {
        console.error('Error copying to clipboard:', copyError);
        alert('شیئر کرنے میں خرابی پیش آگئی۔');
      }
    }
  };

  const actions = [
    {
      label: "کاپی کریں",
      icon: Copy,
      onClick: () => handleActionClick(() => onCopy(message.text)),
      show: !message.isDeleted && !isDeletedForMe,
    },
    {
      label: "برآمد کریں",
      icon: Share2,
      onClick: () => handleActionClick(handleShare),
      show: !message.isDeleted && !isDeletedForMe,
    },
    {
      label: "فارورڈ کریں",
      icon: Forward,
      onClick: () => handleActionClick(() => onForward(message)),
      show: !message.isDeleted && !isDeletedForMe,
    },
    {
      label: isTranslated ? "ترجمہ منسوخ کریں" : "ترجمہ کریں",
      icon: Languages,
      onClick: () => handleActionClick(() => onTranslate(message.id, message.text)),
      show: !message.isDeleted && !isDeletedForMe,
    },
    {
      label: "میرے لیے حذف کریں",
      icon: Trash,
      onClick: () => handleActionClick(onDeleteForMe),
      show: !isDeletedForMe,
      className: "text-destructive hover:text-destructive focus:text-destructive"
    },
    {
      label: "سب کے لیے حذف کریں",
      icon: Trash2,
      onClick: () => handleActionClick(() => onDeleteForEveryone(message.id)),
      show: isSentByMe && !message.isDeleted && !isDeletedForMe,
      className: "text-destructive hover:text-destructive focus:text-destructive"
    }
  ];

  return (
    <>
        {!message.isDeleted && (
            <div className="flex items-center justify-between p-1 mb-1 border-b">
                {reactions.map((r, i) => (
                    <Button key={i} variant="ghost" size="icon" className="h-8 w-8 text-xl" onClick={() => handleActionClick(() => onReact(message.id, r))}>{r}</Button>
                ))}
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleActionClick(() => alert('More reactions coming soon!'))}>
                    <Plus className="h-5 w-5" />
                </Button>
            </div>
        )}
        <div className="flex flex-col gap-0.5">
            {actions.map((action, index) => (
                action.show && (
                    <Button
                        key={index}
                        variant="ghost"
                        className={`justify-start px-2 py-1.5 h-auto text-base ${action.className || ''}`}
                        onClick={action.onClick}
                    >
                        <action.icon className="mr-3 h-5 w-5" />
                        <span>{action.label}</span>
                    </Button>
                )
            ))}
        </div>
    </>
  );
}
