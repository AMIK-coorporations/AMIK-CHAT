import { ref, push, set, get } from 'firebase/database';
import { rtdb } from '@/lib/firebase';

export interface FileAttachment {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileData: string; // Base64 encoded
  senderId: string;
  timestamp: number;
  chatId: string;
}

export class FileService {
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private static readonly ALLOWED_TYPES = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain', 'application/json', 'application/xml'
  ];

  static async uploadFile(file: File, chatId: string, senderId: string): Promise<FileAttachment> {
    // Validate file size
    if (file.size > this.MAX_FILE_SIZE) {
      throw new Error(`File size exceeds maximum limit of ${this.MAX_FILE_SIZE / (1024 * 1024)}MB`);
    }

    // Validate file type
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      throw new Error('File type not supported');
    }

    // Convert file to base64
    const base64Data = await this.fileToBase64(file);
    
    const fileAttachment: Omit<FileAttachment, 'id'> = {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      fileData: base64Data,
      senderId: senderId,
      timestamp: Date.now(),
      chatId: chatId
    };

    // Store in Realtime Database
    const fileRef = ref(rtdb, `files/${chatId}`);
    const newFileRef = push(fileRef);
    await set(newFileRef, fileAttachment);

    return { ...fileAttachment, id: newFileRef.key! };
  }

  static async downloadFile(fileId: string, chatId: string): Promise<FileAttachment | null> {
    try {
      const fileRef = ref(rtdb, `files/${chatId}/${fileId}`);
      const snapshot = await get(fileRef);
      
      if (snapshot.exists()) {
        return { id: fileId, ...snapshot.val() } as FileAttachment;
      }
      return null;
    } catch (error) {
      console.error('Error downloading file:', error);
      return null;
    }
  }

  static async deleteFile(fileId: string, chatId: string): Promise<boolean> {
    try {
      const fileRef = ref(rtdb, `files/${chatId}/${fileId}`);
      await set(fileRef, null);
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  private static fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix to get just the base64 data
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  static base64ToBlob(base64: string, mimeType: string): Blob {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  }

  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
} 