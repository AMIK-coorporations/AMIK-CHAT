import { db } from './firebase';
import { 
  doc, 
  setDoc, 
  onSnapshot, 
  deleteDoc, 
  serverTimestamp,
  collection,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore';

export interface CallSignal {
  type: 'offer' | 'answer' | 'ice-candidate' | 'call-request' | 'call-accepted' | 'call-rejected' | 'call-ended';
  data: any;
  from: string;
  to: string;
  timestamp: any;
}

export interface CallState {
  isIncoming: boolean;
  isOutgoing: boolean;
  isConnected: boolean;
  isVideo: boolean;
  remoteUserId: string;
  remoteUserName?: string;
  localStream?: MediaStream;
  remoteStream?: MediaStream;
  peerConnection?: RTCPeerConnection;
}

export class CallService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private signalingUnsubscribe: (() => void) | null = null;
  private currentCallId: string | null = null;
  private currentUserId: string | null = null;
  private remoteUserId: string | null = null;
  private isVideo: boolean = false;

  // Event callbacks
  private onCallStateChange: ((state: CallState) => void) | null = null;
  private onIncomingCall: ((callData: { from: string, isVideo: boolean, callId: string }) => void) | null = null;
  private onCallEnded: (() => void) | null = null;

  constructor() {
    this.initializePeerConnection();
  }

  private initializePeerConnection() {
    const configuration: RTCConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
      ]
    };

    this.peerConnection = new RTCPeerConnection(configuration);

    // Handle incoming remote stream
    this.peerConnection.ontrack = (event) => {
      this.remoteStream = event.streams[0];
      this.notifyStateChange();
    };

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.currentCallId && this.remoteUserId) {
        this.sendSignal({
          type: 'ice-candidate',
          data: event.candidate,
          from: this.currentUserId!,
          to: this.remoteUserId,
          timestamp: serverTimestamp()
        });
      }
    };

    // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      if (this.peerConnection?.connectionState === 'connected') {
        this.notifyStateChange();
      } else if (this.peerConnection?.connectionState === 'failed' || 
                 this.peerConnection?.connectionState === 'disconnected') {
        this.endCall();
      }
    };
  }

  public setCallbacks(
    onCallStateChange: (state: CallState) => void,
    onIncomingCall: (callData: { from: string, isVideo: boolean, callId: string }) => void,
    onCallEnded: () => void
  ) {
    this.onCallStateChange = onCallStateChange;
    this.onIncomingCall = onIncomingCall;
    this.onCallEnded = onCallEnded;
  }

  public async initiateCall(remoteUserId: string, isVideo: boolean, currentUserId: string): Promise<string> {
    if (this.currentCallId) {
      throw new Error('Call already in progress');
    }

    this.currentUserId = currentUserId;
    this.remoteUserId = remoteUserId;
    this.isVideo = isVideo;

    // Generate unique call ID
    this.currentCallId = `${currentUserId}_${remoteUserId}_${Date.now()}`;

    try {
      // Get user media
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: isVideo
      });

      // Add local stream to peer connection
      this.localStream.getTracks().forEach(track => {
        this.peerConnection?.addTrack(track, this.localStream!);
      });

      // Create and send offer
      const offer = await this.peerConnection!.createOffer();
      await this.peerConnection!.setLocalDescription(offer);

      // Create call document
      await this.createCallDocument();

      // Send call request
      await this.sendSignal({
        type: 'call-request',
        data: { offer, isVideo },
        from: currentUserId,
        to: remoteUserId,
        timestamp: serverTimestamp()
      });

      // Listen for signals
      this.listenForSignals();

      this.notifyStateChange();
      return this.currentCallId;

    } catch (error) {
      this.cleanup();
      throw error;
    }
  }

  public async acceptCall(callId: string, currentUserId: string): Promise<void> {
    if (this.currentCallId) {
      throw new Error('Call already in progress');
    }

    this.currentCallId = callId;
    this.currentUserId = currentUserId;

    try {
      // Get user media
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: this.isVideo
      });

      // Add local stream to peer connection
      this.localStream.getTracks().forEach(track => {
        this.peerConnection?.addTrack(track, this.localStream!);
      });

      // Send call accepted signal
      await this.sendSignal({
        type: 'call-accepted',
        data: {},
        from: currentUserId,
        to: this.remoteUserId!,
        timestamp: serverTimestamp()
      });

      // Listen for signals
      this.listenForSignals();

      this.notifyStateChange();

    } catch (error) {
      this.cleanup();
      throw error;
    }
  }

  public async rejectCall(callId: string, currentUserId: string): Promise<void> {
    await this.sendSignal({
      type: 'call-rejected',
      data: {},
      from: currentUserId,
      to: this.remoteUserId!,
      timestamp: serverTimestamp()
    });

    // Clean up the call document
    await deleteDoc(doc(db, 'calls', callId));
  }

  public async endCall(): Promise<void> {
    if (!this.currentCallId) return;

    try {
      await this.sendSignal({
        type: 'call-ended',
        data: {},
        from: this.currentUserId!,
        to: this.remoteUserId!,
        timestamp: serverTimestamp()
      });

      // Clean up the call document
      await deleteDoc(doc(db, 'calls', this.currentCallId));
    } catch (error) {
      console.error('Error ending call:', error);
    } finally {
      this.cleanup();
    }
  }

  public toggleMute(): boolean {
    if (!this.localStream) return false;

    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      return !audioTrack.enabled; // Return muted state
    }
    return false;
  }

  public toggleVideo(): boolean {
    if (!this.localStream) return false;

    const videoTrack = this.localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      return !videoTrack.enabled; // Return video disabled state
    }
    return false;
  }

  public getCallState(): CallState {
    return {
      isIncoming: false,
      isOutgoing: !!this.currentCallId,
      isConnected: this.peerConnection?.connectionState === 'connected',
      isVideo: this.isVideo,
      remoteUserId: this.remoteUserId || '',
      localStream: this.localStream || undefined,
      remoteStream: this.remoteStream || undefined,
      peerConnection: this.peerConnection || undefined
    };
  }

  private async sendSignal(signal: CallSignal): Promise<void> {
    if (!this.currentCallId) return;

    const signalRef = doc(db, 'calls', this.currentCallId, 'signals', `${Date.now()}_${signal.from}`);
    await setDoc(signalRef, signal);
  }

  private async createCallDocument(): Promise<void> {
    if (!this.currentCallId) return;

    const callRef = doc(db, 'calls', this.currentCallId);
    await setDoc(callRef, {
      participants: [this.currentUserId, this.remoteUserId],
      isVideo: this.isVideo,
      createdAt: serverTimestamp(),
      status: 'active'
    });
  }

  private listenForSignals(): void {
    if (!this.currentCallId) return;

    const signalsRef = collection(db, 'calls', this.currentCallId, 'signals');
    const q = query(signalsRef, orderBy('timestamp', 'asc'));

    this.signalingUnsubscribe = onSnapshot(q, async (snapshot) => {
      for (const change of snapshot.docChanges()) {
        if (change.type === 'added') {
          const signal = change.doc.data() as CallSignal;
          
          // Don't process our own signals
          if (signal.from === this.currentUserId) continue;

          await this.handleSignal(signal);
        }
      }
    });
  }

  private async handleSignal(signal: CallSignal): Promise<void> {
    try {
      switch (signal.type) {
        case 'call-request':
          this.isVideo = signal.data.isVideo;
          this.remoteUserId = signal.from;
          this.onIncomingCall?.({
            from: signal.from,
            isVideo: signal.data.isVideo,
            callId: this.currentCallId!
          });
          
          // Set local description for incoming call
          if (signal.data.offer) {
            await this.peerConnection!.setRemoteDescription(signal.data.offer);
            const answer = await this.peerConnection!.createAnswer();
            await this.peerConnection!.setLocalDescription(answer);
            
            await this.sendSignal({
              type: 'answer',
              data: answer,
              from: this.currentUserId!,
              to: signal.from,
              timestamp: serverTimestamp()
            });
          }
          break;

        case 'call-accepted':
          if (signal.data.answer) {
            await this.peerConnection!.setRemoteDescription(signal.data.answer);
          }
          break;

        case 'call-rejected':
          this.cleanup();
          this.onCallEnded?.();
          break;

        case 'call-ended':
          this.cleanup();
          this.onCallEnded?.();
          break;

        case 'offer':
          await this.peerConnection!.setRemoteDescription(signal.data);
          const answer = await this.peerConnection!.createAnswer();
          await this.peerConnection!.setLocalDescription(answer);
          
          await this.sendSignal({
            type: 'call-accepted',
            data: { answer },
            from: this.currentUserId!,
            to: signal.from,
            timestamp: serverTimestamp()
          });
          break;

        case 'answer':
          await this.peerConnection!.setRemoteDescription(signal.data);
          break;

        case 'ice-candidate':
          if (signal.data) {
            await this.peerConnection!.addIceCandidate(signal.data);
          }
          break;
      }
    } catch (error) {
      console.error('Error handling signal:', error);
    }
  }

  private notifyStateChange(): void {
    if (this.onCallStateChange) {
      this.onCallStateChange(this.getCallState());
    }
  }

  private cleanup(): void {
    // Stop all tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    // Clear remote stream
    this.remoteStream = null;

    // Unsubscribe from signals
    if (this.signalingUnsubscribe) {
      this.signalingUnsubscribe();
      this.signalingUnsubscribe = null;
    }

    // Reset state
    this.currentCallId = null;
    this.currentUserId = null;
    this.remoteUserId = null;
    this.isVideo = false;

    // Reinitialize peer connection for next call
    this.initializePeerConnection();
  }

  public destroy(): void {
    this.cleanup();
  }
}

// Singleton instance
export const callService = new CallService(); 