"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCall } from "@/hooks/useCall";

interface CallInterfaceProps {
  isVideo: boolean;
  onEndCall: () => void;
  callerName?: string;
  remoteUserId?: string;
  isIncoming?: boolean;
}

export default function CallInterface({ 
  isVideo, 
  onEndCall, 
  callerName,
  remoteUserId,
  isIncoming = false
}: CallInterfaceProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoDisabled, setIsVideoDisabled] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();
  const { callData, acceptCall, rejectCall, endCall, toggleMute, toggleVideo } = useCall();
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Start call duration timer when connected
    if (callData?.isConnected && !durationIntervalRef.current) {
      durationIntervalRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }

    // Update connection status
    setIsConnected(callData?.isConnected || false);

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
    };
  }, [callData?.isConnected]);

  // Handle local video stream
  useEffect(() => {
    if (localVideoRef.current && callData?.localStream) {
      localVideoRef.current.srcObject = callData.localStream;
    }
  }, [callData?.localStream]);

  // Handle remote video stream
  useEffect(() => {
    if (remoteVideoRef.current && callData?.remoteStream) {
      remoteVideoRef.current.srcObject = callData.remoteStream;
    }
  }, [callData?.remoteStream]);

  const handleAcceptCall = async () => {
    try {
      await acceptCall();
      toast({ title: 'کال قبول کر لی گئی', description: 'کال شروع ہو گئی ہے' });
    } catch (error) {
      console.error('Error accepting call:', error);
      toast({ variant: 'destructive', title: 'خرابی', description: 'کال قبول نہیں کر سکے' });
    }
  };

  const handleRejectCall = async () => {
    try {
      await rejectCall();
      onEndCall();
    } catch (error) {
      console.error('Error rejecting call:', error);
    }
  };

  const handleEndCall = async () => {
    try {
      await endCall();
      onEndCall();
    } catch (error) {
      console.error('Error ending call:', error);
    }
  };

  const handleToggleMute = () => {
    const muted = toggleMute();
    setIsMuted(muted);
  };

  const handleToggleVideo = () => {
    const videoDisabled = toggleVideo();
    setIsVideoDisabled(videoDisabled);
  };

  const handleToggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
    // In a real app, this would control audio output routing
    toast({ 
      title: isSpeakerOn ? 'اسپیکر بند کر دیا گیا' : 'اسپیکر کھول دیا گیا',
      description: isSpeakerOn ? 'آواز ہیڈفونز سے آ رہی ہے' : 'آواز اسپیکر سے آ رہی ہے'
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
      <div className="bg-background rounded-lg p-6 max-w-md w-full mx-4">
        {/* Call Header */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold">
            {isVideo ? 'ویڈیو کال' : 'وائس کال'}
          </h2>
          <p className="text-muted-foreground">
            {callerName || 'نامعلوم'}
          </p>
          <p className="text-sm text-muted-foreground">
            {isConnected ? formatDuration(callDuration) : isIncoming ? 'کال آ رہی ہے...' : 'جڑ رہا ہے...'}
          </p>
        </div>

        {/* Video Display */}
        {isVideo && (
          <div className="relative mb-6">
            <div className="aspect-video bg-muted rounded-lg overflow-hidden">
              {isConnected && callData?.remoteStream ? (
                <video
                  ref={remoteVideoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  playsInline
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Video className="h-16 w-16 text-muted-foreground" />
                </div>
              )}
            </div>
            
            {/* Local Video */}
            {callData?.localStream && (
              <div className="absolute bottom-2 right-2 w-24 h-16 bg-muted rounded-lg overflow-hidden">
                <video
                  ref={localVideoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  playsInline
                  muted
                />
              </div>
            )}
          </div>
        )}

        {/* Call Controls */}
        <div className="flex justify-center items-center gap-4">
          {/* Mute Button */}
          <Button
            variant={isMuted ? "destructive" : "outline"}
            size="icon"
            className="h-12 w-12 rounded-full"
            onClick={handleToggleMute}
          >
            {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
          </Button>

          {/* End Call Button */}
          <Button
            variant="destructive"
            size="icon"
            className="h-14 w-14 rounded-full"
            onClick={handleEndCall}
          >
            <PhoneOff className="h-7 w-7" />
          </Button>

          {/* Speaker Button */}
          <Button
            variant={isSpeakerOn ? "outline" : "secondary"}
            size="icon"
            className="h-12 w-12 rounded-full"
            onClick={handleToggleSpeaker}
          >
            {isSpeakerOn ? <Volume2 className="h-6 w-6" /> : <VolumeX className="h-6 w-6" />}
          </Button>

          {/* Video Toggle Button (only for video calls) */}
          {isVideo && (
            <Button
              variant={isVideoDisabled ? "destructive" : "outline"}
              size="icon"
              className="h-12 w-12 rounded-full"
              onClick={handleToggleVideo}
            >
              {isVideoDisabled ? <VideoOff className="h-6 w-6" /> : <Video className="h-6 w-6" />}
            </Button>
          )}
        </div>

        {/* Incoming Call Actions */}
        {isIncoming && !isConnected && (
          <div className="flex justify-center items-center gap-4 mt-4">
            <Button
              variant="destructive"
              size="icon"
              className="h-12 w-12 rounded-full"
              onClick={handleRejectCall}
            >
              <PhoneOff className="h-6 w-6" />
            </Button>
            <Button
              variant="default"
              size="icon"
              className="h-12 w-12 rounded-full bg-green-600 hover:bg-green-700"
              onClick={handleAcceptCall}
            >
              <Phone className="h-6 w-6" />
            </Button>
          </div>
        )}

        {/* Call Status */}
        <div className="text-center mt-4">
          <p className="text-sm text-muted-foreground">
            {isIncoming && !isConnected ? 'کال آ رہی ہے...' : 
             isConnected ? 'کال جاری ہے' : 'کال جڑ رہا ہے...'}
          </p>
        </div>
      </div>
    </div>
  );
} 