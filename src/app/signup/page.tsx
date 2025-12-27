
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import Image from 'next/image';
import AppLogo from '@/components/AppLogo';

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/chats');
    }
  }, [user, authLoading, router]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const target = e.target as typeof e.target & {
      username: { value: string };
      email: { value: string };
      password: { value: string };
    };
    const username = target.username.value;
    const email = target.email.value;
    const password = target.password.value;

    if (password.length < 6) {
        toast({
            variant: "destructive",
            title: "خفیہ کوڈ بہت چھوٹا ہے",
            description: "خفیہ کوڈ کم از کم 6 حروف کا ہونا چاہیے۔",
        });
        setLoading(false);
        return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create a user document in Firestore
      await setDoc(doc(db, "users", user.uid), {
        name: username,
        displayName: username,
        avatarUrl: `https://placehold.co/100x100.png?text=${username.charAt(0)}`,
        createdAt: new Date(),
        lastSeen: new Date(),
        isOnline: true
      });

      // Show success message
      toast({
        title: 'کھاتہ بن گیا!',
        description: 'آپ کا کھاتہ کامیابی سے بن گیا ہے۔',
      });

      // Wait for auth state to update and Firestore write to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Use window.location for a full page reload to ensure auth state is properly set
      window.location.href = '/chats';

    } catch (error: any) {
      let description = "ایک نامعلوم خرابی پیش آگئی۔";
      
      // Handle specific Firebase Auth error codes
      if (error.code === 'auth/api-key-not-valid') {
        description = "آپ کی Firebase API کلید درست نہیں ہے۔ براہ کرم Firebase کنسول میں ویب ایپ کی ترتیب اور NEXT_PUBLIC_FIREBASE_* ماحول کی ویریبلز کو چیک کریں۔";
      } else if (error.code === 'auth/email-already-in-use') {
        description = "یہ ای میل پہلے سے استعمال ہو رہی ہے۔ براہ کرم دوسری ای میل استعمال کریں یا لاگ ان کریں۔";
      } else if (error.code === 'auth/invalid-email') {
        description = "غلط ای میل فارمیٹ۔ براہ کرم درست ای میل درج کریں۔";
      } else if (error.code === 'auth/weak-password') {
        description = "خفیہ کوڈ بہت کمزور ہے۔ براہ کرم کم از کم 6 حروف کا مضبوط خفیہ کوڈ استعمال کریں۔";
      } else if (error.code === 'auth/operation-not-allowed') {
        description = "یہ آپریشن اجازت نہیں ہے۔ براہ کرم Firebase کنسول میں ای میل/پاس ورڈ سائن اپ کو فعال کریں۔";
      } else if (error.code === 'auth/network-request-failed') {
        description = "نیٹ ورک کنکشن نہیں ہے۔ براہ کرم اپنا انٹرنیٹ کنکشن چیک کریں۔";
      } else if (error.message) {
        description = error.message;
      }
      
      toast({
        variant: "destructive",
        title: "سائن اپ ناکام",
        description: description,
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || user) {
    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <AppLogo width={64} height={64} className="mx-auto" alt="AMIK CHAT Logo" />
          <h1 className="text-4xl font-bold mt-4">AMIK CHAT</h1>
        </div>
        <Card>
        <CardHeader>
          <CardTitle className="text-2xl">کھاتہ بنائیں</CardTitle>
          <CardDescription>شروع کرنے کے لیے اپنی معلومات درج کریں</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">صارف نام</Label>
              <Input id="username" name="username" type="text" placeholder="آپ کا نام" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">برقی خط</Label>
              <Input id="email" name="email" type="email" placeholder="m@example.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">خفیہ کوڈ</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              کھاتہ بنائیں
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            پہلے سے کھاتہ ہے؟{" "}
            <Link href="/login" className="underline text-accent">
              داخل ہوں
            </Link>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
