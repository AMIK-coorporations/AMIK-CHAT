# Firebase Setup Guide for AMIK CHAT

## Step 1: Update Firebase Security Rules

### Firestore Rules
1. Go to [Firebase Console](https://console.firebase.google.com/project/chatsnap-y6m78/firestore/rules)
2. Replace the existing rules with the content from `firestore.rules` file
3. Click "Publish"

### Realtime Database Rules
1. Go to [Firebase Console](https://console.firebase.google.com/project/chatsnap-y6m78/database/rules)
2. Replace the existing rules with the content from `database.rules.json` file
3. Click "Publish"

## Step 2: Enable Firebase Services

### Authentication
1. Go to [Authentication](https://console.firebase.google.com/project/chatsnap-y6m78/authentication)
2. Click "Get started" if not already enabled
3. Go to "Sign-in method" tab
4. Enable "Email/Password" provider
5. Add `localhost` to authorized domains

### Firestore Database
1. Go to [Firestore Database](https://console.firebase.google.com/project/chatsnap-y6m78/firestore)
2. Click "Create database" if not already created
3. Choose "Start in test mode" (we'll secure it with rules)
4. Select a location (preferably close to your users)

### Realtime Database
1. Go to [Realtime Database](https://console.firebase.google.com/project/chatsnap-y6m78/database)
2. Click "Create database" if not already created
3. Choose "Start in test mode" (we'll secure it with rules)
4. Select a location

## Step 3: Test the Setup

1. Start your development server: `npm run dev`
2. Go to `http://localhost:3000/debug`
3. Log in with your account
4. Click "Run Debug Tests" to verify everything is working
5. If any tests fail, check the error messages and ensure the rules are properly published

## Step 4: Add Contacts

Once the debug tests pass:
1. Go to `http://localhost:3000/contacts`
2. Click the "+" button to add a contact
3. Enter a valid user ID (you can create a test user using the debug page)
4. The contact should be added successfully

## Common Issues and Solutions

### "Missing or insufficient permissions"
- Ensure Firestore rules are published
- Check that the user is authenticated
- Verify the database structure matches the rules

### "User not found"
- Make sure the user ID exists in the `users` collection
- Check that the user document was created during signup

### "Cannot read contacts"
- Ensure the user has a `contacts` subcollection
- Check that the Firestore rules allow reading contacts

## Database Structure

The app expects this structure:

```
users/
  {userId}/
    name: string
    avatarUrl: string
    contacts/
      {contactId}/
        addedAt: timestamp
chats/
  {chatId}/
    participantIds: array
    participantsInfo: object
    createdAt: timestamp
    lastMessage: object
    messages/
      {messageId}/
        text: string
        senderId: string
        timestamp: timestamp
        isRead: boolean
calls/
  {callId}/
    participants: array
    isVideo: boolean
    createdAt: timestamp
    status: string
    signals/
      {signalId}/
        from: string
        to: string
        type: string
        data: object
```

## Realtime Database Structure

```
files/
  {chatId}/
    {fileId}/
      fileName: string
      fileType: string
      fileSize: number
      fileData: string (base64)
      senderId: string
      timestamp: number
voice_messages/
  {chatId}/
    {messageId}/
      audioData: string (base64)
      duration: number
      senderId: string
      timestamp: number
``` 