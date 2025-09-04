"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { callService, type CallState } from '@/lib/callService';
import { useToast } from './use-toast';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { User } from '@/lib/types';

export interface CallData {
  isIncoming: boolean;
  isOutgoing: boolean;
  isConnected: boolean;
  isVideo: boolean;
  remoteUserId: string;
  remoteUserName?: string;
  callId?: string;
  localStream?: MediaStream;
  remoteStream?: MediaStream;
}

export function useCall() {
  const { user: currentUser, userData } = useAuth();
  const { toast } = useToast();
  const [callData, setCallData] = useState<CallData | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);

  // Initialize call service callbacks
  useEffect(() => {
    if (!currentUser) return;

    callService.setCallbacks(
      // onCallStateChange
      (state: CallState) => {
        setCallData({
          isIncoming: state.isIncoming,
          isOutgoing: state.isOutgoing,
          isConnected: state.isConnected,
          isVideo: state.isVideo,
          remoteUserId: state.remoteUserId,
          remoteUserName: state.remoteUserName,
          localStream: state.localStream,
          remoteStream: state.remoteStream
        });
        setIsCallActive(state.isOutgoing || state.isIncoming);
      },
      // onIncomingCall
      async (callData) => {
        try {
          // Get caller's user data
          const callerDoc = await getDoc(doc(db, 'users', callData.from));
          const callerData = callerDoc.exists() ? callerDoc.data() as User : null;
          
          setCallData({
            isIncoming: true,
            isOutgoing: false,
            isConnected: false,
            isVideo: callData.isVideo,
            remoteUserId: callData.from,
            remoteUserName: callerData?.name || 'Unknown',
            callId: callData.callId
          });
          setIsCallActive(true);

          // Show incoming call notification
          toast({
            title: callData.isVideo ? 'ویڈیو کال' : 'وائس کال',
            description: `${callerData?.name || 'Unknown'} سے ${callData.isVideo ? 'ویڈیو کال' : 'وائس کال'} آ رہی ہے`,
          });
        } catch (error) {
          console.error('Error handling incoming call:', error);
        }
      },
      // onCallEnded
      () => {
        setCallData(null);
        setIsCallActive(false);
        toast({
          title: 'کال ختم ہو گئی',
          description: 'کال ختم ہو گئی ہے',
        });
      }
    );

    return () => {
      callService.destroy();
    };
  }, [currentUser, toast]);

  const initiateCall = useCallback(async (remoteUserId: string, isVideo: boolean) => {
    if (!currentUser) {
      toast({
        variant: 'destructive',
        title: 'خرابی',
        description: 'آپ لاگ ان نہیں ہیں',
      });
      return;
    }

    try {
      // Get remote user's data
      const remoteUserDoc = await getDoc(doc(db, 'users', remoteUserId));
      const remoteUserData = remoteUserDoc.exists() ? remoteUserDoc.data() as User : null;

      const callId = await callService.initiateCall(remoteUserId, isVideo, currentUser.uid);
      
      setCallData({
        isIncoming: false,
        isOutgoing: true,
        isConnected: false,
        isVideo: isVideo,
        remoteUserId: remoteUserId,
        remoteUserName: remoteUserData?.name || 'Unknown',
        callId: callId
      });
      setIsCallActive(true);

      toast({
        title: isVideo ? 'ویڈیو کال شروع ہو رہی ہے' : 'وائس کال شروع ہو رہی ہے',
        description: `${remoteUserData?.name || 'Unknown'} کو کال کر رہے ہیں`,
      });
    } catch (error) {
      console.error('Error initiating call:', error);
      toast({
        variant: 'destructive',
        title: 'خرابی',
        description: 'کال شروع نہیں ہو سکی',
      });
    }
  }, [currentUser, toast]);

  const acceptCall = useCallback(async () => {
    if (!currentUser || !callData?.callId) return;

    try {
      await callService.acceptCall(callData.callId, currentUser.uid);
      
      setCallData(prev => prev ? {
        ...prev,
        isIncoming: false,
        isOutgoing: true
      } : null);

      toast({
        title: 'کال قبول کر لی گئی',
        description: 'کال شروع ہو گئی ہے',
      });
    } catch (error) {
      console.error('Error accepting call:', error);
      toast({
        variant: 'destructive',
        title: 'خرابی',
        description: 'کال قبول نہیں کر سکے',
      });
    }
  }, [currentUser, callData?.callId, toast]);

  const rejectCall = useCallback(async () => {
    if (!currentUser || !callData?.callId) return;

    try {
      await callService.rejectCall(callData.callId, currentUser.uid);
      setCallData(null);
      setIsCallActive(false);
      
      toast({
        title: 'کال مسترد کر دی گئی',
        description: 'کال مسترد کر دی گئی ہے',
      });
    } catch (error) {
      console.error('Error rejecting call:', error);
    }
  }, [currentUser, callData?.callId, toast]);

  const endCall = useCallback(async () => {
    try {
      await callService.endCall();
      setCallData(null);
      setIsCallActive(false);
      
      toast({
        title: 'کال ختم کر دی گئی',
        description: 'کال ختم کر دی گئی ہے',
      });
    } catch (error) {
      console.error('Error ending call:', error);
    }
  }, [toast]);

  const toggleMute = useCallback(() => {
    const isMuted = callService.toggleMute();
    toast({
      title: isMuted ? 'مائیک بند کر دیا گیا' : 'مائیک کھول دیا گیا',
      description: isMuted ? 'آپ کی آواز سنائی نہیں دے رہی' : 'آپ کی آواز سنائی دے رہی ہے',
    });
  }, [toast]);

  const toggleVideo = useCallback(() => {
    const isVideoDisabled = callService.toggleVideo();
    toast({
      title: isVideoDisabled ? 'ویڈیو بند کر دی گئی' : 'ویڈیو کھول دی گئی',
      description: isVideoDisabled ? 'آپ کی ویڈیو نظر نہیں آ رہی' : 'آپ کی ویڈیو نظر آ رہی ہے',
    });
  }, [toast]);

  return {
    callData,
    isCallActive,
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo
  };
} 