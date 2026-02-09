
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

  const isSentByMe = message.senderId === currentUser?.id;
  const isDeletedForMe = message.deletedFor?.[currentUser.id] || false;

  const reactions = ["👍", "❤️", "😂", "😯", "😢", "🙏"];

  const handleActionClick = (action: () => void) => {
    action();
    if (onClose) {
      onClose();
    }
  };

  const handleShare = async () => {
    try {
      // Detect if running in mobile app (WebView)
      const isMobileApp = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) &&
        (window as any).Android !== undefined ||
        (window as any).webkit?.messageHandlers !== undefined;

      // Prepare share content
      let shareText = message.text || '';
      let shareUrl = '';
      let shareTitle = 'AMIK Chat';

      // Handle different message types
      if (message.type === 'image' && message.imageUrl) {
        shareUrl = message.imageUrl;
        shareTitle = message.fileName || 'Image';
        shareText = message.text ? `${message.text}\n\n${message.imageUrl}` : message.imageUrl;
      } else if (message.type === 'file' && message.fileUrl) {
        shareUrl = message.fileUrl;
        shareTitle = message.fileName || 'File';
        shareText = message.text ? `${message.text}\n\n${message.fileUrl}` : message.fileUrl;
      } else if (message.type === 'location' && message.location) {
        const locationUrl = `https://www.google.com/maps?q=${message.location.latitude},${message.location.longitude}`;
        shareUrl = locationUrl;
        shareTitle = 'Location';
        shareText = message.text ? `${message.text}\n\n${locationUrl}` : locationUrl;
      }

      // Try Android Intent sharing (for Android apps)
      if (isMobileApp && (window as any).Android && typeof (window as any).Android.shareText === 'function') {
        try {
          (window as any).Android.shareText(shareText, shareTitle);
          if (onClose) {
            onClose();
          }
          return;
        } catch (androidError) {
          console.log('Android Intent sharing failed, trying Web Share API');
        }
      }

      // Try iOS sharing (for iOS apps)
      if (isMobileApp && (window as any).webkit?.messageHandlers?.share) {
        try {
          (window as any).webkit.messageHandlers.share.postMessage({
            text: shareText,
            url: shareUrl,
            title: shareTitle
          });
          if (onClose) {
            onClose();
          }
          return;
        } catch (iosError) {
          console.log('iOS sharing failed, trying Web Share API');
        }
      }

      // Prepare ShareData for Web Share API
      let shareData: ShareData = {
        text: shareText,
      };

      if (shareUrl) {
        shareData.url = shareUrl;
      }
      if (shareTitle && shareTitle !== 'AMIK Chat') {
        shareData.title = shareTitle;
      }

      // Handle image sharing with File object
      if (message.type === 'image' && message.imageUrl) {
        try {
          const response = await fetch(message.imageUrl);
          const blob = await response.blob();
          const file = new File([blob], message.fileName || 'image.jpg', { type: blob.type });

          if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
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
      }

      // Use Web Share API if available
      if (navigator.share) {
        try {
          // Check if we can share this data
          if (navigator.canShare) {
            if (navigator.canShare(shareData)) {
              await navigator.share(shareData);
              if (onClose) {
                onClose();
              }
              return;
            }
          } else {
            // Some browsers don't support canShare, try sharing anyway
            await navigator.share(shareData);
            if (onClose) {
              onClose();
            }
            return;
          }
        } catch (shareError: any) {
          // If share fails, continue to fallback
          if (shareError.name !== 'AbortError') {
            console.log('Web Share API failed:', shareError);
          } else {
            // User cancelled
            return;
          }
        }
      }

      // Fallback 1: Try to open share via mailto/sms for mobile
      if (isMobileApp || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        // Create a data URI or use tel: or sms: schemes
        const encodedText = encodeURIComponent(shareText);
        const encodedUrl = shareUrl ? encodeURIComponent(shareUrl) : '';

        // Try opening share via intent URL (Android)
        if (/Android/i.test(navigator.userAgent)) {
          const intentUrl = `intent://send?text=${encodedText}${encodedUrl ? `&url=${encodedUrl}` : ''}#Intent;scheme=android.intent;action=android.intent.action.SEND;type=text/plain;end`;
          try {
            window.location.href = intentUrl;
            if (onClose) {
              onClose();
            }
            return;
          } catch (intentError) {
            console.log('Intent URL failed, trying clipboard');
          }
        }
      }

      // Fallback 2: Copy to clipboard
      try {
        const finalShareText = shareText || message.text || message.fileName || message.imageUrl || message.fileUrl || 'Shared from AMIK Chat';
        await navigator.clipboard.writeText(finalShareText);

        // Show success message
        if (onClose) {
          onClose();
        }
        // Use a better notification method if available
        if ('vibrate' in navigator) {
          navigator.vibrate(100);
        }
        alert('متن کاپی کر لیا گیا ہے۔ اب آپ کسی بھی ایپ میں پیسٹ کر سکتے ہیں۔');
      } catch (copyError) {
        console.error('Error copying to clipboard:', copyError);
        alert('برآمد کرنے میں خرابی پیش آگئی۔ براہ کرم دوبارہ کوشش کریں۔');
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
        alert('برآمد کرنے میں خرابی پیش آگئی۔');
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
