"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useCall } from '@/hooks/useCall';
import { useAuth } from '@/hooks/useAuth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { User } from '@/lib/types';
import CallInterface from '@/components/chat/CallInterface';

interface CallContextType {
  isCallActive: boolean;
  showCallInterface: boolean;
  callType: 'voice' | 'video';
  isIncomingCall: boolean;
  callerName?: string;
  remoteUserId?: string;
  handleEndCall: () => void;
}

const CallContext = createContext<CallContextType>({
  isCallActive: false,
  showCallInterface: false,
  callType: 'voice',
  isIncomingCall: false,
  handleEndCall: () => {},
});

export function CallProvider({ children }: { children: ReactNode }) {
  const { user: currentUser } = useAuth();
  const { callData, isCallActive } = useCall();
  const [showCallInterface, setShowCallInterface] = useState(false);
  const [callType, setCallType] = useState<'voice' | 'video'>('voice');
  const [isIncomingCall, setIsIncomingCall] = useState(false);
  const [callerName, setCallerName] = useState<string>();
  const [remoteUserId, setRemoteUserId] = useState<string>();

  // Handle call state changes
  useEffect(() => {
    if (callData) {
      setShowCallInterface(true);
      setCallType(callData.isVideo ? 'video' : 'voice');
      setIsIncomingCall(callData.isIncoming);
      setRemoteUserId(callData.remoteUserId);
      setCallerName(callData.remoteUserName);
    } else {
      setShowCallInterface(false);
      setIsIncomingCall(false);
      setCallerName(undefined);
      setRemoteUserId(undefined);
    }
  }, [callData]);

  const handleEndCall = () => {
    setShowCallInterface(false);
    setIsIncomingCall(false);
    setCallerName(undefined);
    setRemoteUserId(undefined);
  };

  return (
    <CallContext.Provider value={{
      isCallActive,
      showCallInterface,
      callType,
      isIncomingCall,
      callerName,
      remoteUserId,
      handleEndCall,
    }}>
      {children}
      
      {/* Global Call Interface */}
      {showCallInterface && (
        <CallInterface
          isVideo={callType === 'video'}
          onEndCall={handleEndCall}
          callerName={callerName}
          remoteUserId={remoteUserId}
          isIncoming={isIncomingCall}
        />
      )}
    </CallContext.Provider>
  );
}

export const useCallContext = () => useContext(CallContext); 