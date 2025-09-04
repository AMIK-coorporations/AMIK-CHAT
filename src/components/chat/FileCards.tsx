"use client";

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, FileText, ImageIcon, Download, Play, Pause } from 'lucide-react';
import { FileService } from '@/lib/fileService';
import { VoiceService } from '@/lib/voiceService';
import { cn } from '@/lib/utils';

interface FilePreviewCardProps {
  file: File;
  onRemove: () => void;
  onSend: (file: File) => void;
  isUploading?: boolean;
}

interface FileMessageCardProps {
  fileName: string;
  fileSize: number;
  fileType: string;
  fileUrl: string;
  isImage?: boolean;
  isAudio?: boolean;
  duration?: number;
  onDownload?: () => void;
  onPlay?: () => void;
  isPlaying?: boolean;
}

export function FilePreviewCard({ file, onRemove, onSend, isUploading }: FilePreviewCardProps) {
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isImage, setIsImage] = useState(false);
  const [isAudio, setIsAudio] = useState(false);
  const [duration, setDuration] = useState<number>(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Generate preview on mount
  useState(() => {
    if (file.type.startsWith('image/')) {
      setIsImage(true);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else if (file.type.startsWith('audio/')) {
      setIsAudio(true);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      
      // Get audio duration
      const audio = new Audio(url);
      audio.addEventListener('loadedmetadata', () => {
        setDuration(audio.duration);
      });
    }
  });

  const getFileIcon = () => {
    if (file.type.startsWith('image/')) return <ImageIcon className="h-8 w-8 text-blue-500" />;
    if (file.type.startsWith('audio/')) return <Play className="h-8 w-8 text-green-500" />;
    if (file.type.startsWith('video/')) return <Play className="h-8 w-8 text-purple-500" />;
    if (file.type.includes('pdf')) return <FileText className="h-8 w-8 text-red-500" />;
    if (file.type.includes('word') || file.type.includes('document')) return <FileText className="h-8 w-8 text-blue-600" />;
    return <FileText className="h-8 w-8 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="w-full max-w-sm border-2 border-dashed border-blue-300 bg-blue-50/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-gray-700">
            فائل کا پیش نظارہ
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="h-6 w-6 p-0 text-gray-500 hover:text-red-500"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* File Preview */}
        <div className="flex items-center gap-3">
          {getFileIcon()}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{file.name}</p>
            <p className="text-xs text-gray-500">
              {formatFileSize(file.size)}
              {isAudio && duration > 0 && ` • ${formatDuration(duration)}`}
            </p>
          </div>
        </div>

        {/* Image Preview */}
        {isImage && previewUrl && (
          <div className="relative">
            <img
              src={previewUrl}
              alt={file.name}
              className="w-full h-32 object-cover rounded-lg border"
            />
          </div>
        )}

        {/* Audio Preview */}
        {isAudio && previewUrl && (
          <div className="flex items-center gap-2 p-2 bg-gray-100 rounded-lg">
            <audio ref={audioRef} src={previewUrl} className="hidden" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (audioRef.current) {
                  if (audioRef.current.paused) {
                    audioRef.current.play();
                  } else {
                    audioRef.current.pause();
                  }
                }
              }}
              className="h-8 w-8 p-0"
            >
              <Play className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <div className="w-full h-2 bg-gray-300 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: '0%' }} />
              </div>
            </div>
            {duration > 0 && (
              <span className="text-xs text-gray-500">{formatDuration(duration)}</span>
            )}
          </div>
        )}

        {/* Send Button */}
        <Button
          onClick={() => onSend(file)}
          disabled={isUploading}
          className="w-full"
        >
          {isUploading ? 'بھیج رہا ہے...' : 'فائل بھیجیں'}
        </Button>
      </CardContent>
    </Card>
  );
}

export function FileMessageCard({ 
  fileName, 
  fileSize, 
  fileType, 
  fileUrl, 
  isImage, 
  isAudio, 
  duration, 
  onDownload, 
  onPlay, 
  isPlaying 
}: FileMessageCardProps) {
  const getFileIcon = () => {
    if (isImage) return <ImageIcon className="h-6 w-6 text-blue-500" />;
    if (isAudio) return <Play className="h-6 w-6 text-green-500" />;
    if (fileType.includes('pdf')) return <FileText className="h-6 w-6 text-red-500" />;
    if (fileType.includes('word') || fileType.includes('document')) return <FileText className="h-6 w-6 text-blue-600" />;
    return <FileText className="h-6 w-6 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="w-full max-w-sm border border-gray-200 bg-white shadow-sm">
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          {getFileIcon()}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{fileName}</p>
            <p className="text-xs text-gray-500">
              {formatFileSize(fileSize)}
              {isAudio && duration && ` • ${formatDuration(duration)}`}
            </p>
          </div>
          <div className="flex gap-1">
            {isAudio && onPlay && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onPlay}
                className="h-6 w-6 p-0"
              >
                {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
              </Button>
            )}
            {onDownload && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDownload}
                className="h-6 w-6 p-0"
              >
                <Download className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Image Preview */}
        {isImage && (
          <div className="mt-2">
            <img
              src={fileUrl}
              alt={fileName}
              className="w-full h-32 object-cover rounded-lg border"
              onClick={() => window.open(fileUrl, '_blank')}
            />
          </div>
        )}

        {/* Audio Player */}
        {isAudio && (
          <div className="mt-2 flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <div className="w-full h-2 bg-gray-300 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: '0%' }} />
              </div>
            </div>
            {duration && (
              <span className="text-xs text-gray-500">{formatDuration(duration)}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 