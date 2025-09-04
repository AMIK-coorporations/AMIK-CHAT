import { ref, push, set, get } from 'firebase/database';
import { rtdb } from '@/lib/firebase';

export interface VoiceMessage {
  id: string;
  audioData: string; // Base64 encoded
  duration: number;
  senderId: string;
  timestamp: number;
  chatId: string;
}

export class VoiceService {
  private static mediaRecorder: MediaRecorder | null = null;
  private static audioChunks: Blob[] = [];
  private static recordingStartTime: number = 0;

  static async recordVoiceMessage(
    chatId: string, 
    senderId: string, 
    onRecordingProgress?: (duration: number) => void
  ): Promise<VoiceMessage> {
    return new Promise((resolve, reject) => {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          this.audioChunks = [];
          this.mediaRecorder = new MediaRecorder(stream);
          this.recordingStartTime = Date.now();

          this.mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              this.audioChunks.push(event.data);
            }
          };

          this.mediaRecorder.onstop = async () => {
            try {
              const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
              const duration = (Date.now() - this.recordingStartTime) / 1000;
              
              // Convert to base64
              const base64Data = await this.blobToBase64(audioBlob);
              
              const voiceMessage: Omit<VoiceMessage, 'id'> = {
                audioData: base64Data,
                duration: duration,
                senderId: senderId,
                timestamp: Date.now(),
                chatId: chatId
              };

              // Store in Realtime Database
              const voiceRef = ref(rtdb, `voice_messages/${chatId}`);
              const newVoiceRef = push(voiceRef);
              await set(newVoiceRef, voiceMessage);

              // Stop all tracks
              stream.getTracks().forEach(track => track.stop());

              resolve({ ...voiceMessage, id: newVoiceRef.key! });
            } catch (error) {
              reject(error);
            }
          };

          this.mediaRecorder.onerror = (error) => {
            reject(error);
          };

          // Start recording
          this.mediaRecorder.start(100); // Collect data every 100ms

          // Progress tracking
          const progressInterval = setInterval(() => {
            if (onRecordingProgress) {
              const duration = (Date.now() - this.recordingStartTime) / 1000;
              onRecordingProgress(duration);
            }
          }, 100);

          // Store interval reference for cleanup
          (this.mediaRecorder as any).progressInterval = progressInterval;
        })
        .catch(error => {
          reject(new Error('Microphone access denied'));
        });
    });
  }

  static stopRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
      
      // Clear progress interval
      if ((this.mediaRecorder as any).progressInterval) {
        clearInterval((this.mediaRecorder as any).progressInterval);
      }
    }
  }

  static async downloadVoiceMessage(messageId: string, chatId: string): Promise<VoiceMessage | null> {
    try {
      const voiceRef = ref(rtdb, `voice_messages/${chatId}/${messageId}`);
      const snapshot = await get(voiceRef);
      
      if (snapshot.exists()) {
        return { id: messageId, ...snapshot.val() } as VoiceMessage;
      }
      return null;
    } catch (error) {
      console.error('Error downloading voice message:', error);
      return null;
    }
  }

  static async deleteVoiceMessage(messageId: string, chatId: string): Promise<boolean> {
    try {
      const voiceRef = ref(rtdb, `voice_messages/${chatId}/${messageId}`);
      await set(voiceRef, null);
      return true;
    } catch (error) {
      console.error('Error deleting voice message:', error);
      return false;
    }
  }

  static base64ToAudioUrl(base64Data: string): string {
    return `data:audio/wav;base64,${base64Data}`;
  }

  static formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  private static blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix to get just the base64 data
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
} 