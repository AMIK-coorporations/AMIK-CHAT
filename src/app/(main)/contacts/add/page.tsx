
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
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { sendContactRequest, ContactRequestError } from '@/lib/contactRequestService';

export default function AddContactPage() {
  const [contactId, setContactId] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { user: currentUser, userData } = useAuth();

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactId.trim() || loading || !currentUser) return;

    setLoading(true);
    const trimmedId = contactId.trim();

    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (loading) {
        setLoading(false);
        toast({
          variant: 'destructive',
          title: 'وقت ختم',
          description: 'درخواست بہت دیر لگ رہی ہے۔ براہ کرم اپنا انٹرنیٹ کنکشن چیک کریں اور دوبارہ کوشش کریں۔',
        });
      }
    }, 15000); // 15 second timeout

    try {
      if (trimmedId === currentUser.uid) {
        clearTimeout(timeoutId);
        toast({
          variant: 'destructive',
          title: 'خرابی',
          description: "آپ خود کو بطور رابطہ شامل نہیں کر سکتے۔",
        });
        setLoading(false);
        return;
      }
      
      // First, check if the target user exists
      const userDocRef = doc(db, 'users', trimmedId);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        clearTimeout(timeoutId);
        toast({
          variant: 'destructive',
          title: 'صارف نہیں ملا',
          description: 'اس ID کے ساتھ کوئی صارف موجود نہیں ہے۔ براہ کرم چیک کریں اور دوبارہ کوشش کریں۔',
        });
        setLoading(false);
        return;
      }
      
      await sendContactRequest({
        senderId: currentUser.uid,
        senderProfile: userData ?? undefined,
        targetUserId: trimmedId,
      });

      clearTimeout(timeoutId);
      toast({
        title: 'آپ کی درخواست بھیج دی گئی ہے',
        description: 'منظوری کے بعد آپ رابطہ کر سکیں گے۔',
      });
      setContactId('');
      router.push('/contacts?tab=requests');

    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error("Error adding contact:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      
      if (error instanceof ContactRequestError) {
        let message = 'کچھ غلط ہو گیا۔';
        if (error.code === 'already-contact') {
          message = 'یہ صارف پہلے ہی آپ کے رابطوں میں ہے۔';
        } else if (error.code === 'already-pending') {
          message = 'آپ کی درخواست پہلے سے زیر التواء ہے۔';
        } else if (error.code === 'incoming-exists') {
          message = 'سامنے والے نے پہلے ہی درخواست بھیجی ہے، برائے مہربانی درخواستیں دیکھیں۔';
        } else if (error.code === 'already-accepted') {
          message = 'یہ رابطہ پہلے ہی منظور ہو چکا ہے۔';
        } else if (error.code === 'user-not-found') {
          message = 'صارف نہیں ملا۔';
        }

        toast({
          variant: 'destructive',
          title: 'درخواست میں مسئلہ',
          description: message,
        });
      } else {
        // Provide more specific error messages
        let errorMessage = 'کچھ غلط ہو گیا۔ براہ کرم دوبارہ کوشش کریں۔';

        if (error.code === 'permission-denied') {
          errorMessage = 'سیکیورٹی قوانین کو چیک کریں۔ Firebase اجازت مسترد کر دی گئی۔ براہ کرم اپنے Firestore سیکیورٹی قوانین کو Firebase کنسول میں اپ ڈیٹ کریں۔';
        } else if (error.code === 'unavailable') {
          errorMessage = 'Firebase سروس دستیاب نہیں ہے۔ براہ کرم اپنا انٹرنیٹ کنکشن چیک کریں۔';
        } else if (error.code === 'deadline-exceeded') {
          errorMessage = 'درخواست کا وقت ختم ہو گیا۔ براہ کرم دوبارہ کوشش کریں۔';
        } else if (error.message) {
          errorMessage = error.message;
        }

        toast({
          variant: 'destructive',
          title: 'رابطہ شامل کرنے میں خرابی',
          description: errorMessage,
          duration: 10000, // Show for 10 seconds so user can read it
        });
      }
    } finally {
      clearTimeout(timeoutId);
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
