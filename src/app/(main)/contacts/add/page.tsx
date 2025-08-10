
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';

export default function AddContactPage() {
  const [contactId, setContactId] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactId.trim() || loading || !currentUser) return;

    setLoading(true);
    const trimmedId = contactId.trim();

    try {
      if (trimmedId === currentUser.uid) {
        toast({
          variant: 'destructive',
          title: 'خرابی',
          description: "آپ خود کو بطور رابطہ شامل نہیں کر سکتے۔",
        });
        setLoading(false);
        return;
      }
      
      const userDocRef = doc(db, 'users', trimmedId);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        toast({
          variant: 'destructive',
          title: 'صارف نہیں ملا',
          description: 'اس ID کے ساتھ کوئی صارف موجود نہیں ہے۔ براہ کرم چیک کریں اور دوبارہ کوشش کریں۔',
        });
        setLoading(false);
        return;
      }
      
      const contactData = userDoc.data();

      const existingContactRef = doc(db, 'users', currentUser.uid, 'contacts', trimmedId);
      const existingContactSnap = await getDoc(existingContactRef);

      if (existingContactSnap.exists()) {
          toast({
              title: 'پہلے سے رابطہ ہے',
              description: `${contactData.name} پہلے ہی آپ کے رابطوں میں ہے۔`,
          });
          setContactId('');
          setLoading(false);
          return;
      }

      const newContactRef = doc(db, 'users', currentUser.uid, 'contacts', trimmedId);
      await setDoc(newContactRef, { addedAt: serverTimestamp() });

      toast({
        title: 'کامیابی!',
        description: `${contactData.name} آپ کے رابطوں میں شامل کر دیا گیا ہے۔`,
      });
      router.push('/contacts');

    } catch (error: any) {
      console.error("Error adding contact:", error);
      toast({
        variant: 'destructive',
        title: 'رابطہ شامل کرنے میں خرابی',
        description: error.message || 'کچھ غلط ہو گیا۔ براہ کرم دوبارہ کوشش کریں۔',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <header className="sticky top-0 z-10 flex items-center gap-4 border-b bg-background p-3">
        <Link href="/contacts" className="p-1 rounded-md hover:bg-muted">
          <ChevronLeft className="h-6 w-6" />
        </Link>
        <h1 className="flex-1 truncate text-lg font-semibold">رابطہ شامل کریں</h1>
      </header>
      <div className="p-4">
        <Card>
          <CardHeader>
            <CardTitle>نیا رابطہ شامل کریں</CardTitle>
            <CardDescription>
              جس صارف کو آپ شامل کرنا چاہتے ہیں اس کی منفرد اے ایم آئی کے چیٹ شناخت درج کریں۔
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleAddContact}>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="contact-id">اے ایم آئی کے چیٹ شناخت</Label>
                <Input
                  id="contact-id"
                  placeholder="e.g., fJ...xZ"
                  value={contactId}
                  onChange={(e) => setContactId(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={loading || !currentUser} className="w-full">
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                رابطہ شامل کریں
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
