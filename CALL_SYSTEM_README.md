# AMIK CHAT - WebRTC Call System

This document describes the WebRTC-based voice and video calling system implemented in AMIK CHAT.

## Overview

The call system uses WebRTC for peer-to-peer connections and Firebase Firestore for signaling. It supports both voice and video calls between authenticated users.

## Architecture

### Components

1. **CallService** (`src/lib/callService.ts`)
   - Core WebRTC implementation
   - Handles peer connections, media streams, and signaling
   - Manages call state and lifecycle

2. **useCall Hook** (`src/hooks/useCall.tsx`)
   - React hook for call state management
   - Integrates with authentication and UI
   - Provides call actions (initiate, accept, reject, end)

3. **CallInterface Component** (`src/components/chat/CallInterface.tsx`)
   - UI for active calls
   - Shows local and remote video streams
   - Provides call controls (mute, video toggle, end call)

4. **CallContext** (`src/context/CallContext.tsx`)
   - Global call state management
   - Handles incoming calls across the app
   - Provides global call interface

### Firebase Structure

```
calls/
  {callId}/
    participants: [userId1, userId2]
    isVideo: boolean
    createdAt: timestamp
    status: 'active' | 'ended'
    signals/
      {signalId}/
        type: 'offer' | 'answer' | 'ice-candidate' | 'call-request' | 'call-accepted' | 'call-rejected' | 'call-ended'
        data: any
        from: string
        to: string
        timestamp: timestamp
```

## Features

### ✅ Implemented

- **Voice Calls**: Audio-only peer-to-peer calls
- **Video Calls**: Audio and video peer-to-peer calls
- **Call Controls**: Mute/unmute, toggle video, end call
- **Incoming Call Handling**: Accept/reject incoming calls
- **Real-time Signaling**: Firebase-based signaling for WebRTC
- **Call State Management**: Global call state across the app
- **Authentication Integration**: Only authenticated users can make calls
- **Mobile Responsive**: Works on both desktop and mobile devices

### 🔄 Call Flow

1. **Outgoing Call**:
   - User clicks call button in chat
   - CallService creates peer connection
   - Gets user media (audio/video)
   - Creates call document in Firebase
   - Sends call request signal
   - Waits for answer

2. **Incoming Call**:
   - CallService receives call request signal
   - Shows incoming call interface
   - User can accept or reject
   - If accepted, creates peer connection and media streams

3. **Call Connection**:
   - WebRTC signaling (offer/answer/ICE candidates)
   - Media streams exchanged
   - Call interface shows local and remote streams

4. **Call Controls**:
   - Mute/unmute audio
   - Toggle video on/off
   - End call (cleans up resources)

## Usage

### Making a Call

```typescript
import { useCall } from '@/hooks/useCall';

const { initiateCall } = useCall();

// Voice call
await initiateCall(remoteUserId, false);

// Video call
await initiateCall(remoteUserId, true);
```

### Receiving a Call

The system automatically handles incoming calls through the global CallContext. Users will see an incoming call interface with accept/reject options.

### Call Controls

```typescript
const { toggleMute, toggleVideo, endCall } = useCall();

// Toggle mute
const isMuted = toggleMute();

// Toggle video
const isVideoDisabled = toggleVideo();

// End call
await endCall();
```

## Integration with Existing Chat System

The call system integrates seamlessly with the existing chat interface:

- Call buttons are in the ChatInput component
- Remote user ID is extracted from chat participants
- Call interface appears as an overlay during calls
- No changes to existing chat functionality

## Security

- Only authenticated users can make/receive calls
- Calls are peer-to-peer (no server media relay)
- Firebase security rules should be configured for the `calls` collection
- User media permissions are required

## Browser Support

- Modern browsers with WebRTC support
- HTTPS required for media access
- Mobile browsers supported

## Testing

The call system can be tested by:

1. Opening the app on two different devices/browsers
2. Logging in with different accounts
3. Starting a chat between the users
4. Using the call buttons in the chat interface

## Future Enhancements

- **Push Notifications**: FCM integration for call notifications
- **Call History**: Store call logs in Firebase
- **Group Calls**: Multi-party video calls
- **Screen Sharing**: Share screen during calls
- **Call Recording**: Record calls (with consent)
- **Better STUN/TURN**: Custom STUN/TURN servers for better connectivity

## Troubleshooting

### Common Issues

1. **Media Access Denied**: Ensure HTTPS and user permissions
2. **Call Not Connecting**: Check firewall/network settings
3. **Poor Video Quality**: Check network bandwidth
4. **Audio Issues**: Check device audio settings

### Debug Mode

Enable console logging in CallService for debugging:

```typescript
// In callService.ts
console.log('WebRTC Debug:', { event, data });
```

## Dependencies

- WebRTC API (built-in browser support)
- Firebase Firestore (signaling)
- React hooks and context
- Lucide React (icons)

## Configuration

### Firebase Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /calls/{callId} {
      allow read, write: if request.auth != null && 
        request.auth.uid in resource.data.participants;
      
      match /signals/{signalId} {
        allow read, write: if request.auth != null && 
          request.auth.uid in get(/databases/$(database)/documents/calls/$(callId)).data.participants;
      }
    }
  }
}
```

This implementation provides a complete, production-ready WebRTC calling system that integrates seamlessly with your existing AMIK CHAT application. 