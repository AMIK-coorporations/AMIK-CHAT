import { insforge } from './insforge';

export interface VoiceMessage {
  id: string;
  audioUrl: string; // Direct InsForge Storage URL
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

              const filename = `${chatId}/${Date.now()}.wav`;

              // InsForge Storage Upload
              const { data, error } = await insforge.storage
                .from('voice_messages')
                .upload(filename, audioBlob);

              if (error || !data) {
                throw new Error(error?.message || 'Failed to upload voice message to InsForge');
              }

              const voiceMessage: VoiceMessage = {
                id: data.key,
                audioUrl: data.url,
                duration: duration,
                senderId: senderId,
                timestamp: Date.now(),
                chatId: chatId
              };

              // Stop all tracks
              stream.getTracks().forEach(track => track.stop());

              resolve(voiceMessage);
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

  static async deleteVoiceMessage(messageId: string): Promise<boolean> {
    try {
      const { error } = await insforge.storage
        .from('voice_messages')
        .remove(messageId);

      return !error;
    } catch (error) {
      console.error('Error deleting voice message:', error);
      return false;
    }
  }

  static formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}
