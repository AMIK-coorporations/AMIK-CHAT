"use client";

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
    getDocFromInsforge,
    setDocInInsforge,
    updateDocInInsforge,
    deleteDocFromInsforge,
    getQueryFromInsforge,
    onSnapshotFromInsforge
} from '@/lib/insforgeUtils';
import { insforge } from '@/lib/insforge';

export default function InsForgeDebugPage() {
    const { user, userData } = useAuth();
    const { toast } = useToast();
    const [results, setResults] = useState<any>({});
    const [loading, setLoading] = useState(false);
    const [realtimeData, setRealtimeData] = useState<any[]>([]);

    const runTests = async () => {
        if (!user) return;
        setLoading(true);
        const testId = `test_${Date.now()}`;
        const newResults: any = {};

        try {
            // Test 1: Set Doc
            newResults.setDoc = "Testing...";
            await setDocInInsforge('users', user.uid, {
                ...userData,
                lastDebugAt: new Date().toISOString()
            });
            newResults.setDoc = "Success";

            // Test 2: Get Doc
            newResults.getDoc = "Testing...";
            const data = await getDocFromInsforge('users', user.uid);
            newResults.getDoc = data ? "Success: " + JSON.stringify(data) : "Failed (Not found)";

            // Test 3: Update Doc
            newResults.updateDoc = "Testing...";
            await updateDocInInsforge('users', user.uid, {
                debugStatus: 'updated'
            });
            newResults.updateDoc = "Success";

            // Test 4: Query
            newResults.query = "Testing...";
            const users = await getQueryFromInsforge('users', (q) => q.limit(5));
            newResults.query = `Found ${users.length} users`;

            // Test 5: Realtime Connection
            newResults.realtime = "Checking connection state: " + insforge.realtime.connectionState;

        } catch (error: any) {
            newResults.error = error.message;
            console.error(error);
        }

        setResults(newResults);
        setLoading(false);
        toast({ title: "Tests Complete" });
    };

    const subscribeToRealtime = () => {
        const unsub = onSnapshotFromInsforge('messages:*', 'UPDATE_message', (payload) => {
            setRealtimeData(prev => [payload, ...prev].slice(0, 10));
        });
        toast({ title: "Subscribed to messages" });
        return unsub;
    };

    if (!user) {
        return <div className="p-4">Please log in.</div>;
    }

    return (
        <div className="p-4 space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>InsForge Debug Tools</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2">
                        <Button onClick={runTests} disabled={loading}>
                            {loading ? 'Running...' : 'Run CRUD Tests'}
                        </Button>
                        <Button onClick={subscribeToRealtime} variant="outline">
                            Test Realtime Subscribe
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <h3 className="font-semibold mb-2">CRUD Results:</h3>
                            <pre className="bg-muted p-2 rounded text-xs overflow-auto h-64">
                                {JSON.stringify(results, null, 2)}
                            </pre>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2">Realtime Stream (Last 10):</h3>
                            <pre className="bg-muted p-2 rounded text-xs overflow-auto h-64">
                                {JSON.stringify(realtimeData, null, 2)}
                            </pre>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
