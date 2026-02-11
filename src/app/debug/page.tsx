"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { setDocInInsforge, getDocFromInsforge, getQueryFromInsforge } from '@/lib/insforgeUtils';
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
      // Test 1: Check if user document exists in InsForge
      const userDoc = await getDocFromInsforge('users', user.id);
      results.userDocumentExists = !!userDoc;
      results.userDocumentData = userDoc;

      // Test 2: Try to write to user document in InsForge
      try {
        await setDocInInsforge('users', user.id, {
          lastDebugTest: new Date().toISOString(),
          ...userDoc
        });
        results.canWriteUserDocument = true;
      } catch (error: any) {
        results.canWriteUserDocument = false;
        results.writeUserError = error.message;
      }

      // Test 3: Check contacts in user_contacts table
      try {
        const contacts = await getQueryFromInsforge('user_contacts', (q) => q.eq('user_id', user.id));
        results.canReadContacts = true;
        results.contactsCount = contacts.length;
      } catch (error: any) {
        results.canReadContacts = false;
        results.readContactsError = error.message;
      }

      // Test 4: Check chats in chats table
      try {
        const chats = await getQueryFromInsforge('chats', (q) => q.contains('participant_ids', [user.id]));
        results.canReadChats = true;
        results.chatsCount = chats.length;
      } catch (error: any) {
        results.canReadChats = false;
        results.readChatsError = error.message;
      }

    } catch (error: any) {
      results.generalError = error.message;
    }

    setDebugInfo(results);
    setLoading(false);

    toast({
      title: 'InsForge debug tests completed',
      description: 'Check the results below',
    });
  };

  const createTestUser = async () => {
    if (!user) return;

    try {
      const testUserId = 'test-user-' + Date.now();
      await setDocInInsforge('users', testUserId, {
        name: 'Test User',
        avatarUrl: 'https://placehold.co/100x100.png?text=T',
        createdAt: new Date()
      });

      toast({
        title: 'Test user created in InsForge',
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
      await setDocInInsforge('users', testUserId, {
        name: 'Test User',
        avatarUrl: 'https://placehold.co/100x100.png?text=T',
        createdAt: new Date()
      });

      // Create a chat between current user and test user
      const chatId = [user.id, testUserId].sort().join('_');
      await setDocInInsforge('chats', chatId, {
        participantIds: [user.id, testUserId],
        participantsInfo: {
          [user.id]: {
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
        title: 'Test chat created in InsForge',
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
          <CardTitle>InsForge Debug Tools</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Current User Info:</h3>
            <pre className="bg-muted p-2 rounded text-sm overflow-auto">
              {JSON.stringify({
                id: user.id,
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