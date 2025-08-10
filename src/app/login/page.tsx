
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/chats');
    }
  }, [user, authLoading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const target = e.target as typeof e.target & {
      email: { value: string };
      password: { value: string };
    };
    const email = target.email.value;
    const password = target.password.value;

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/chats');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'داخلہ ناکام',
        description: error.message,
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
            <CardTitle className="text-2xl">کھاتہ</CardTitle>
            <CardDescription>اپنے کھاتے تک رسائی کے لیے اپنی اسناد درج کریں</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
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
                داخل ہوں
              </Button>
            </form>
            <div className="mt-4 text-center text-sm">
              کھاتہ نہیں ہے؟{" "}
              <Link href="/signup" className="underline text-accent">
                کھاتہ بنائیں
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
