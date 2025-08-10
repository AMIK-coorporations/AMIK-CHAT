
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
        avatarUrl: `https://placehold.co/100x100.png?text=${username.charAt(0)}`
      });

      router.push('/chats');

    } catch (error: any) {
      let description = "ایک نامعلوم خرابی پیش آگئی۔";
      if (error.code === 'auth/api-key-not-valid') {
        description = "آپ کی Firebase API کلید درست نہیں ہے۔ براہ کرم اپنی .env فائل کو چیک کریں۔"
      } else if (error.message) {
        description = error.message;
      }
      toast({
        variant: "destructive",
        title: "سائن اپ ناکام",
        description: description,
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
          <Image 
            src="https://storage.googleapis.com/project-123-files/user-upload-5f6962ce-4b8c-4467-9c98-132da9700305.png?v=8"
            alt="AMIK CHAT Logo" 
            width={64} 
            height={64} 
            className="mx-auto" 
            data-ai-hint="logo chat bubble"
          />
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
