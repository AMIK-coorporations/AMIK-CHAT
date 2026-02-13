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
      const timestamp = Date.now();
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const path = `${senderId}/${timestamp}_${cleanFileName}`;

      const { data, error } = await insforge.storage
        .from('uploads')
        .upload(path, file);

      if (error || !data) {
        throw new Error(error?.message || 'Failed to upload file to InsForge');
      }

      // Construct public URL if data.url is missing (sometimes upload returns key but not url directly in some versions)
      // But based on avatarService usage (data.url), we assume it's there. 
      // If not, we might need insforge.storage.from('uploads').getPublicUrl(path).


      let fileUrl = data.url;
      if (!fileUrl) {
        fileUrl = insforge.storage.from('uploads').getPublicUrl(path);
      }

      // Persist file metadata to 'files' table
      const fileId = data.key || path;
      const { error: dbError } = await insforge.database.from('files').insert({
        id: fileId,
        bucket_id: 'uploads',
        file_path: path,
        public_url: fileUrl,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        user_id: senderId,
        chat_id: chatId,
        created_at: new Date().toISOString()
      });

      if (dbError) {
        console.error('Failed to save file metadata to DB:', dbError);
        // Proceeding anyway as the file is uploaded, but this is an issue.
      }

      const fileAttachment: FileAttachment = {
        id: fileId, // Use the DB ID (file path in this case)
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        fileUrl: fileUrl,
        senderId: senderId,
        timestamp: timestamp,
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
