import type { Timestamp, FieldValue } from "firebase/firestore";

export type User = {
  id: string;
  name: string;
  avatarUrl: string;
};

export type Message = {
  id:string;
  text: string;
  timestamp: Timestamp | FieldValue;
  senderId: string;
  isRead: boolean;
  isDeleted?: boolean;
  reactions?: Record<string, string[]>; // emoji -> user IDs
  isForwarded?: boolean;
};

export type Chat = {
  id: string;
  participantIds: string[];
  participantsInfo: {
    [key: string]: {
      name: string;
      avatarUrl: string;
    }
  };
  lastMessage?: {
    text: string;
    senderId: string;
    timestamp: Timestamp | FieldValue;
    isRead: boolean;
  } | null;
  createdAt?: Timestamp | FieldValue;
};
