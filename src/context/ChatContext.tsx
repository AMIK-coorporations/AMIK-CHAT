"use client";

import React, { createContext, useContext } from 'react';
import type { Chat } from '@/lib/types';

interface ChatContextType {
    chats: Chat[];
    loading: boolean;
}

const ChatContext = createContext<ChatContextType>({
    chats: [],
    loading: true,
});

export const useChatContext = () => useContext(ChatContext);

export const ChatProvider = ({
    children,
    value
}: {
    children: React.ReactNode;
    value: ChatContextType
}) => {
    return (
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    );
};
