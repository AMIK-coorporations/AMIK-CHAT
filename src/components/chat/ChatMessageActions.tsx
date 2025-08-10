
"use client";

import * as React from 'react';
import { PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import type { Message } from "@/lib/types";
import { Copy, Forward, Languages, Trash, Trash2, Plus } from "lucide-react";

interface ChatMessageActionsProps {
  message: Message;
  isTranslated: boolean;
  onDeleteForEveryone: (messageId: string) => void;
  onTranslate: (messageId: string, text: string) => void;
  onForward: (message: Message) => void;
  onReact: (messageId: string, emoji: string) => void;
  onDeleteForMe: () => void;
  onCopy: (text: string) => void;
}

export default function ChatMessageActions({
  message,
  isTranslated,
  onDeleteForEveryone,
  onTranslate,
  onForward,
  onReact,
  onDeleteForMe,
  onCopy
}: ChatMessageActionsProps) {
  const { user: currentUser } = useAuth();

  if (!message) return null;

  const isSentByMe = message.senderId === currentUser?.uid;

  const reactions = ["👍", "❤️", "😂", "😯", "😢", "🙏"];

  const handleActionClick = (action: () => void) => {
    action();
    document.body.click(); 
  };

  const actions = [
    {
      label: "کاپی کریں",
      icon: Copy,
      onClick: () => handleActionClick(() => onCopy(message.text)),
      show: !message.isDeleted,
    },
    {
      label: "فارورڈ کریں",
      icon: Forward,
      onClick: () => handleActionClick(() => onForward(message)),
      show: !message.isDeleted,
    },
    {
      label: isTranslated ? "ترجمہ منسوخ کریں" : "ترجمہ کریں",
      icon: Languages,
      onClick: () => handleActionClick(() => onTranslate(message.id, message.text)),
      show: !message.isDeleted,
    },
    {
      label: "میرے لیے حذف کریں",
      icon: Trash,
      onClick: () => handleActionClick(onDeleteForMe),
      show: true,
      className: "text-destructive hover:text-destructive focus:text-destructive"
    },
    {
      label: "سب کے لیے حذف کریں",
      icon: Trash2,
      onClick: () => handleActionClick(() => onDeleteForEveryone(message.id)),
      show: isSentByMe && !message.isDeleted,
      className: "text-destructive hover:text-destructive focus:text-destructive"
    }
  ];

  return (
    <PopoverContent className="w-auto p-1" side={isSentByMe ? "left" : "right"} align="center">
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
    </PopoverContent>
  );
}
