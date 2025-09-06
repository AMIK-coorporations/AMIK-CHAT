"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export default function DebugPage() {
  const { user, userData } = useAuth();
  const { toast } = useToast();
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const runDebugTests = async () => {
    if (!user) return;
    
    setLoading(true);
    const results: any = {};

    try {
      // Test 1: Check if user document exists
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      results.userDocumentExists = userDoc.exists();
      results.userDocumentData = userDoc.exists() ? userDoc.data() : null;

      // Test 2: Try to read user document
      try {
        await getDoc(userDocRef);
        results.canReadUserDocument = true;
      } catch (error: any) {
        results.canReadUserDocument = false;
        results.readUserError = error.message;
      }

      // Test 3: Try to write to user document
      try {
        await setDoc(userDocRef, { 
          lastDebugTest: new Date().toISOString(),
          ...userDoc.data()
        }, { merge: true });
        results.canWriteUserDocument = true;
      } catch (error: any) {
        results.canWriteUserDocument = false;
        results.writeUserError = error.message;
      }

      // Test 4: Check contacts collection
      const contactsColRef = collection(db, 'users', user.uid, 'contacts');
      try {
        const contactsSnapshot = await getDocs(contactsColRef);
        results.canReadContacts = true;
        results.contactsCount = contactsSnapshot.size;
      } catch (error: any) {
        results.canReadContacts = false;
        results.readContactsError = error.message;
      }

      // Test 5: Try to write to contacts collection
      try {
        const testContactRef = doc(db, 'users', user.uid, 'contacts', 'test-contact');
        await setDoc(testContactRef, { 
          addedAt: new Date(),
          test: true 
        });
        results.canWriteContacts = true;
        
        // Clean up test contact
        await setDoc(testContactRef, { 
          addedAt: new Date(),
          test: true,
          shouldDelete: true 
        });
      } catch (error: any) {
        results.canWriteContacts = false;
        results.writeContactsError = error.message;
      }

      // Test 6: Check if we can read other users
      try {
        const otherUserRef = doc(db, 'users', 'test-user-id');
        await getDoc(otherUserRef);
        results.canReadOtherUsers = true;
      } catch (error: any) {
        results.canReadOtherUsers = false;
        results.readOtherUsersError = error.message;
      }

    } catch (error: any) {
      results.generalError = error.message;
    }

    setDebugInfo(results);
    setLoading(false);
    
    toast({
      title: 'Debug tests completed',
      description: 'Check the results below',
    });
  };

  const createTestUser = async () => {
    if (!user) return;
    
    try {
      const testUserId = 'test-user-' + Date.now();
      const testUserRef = doc(db, 'users', testUserId);
      await setDoc(testUserRef, {
        name: 'Test User',
        avatarUrl: 'https://placehold.co/100x100.png?text=T',
        createdAt: new Date()
      });
      
      toast({
        title: 'Test user created',
        description: `User ID: ${testUserId}`,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to create test user',
        description: error.message,
      });
    }
  };

  const createTestChat = async () => {
    if (!user) return;
    
    try {
      // Create a test user first
      const testUserId = 'test-user-' + Date.now();
      const testUserRef = doc(db, 'users', testUserId);
      await setDoc(testUserRef, {
        name: 'Test User',
        avatarUrl: 'https://placehold.co/100x100.png?text=T',
        createdAt: new Date()
      });
      
      // Create a chat between current user and test user
      const chatId = [user.uid, testUserId].sort().join('_');
      const chatRef = doc(db, 'chats', chatId);
      
      await setDoc(chatRef, {
        participantIds: [user.uid, testUserId],
        participantsInfo: {
          [user.uid]: {
            name: userData?.name || 'Current User',
            avatarUrl: userData?.avatarUrl || 'https://placehold.co/100x100.png?text=C'
          },
          [testUserId]: {
            name: 'Test User',
            avatarUrl: 'https://placehold.co/100x100.png?text=T'
          }
        },
        createdAt: new Date(),
        lastMessage: null
      });
      
      toast({
        title: 'Test chat created',
        description: `Chat ID: ${chatId}`,
      });
      
      // Navigate to the new chat
      router.push(`/chats/${chatId}`);
      
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to create test chat',
        description: error.message,
      });
    }
  };

  if (!user) {
    return (
      <div className="p-4">
        <Card>
          <CardHeader>
            <CardTitle>Debug Page</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Please log in to access debug features.</p>
          </CardContent>
        </Card>
          </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Firebase Debug Tools</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
        <div>
            <h3 className="font-semibold mb-2">Current User Info:</h3>
            <pre className="bg-muted p-2 rounded text-sm overflow-auto">
              {JSON.stringify({
                uid: user.uid,
                email: user.email,
                userData: userData
              }, null, 2)}
            </pre>
        </div>

          <div className="flex gap-2">
            <Button onClick={runDebugTests} disabled={loading}>
              {loading ? 'Running Tests...' : 'Run Debug Tests'}
            </Button>
            <Button onClick={createTestUser} variant="outline">
              Create Test User
            </Button>
            <Button onClick={createTestChat} variant="outline">
              Create Test Chat
            </Button>
        </div>

          {Object.keys(debugInfo).length > 0 && (
        <div>
              <h3 className="font-semibold mb-2">Debug Results:</h3>
              <pre className="bg-muted p-2 rounded text-sm overflow-auto max-h-96">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
          </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 