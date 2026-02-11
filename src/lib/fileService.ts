import { insforge } from './insforge';

export interface FileAttachment {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
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

    // InsForge Storage Upload
    try {
      const { data, error } = await insforge.storage
        .from('uploads')
        .uploadAuto(file);

      if (error || !data) {
        throw new Error(error?.message || 'Failed to upload file to InsForge');
      }

      const fileAttachment: FileAttachment = {
        id: data.key,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        fileUrl: data.url,
        senderId: senderId,
        timestamp: Date.now(),
        chatId: chatId
      };

      return fileAttachment;
    } catch (error: any) {
      console.error('InsForge upload error:', error);
      throw error;
    }
  }

  static async downloadFile(fileId: string, chatId: string): Promise<Blob | null> {
    try {
      const { data, error } = await insforge.storage
        .from('uploads')
        .download(fileId);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error downloading file from InsForge:', error);
      return null;
    }
  }

  static async deleteFile(fileId: string, chatId: string): Promise<boolean> {
    try {
      const { error } = await insforge.storage
        .from('uploads')
        .remove(fileId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting file from InsForge:', error);
      return false;
    }
  }

  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
