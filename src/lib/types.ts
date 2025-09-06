import type { Timestamp, FieldValue } from "firebase/firestore";

export interface User {
  id: string;
  email: string;
  displayName: string;
  name?: string;
  avatarUrl?: string;
  photoURL?: string;
  phoneNumber?: string;
  createdAt: Date;
  lastSeen: Date;
  isOnline: boolean;
  status?: string;
  bio?: string;
}

export interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: any;
  isRead: boolean;
  isDeleted?: boolean;
  deletedFor?: Record<string, boolean>;
  deletedAt?: any;
  deletedBy?: string;
  isForwarded?: boolean;
  reactions?: Record<string, string[]>;
  type?: 'text' | 'voice' | 'file' | 'image' | 'location';
  // Voice message properties
  audioUrl?: string;
  duration?: number;
  // File properties
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  // Image properties
  imageUrl?: string;
  // Location properties
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface Chat {
  id: string;
  participants: string[];
  participantsInfo?: Record<string, any>; // Add this line
  lastMessage?: {
    text: string;
    senderId: string;
    timestamp: any;
    isRead: boolean;
  };
  createdAt: any;
  updatedAt: any;
  unreadCount?: Record<string, number>;
}
