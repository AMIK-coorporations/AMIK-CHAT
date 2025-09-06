"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  SendHorizonal, 
  Mic, 
  Paperclip, 
  Camera, 
  Phone, 
  Video, 
  MapPin, 
  UserPlus, 
  FileText,
  Image as ImageIcon,
  Smile,
  Scissors,
  Plus,
  Upload,
  X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useCall } from "@/hooks/useCall";
import { db } from "@/lib/firebase";
import { collection, serverTimestamp, writeBatch, doc } from "firebase/firestore";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import EmojiPicker from "./EmojiPicker";
import { cn } from "@/lib/utils";
import { FileService } from "@/lib/fileService";
import { VoiceService } from "@/lib/voiceService";
import { FilePreviewCard } from "./FileCards";

interface ChatInputProps {
  chatId: string;
  onMessageSent?: () => void;
  remoteUserId?: string;
}

export default function ChatInput({ chatId, onMessageSent, remoteUserId }: ChatInputProps) {
  const [newMessage, setNewMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showFeatures, setShowFeatures] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const { initiateCall } = useCall();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const dragCounterRef = useRef(0);

  // Handle sending text messages
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === "" || !currentUser) return;

    const messageText = newMessage;
    setNewMessage("");

    try {
      const chatRef = doc(db, 'chats', chatId);
      const messagesColRef = collection(chatRef, 'messages');
      const newMessageRef = doc(messagesColRef);

      const batch = writeBatch(db);
      const timestamp = serverTimestamp();

      const messageData = {
        text: messageText,
        senderId: currentUser.uid,
        timestamp: timestamp,
        isRead: false,
        type: 'text'
      };
      
      batch.set(newMessageRef, messageData);
      batch.update(chatRef, {
        lastMessage: {
          text: messageText,
          senderId: currentUser.uid,
          timestamp: timestamp,
          isRead: false,
        }
      });

      await batch.commit();
      onMessageSent?.();
      toast({ title: 'پیغام بھیجا گیا', description: 'آپ کا پیغام کامیابی سے بھیجا گیا' });
    } catch (error) {
      console.error("Error sending message:", error);
      toast({ variant: 'destructive', title: 'خرابی', description: 'پیغام بھیج نہیں سکا' });
    }
  };

  // Simple drag & drop
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current++;
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragOver(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    dragCounterRef.current = 0;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setSelectedFiles(prev => [...prev, ...files]);
    }
  }, []);

  // Handle file selection
  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    const fileArray = Array.from(files);
    setSelectedFiles(prev => [...prev, ...fileArray]);
  };

  // Remove file from selection
  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Send selected files
  const sendSelectedFiles = async () => {
    if (selectedFiles.length === 0 || !currentUser) return;

    try {
      setIsUploading(true);
      const batch = writeBatch(db);
      const chatRef = doc(db, 'chats', chatId);
      const messagesColRef = collection(chatRef, 'messages');

      for (const file of selectedFiles) {
        try {
          // Upload file using FileService
          const fileAttachment = await FileService.uploadFile(file, chatId, currentUser.uid);
          
          const newMessageRef = doc(messagesColRef);
          const timestamp = serverTimestamp();

          const messageData: any = {
            text: file.name,
            senderId: currentUser.uid,
            timestamp: timestamp,
            isRead: false,
            type: file.type.startsWith('image/') ? 'image' : 'file',
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            fileId: fileAttachment.id, // Reference to RTDB file
            // Store the base64 data directly in the message for immediate display
            fileData: fileAttachment.fileData
          };

          // Add type-specific properties
          if (file.type.startsWith('image/')) {
            messageData.imageUrl = `data:${file.type};base64,${fileAttachment.fileData}`;
          } else {
            messageData.fileUrl = `data:${file.type};base64,${fileAttachment.fileData}`;
          }

          console.log('Sending file message:', messageData);

          batch.set(newMessageRef, messageData);
        } catch (error: any) {
          console.error(`Error uploading file ${file.name}:`, error);
          toast({
            variant: 'destructive',
            title: 'فائل اپ لوڈ ناکام',
            description: `${file.name}: ${error.message}`,
          });
        }
      }

      // Update chat with last message
      batch.update(chatRef, {
        lastMessage: {
          text: `${selectedFiles.length} فائلیں`,
          senderId: currentUser.uid,
          timestamp: serverTimestamp(),
          isRead: false,
        }
      });

      await batch.commit();
      setSelectedFiles([]); // Clear selected files
      onMessageSent?.();
      toast({ title: 'فائلیں بھیجی گئیں', description: `${selectedFiles.length} فائلیں کامیابی سے بھیجی گئیں` });
    } catch (error) {
      console.error("Error uploading files:", error);
      toast({ variant: 'destructive', title: 'خرابی', description: 'فائلیں اپ لوڈ نہیں ہو سکیں' });
    } finally {
      setIsUploading(false);
    }
  };

  // Simple file upload function
  const handleMultipleFiles = async (files: File[]) => {
    if (!currentUser) return;

    try {
      setIsUploading(true);
      const batch = writeBatch(db);
      const chatRef = doc(db, 'chats', chatId);
      const messagesColRef = collection(chatRef, 'messages');

      for (const file of files) {
        try {
          // Upload file using FileService
          const fileAttachment = await FileService.uploadFile(file, chatId, currentUser.uid);

        const newMessageRef = doc(messagesColRef);
        const timestamp = serverTimestamp();

        const messageData: any = {
          text: file.name,
          senderId: currentUser.uid,
          timestamp: timestamp,
          isRead: false,
            type: file.type.startsWith('image/') ? 'image' : 'file',
          fileName: file.name,
          fileSize: file.size,
            fileType: file.type,
            fileId: fileAttachment.id // Reference to RTDB file
        };

        // Add type-specific properties
          if (file.type.startsWith('image/')) {
            messageData.imageUrl = `data:${file.type};base64,${fileAttachment.fileData}`;
        } else {
            messageData.fileUrl = `data:${file.type};base64,${fileAttachment.fileData}`;
        }

        batch.set(newMessageRef, messageData);
        } catch (error: any) {
          console.error(`Error uploading file ${file.name}:`, error);
          toast({
            variant: 'destructive',
            title: 'فائل اپ لوڈ ناکام',
            description: `${file.name}: ${error.message}`,
          });
        }
      }

      // Update chat with last message
      batch.update(chatRef, {
        lastMessage: {
          text: `${files.length} فائلیں`,
          senderId: currentUser.uid,
          timestamp: serverTimestamp(),
          isRead: false,
        }
      });

      await batch.commit();
      onMessageSent?.();
      toast({ title: `${files.length} فائلیں بھیجی گئیں` });
    } catch (error) {
      console.error("Error uploading multiple files:", error);
      toast({ variant: 'destructive', title: 'خرابی', description: 'فائلیں بھیج نہیں سکا' });
    } finally {
      setIsUploading(false);
    }
  };

  // Simple voice recording function
  const startVoiceRecording = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      setIsRecording(true);
      setRecordingDuration(0);

      // Use VoiceService to record
      const voiceMessage = await VoiceService.recordVoiceMessage(
        chatId, 
        currentUser.uid,
        (duration) => setRecordingDuration(duration)
      );

      // Send the voice message
      await sendVoiceMessage(voiceMessage);

      toast({ title: 'آواز کا پیغام بھیجا گیا' });
    } catch (error: any) {
      console.error("Error recording voice:", error);
      toast({ 
        variant: 'destructive', 
        title: 'آواز ریکارڈ نہیں ہو سکی', 
        description: error.message || 'مائیکروفون تک رسائی نہیں' 
      });
    } finally {
      setIsRecording(false);
      setRecordingDuration(0);
    }
  }, [currentUser, chatId, toast]);

  const stopVoiceRecording = useCallback(() => {
    VoiceService.stopRecording();
      setIsRecording(false);
      setRecordingDuration(0);
  }, []);

  // Simple file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(event.target.files);
    // Reset input value
    if (event.target) {
      event.target.value = '';
    }
  };

  // Simple image upload
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;
    
    // Filter only image files
    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    if (imageFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...imageFiles]);
    }
    
    // Reset input value
    if (event.target) {
      event.target.value = '';
    }
  };

  // Simple location sharing
  const handleLocationShare = async () => {
    if (navigator.geolocation) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
          });
        });

        const { latitude, longitude } = position.coords;
        const locationText = `📍 مقام: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        
        const chatRef = doc(db, 'chats', chatId);
        const messagesColRef = collection(chatRef, 'messages');
        const newMessageRef = doc(messagesColRef);

        const batch = writeBatch(db);
        const timestamp = serverTimestamp();

        const messageData = {
          text: locationText,
          senderId: currentUser?.uid,
          timestamp: timestamp,
          isRead: false,
          type: 'location',
          location: { latitude, longitude }
        };
        
        batch.set(newMessageRef, messageData);
        batch.update(chatRef, {
          lastMessage: {
            text: '📍 مقام شیئر کیا گیا',
            senderId: currentUser?.uid,
            timestamp: timestamp,
            isRead: false,
          }
        });

        await batch.commit();
        onMessageSent?.();
        toast({ title: 'مقام شیئر کیا گیا' });
      } catch (error) {
        console.error("Geolocation error:", error);
        toast({ variant: 'destructive', title: 'خرابی', description: 'مقام حاصل نہیں کیا جا سکا' });
      }
    } else {
      toast({ variant: 'destructive', title: 'خرابی', description: 'جیولوکیشن سپورٹڈ نہیں' });
    }
  };

  // Simple contact sharing
  const handleContactShare = async () => {
    if (!currentUser) return;
    
    try {
      const contactText = `👤 رابطہ: ${currentUser.displayName || 'نامعلوم'}\n📧 ای میل: ${currentUser.email || 'نامعلوم'}`;
      
      const chatRef = doc(db, 'chats', chatId);
      const messagesColRef = collection(chatRef, 'messages');
      const newMessageRef = doc(messagesColRef);

      const batch = writeBatch(db);
      const timestamp = serverTimestamp();

      const messageData = {
        text: contactText,
        senderId: currentUser.uid,
        timestamp: timestamp,
        isRead: false,
        type: 'contact'
      };
      
      batch.set(newMessageRef, messageData);
      batch.update(chatRef, {
        lastMessage: {
          text: '👤 رابطہ شیئر کیا گیا',
          senderId: currentUser.uid,
          timestamp: timestamp,
          isRead: false,
        }
      });

      await batch.commit();
      onMessageSent?.();
      toast({ title: 'رابطہ شیئر کیا گیا' });
    } catch (error) {
      console.error("Error sharing contact:", error);
      toast({ variant: 'destructive', title: 'خرابی', description: 'رابطہ شیئر نہیں کیا جا سکا' });
    }
  };

  // Simple screenshot
  const handleScreenshot = () => {
    toast({ title: 'اسکرین شاٹ', description: 'اسکرین شاٹ فیچر جلد آرہا ہے' });
  };

  // WebRTC call handling
  const handleVideoCall = async () => {
    if (!remoteUserId) {
      toast({ 
        variant: 'destructive',
        title: 'خرابی', 
        description: 'رابطہ کا ID دستیاب نہیں ہے' 
      });
      return;
    }

    try {
      await initiateCall(remoteUserId, true); // true for video call
    } catch (error) {
      console.error('Error initiating video call:', error);
      toast({ 
        variant: 'destructive',
        title: 'خرابی', 
        description: 'ویڈیو کال شروع نہیں ہو سکی' 
      });
      }
  };

  const handleVoiceCall = async () => {
    if (!remoteUserId) {
      toast({ 
        variant: 'destructive',
        title: 'خرابی', 
        description: 'رابطہ کا ID دستیاب نہیں ہے' 
      });
      return;
    }

    try {
      await initiateCall(remoteUserId, false); // false for voice call
    } catch (error) {
      console.error('Error initiating voice call:', error);
      toast({ 
        variant: 'destructive',
        title: 'خرابی', 
        description: 'وائس کال شروع نہیں ہو سکی' 
      });
    }
  };

  // Simple emoji selection
  const handleEmojiSelect = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
  };

  // Send voice message function
  const sendVoiceMessage = async (voiceMessage: any) => {
    if (!currentUser) return;

    try {
      setIsUploading(true);

      const chatRef = doc(db, 'chats', chatId);
      const messagesColRef = collection(chatRef, 'messages');
      const newMessageRef = doc(messagesColRef);

      const batch = writeBatch(db);
      const timestamp = serverTimestamp();

      const messageData = {
        text: 'آواز کا پیغام',
        senderId: currentUser.uid,
        timestamp: timestamp,
        isRead: false,
        type: 'voice',
        audioUrl: VoiceService.base64ToAudioUrl(voiceMessage.audioData),
        duration: voiceMessage.duration,
        voiceMessageId: voiceMessage.id // Reference to RTDB voice message
      };
      
      batch.set(newMessageRef, messageData);
      batch.update(chatRef, {
        lastMessage: {
          text: 'آواز کا پیغام',
          senderId: currentUser.uid,
          timestamp: timestamp,
          isRead: false,
        }
      });

      await batch.commit();
      onMessageSent?.();
      toast({ title: 'آواز کا پیغام بھیجا گیا' });
    } catch (error) {
      console.error("Error sending voice message:", error);
      toast({ variant: 'destructive', title: 'خرابی', description: 'آواز کا پیغام بھیج نہیں سکا' });
    } finally {
      setIsUploading(false);
    }
  };

  // Camera capture function
  const handleCameraCapture = () => {
    cameraInputRef.current?.click();
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

  return (
    <div 
      className={cn(
        "border-t bg-background p-4 transition-all duration-200",
        isDragOver && "bg-blue-50 dark:bg-blue-950/20 border-blue-300"
      )}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Drag & Drop Overlay */}
      {isDragOver && (
        <div className="absolute inset-0 bg-blue-500/10 border-2 border-dashed border-blue-500 rounded-lg flex items-center justify-center z-10">
          <div className="text-center">
            <Upload className="h-12 w-12 text-blue-500 mx-auto mb-2" />
            <p className="text-blue-600 font-medium">فائلیں یہاں چھوڑیں</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="flex items-center gap-2 relative">
        <Label htmlFor="message-input" className="sr-only">
          ایک پیغام لکھیں
        </Label>
        
        {/* File Preview Cards */}
        {selectedFiles.length > 0 && (
          <div className="absolute bottom-full left-0 right-0 mb-2 p-2 bg-background border rounded-lg shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium">منتخب شدہ فائلیں ({selectedFiles.length})</h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSelectedFiles([])}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {selectedFiles.map((file, index) => (
                <FilePreviewCard
                  key={index}
                  file={file}
                  onRemove={() => removeFile(index)}
                  onSend={() => sendSelectedFiles()}
                  isUploading={isUploading}
                />
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <Button
                type="button"
                onClick={sendSelectedFiles}
                disabled={isUploading}
                className="flex-1"
              >
                {isUploading ? 'بھیج رہا ہے...' : 'فائلیں بھیجیں'}
              </Button>
            </div>
          </div>
        )}
        
        {/* Mobile Features */}
        {isMobile && (
          <>
            <Popover open={showFeatures} onOpenChange={setShowFeatures}>
              <PopoverTrigger asChild>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon"
                  className="h-10 w-10 shrink-0"
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4" side="top" align="center">
                <ScrollArea className="h-64">
                  <div className="grid grid-cols-4 gap-4">
                    {/* Voice Input */}
                    <Button
                      type="button"
                      variant="ghost"
                      className="flex flex-col items-center gap-2 h-20 p-2"
                      onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                      disabled={isUploading}
                    >
                      <Mic className={`h-6 w-6 ${isRecording ? 'text-red-500' : ''}`} />
                      <span className="text-xs">آواز</span>
                    </Button>

                    {/* Contact Card */}
                    <Button
                      type="button"
                      variant="ghost"
                      className="flex flex-col items-center gap-2 h-20 p-2"
                      onClick={handleContactShare}
                    >
                      <UserPlus className="h-6 w-6" />
                      <span className="text-xs">رابطہ</span>
                    </Button>

                    {/* Files */}
                    <Button
                      type="button"
                      variant="ghost"
                      className="flex flex-col items-center gap-2 h-20 p-2"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      <FileText className="h-6 w-6" />
                      <span className="text-xs">فائلز</span>
                    </Button>

                    {/* Album */}
                    <Button
                      type="button"
                      variant="ghost"
                      className="flex flex-col items-center gap-2 h-20 p-2"
                      onClick={() => cameraInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      <ImageIcon className="h-6 w-6" />
                      <span className="text-xs">البم</span>
                    </Button>

                    {/* Camera */}
                    <Button
                      type="button"
                      variant="ghost"
                      className="flex flex-col items-center gap-2 h-20 p-2"
                      onClick={handleCameraCapture}
                      disabled={isUploading}
                    >
                      <Camera className="h-6 w-6" />
                      <span className="text-xs">کیمرا</span>
                    </Button>

                    {/* Video Call */}
                    <Button
                      type="button"
                      variant="ghost"
                      className="flex flex-col items-center gap-2 h-20 p-2"
                      onClick={handleVideoCall}
                    >
                      <Video className="h-6 w-6" />
                      <span className="text-xs">ویڈیو کال</span>
                    </Button>

                    {/* Voice Call */}
                    <Button
                      type="button"
                      variant="ghost"
                      className="flex flex-col items-center gap-2 h-20 p-2"
                      onClick={handleVoiceCall}
                    >
                      <Phone className="h-6 w-6" />
                      <span className="text-xs">وائس کال</span>
                    </Button>

                    {/* Location */}
                    <Button
                      type="button"
                      variant="ghost"
                      className="flex flex-col items-center gap-2 h-20 p-2"
                      onClick={handleLocationShare}
                    >
                      <MapPin className="h-6 w-6" />
                      <span className="text-xs">مقام</span>
                    </Button>
                  </div>
                </ScrollArea>
              </PopoverContent>
            </Popover>
          </>
        )}

        {/* Desktop Features */}
        {!isMobile && (
          <>
            <EmojiPicker onEmojiSelect={handleEmojiSelect} />
            
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-10 w-10 shrink-0"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <Paperclip className="h-5 w-5" />
            </Button>
            
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-10 w-10 shrink-0"
              onClick={handleScreenshot}
            >
              <Scissors className="h-5 w-5" />
            </Button>
            
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-10 w-10 shrink-0"
              onClick={startVoiceRecording}
              disabled={isRecording || isUploading}
            >
              <Mic className="h-5 w-5" />
            </Button>
            
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-10 w-10 shrink-0"
              onClick={handleVoiceCall}
            >
              <Phone className="h-5 w-5" />
            </Button>
            
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-10 w-10 shrink-0"
              onClick={handleVideoCall}
            >
              <Video className="h-5 w-5" />
            </Button>
          </>
        )}

        <Input
          id="message-input"
          name="message-input"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="ایک پیغام لکھیں..."
          autoComplete="off"
          className="text-base flex-1"
        />
        
        <Button type="submit" className="shrink-0" disabled={isUploading}>
          <SendHorizonal className="h-5 w-5" />
          <span className="sr-only">پیغام بھیجیں</span>
        </Button>
      </form>

      {/* Voice Recording Status */}
      {isRecording && (
        <div className="mt-2 p-2 bg-red-50 dark:bg-red-950/20 rounded-lg">
          <div className="flex items-center gap-2">
            <Mic className="h-4 w-4 text-red-500 animate-pulse" />
            <span className="text-sm text-red-600 dark:text-red-400">
              ریکارڈنگ: {recordingDuration}s
            </span>
          </div>
        </div>
      )}

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileUpload}
        accept=".pdf,.doc,.docx,.txt,.zip,.rar,.mp3,.mp4,.avi,.mov,.png,.jpg,.jpeg,.gif"
      />
      
      <input
        ref={cameraInputRef}
        type="file"
        multiple
        className="hidden"
        accept="image/*"
        capture="environment"
        onChange={handleImageUpload}
      />
    </div>
  );
} 