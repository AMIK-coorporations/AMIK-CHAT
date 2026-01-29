
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import LoadingOverlay from '@/components/LoadingOverlay';
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import Image from 'next/image';
import AppLogo from '@/components/AppLogo';

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

            // Show success message
            toast({
                title: 'داخلہ کامیاب',
                description: 'آپ کامیابی سے داخل ہو گئے ہیں۔',
            });

            // Wait for auth state to update, then redirect
            await new Promise(resolve => setTimeout(resolve, 500));

            // Use window.location for a full page reload to ensure auth state is properly set
            window.location.href = '/chats';
        } catch (error: any) {
            let errorMessage = 'داخلہ ناکام ہوا۔ براہ کرم اپنے اسناد چیک کریں۔';

            if (error.code === 'auth/user-not-found') {
                errorMessage = 'اس ای میل کے ساتھ کوئی کھاتہ موجود نہیں ہے۔';
            } else if (error.code === 'auth/wrong-password') {
                errorMessage = 'غلط خفیہ کوڈ۔ براہ کرم دوبارہ کوشش کریں۔';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'غلط ای میل فارمیٹ۔';
            } else if (error.code === 'auth/too-many-requests') {
                errorMessage = 'بہت زیادہ ناکام کوششیں۔ براہ کرم کچھ دیر بعد کوشش کریں۔';
            } else if (error.message) {
                errorMessage = error.message;
            }

            toast({
                variant: 'destructive',
                title: 'داخلہ ناکام',
                description: errorMessage,
                duration: 5000,
            });
        } finally {
            setLoading(false);
        }
    };

    if (authLoading || user) {
        return (
            <div className="relative flex min-h-screen w-full items-center justify-center bg-background p-4">
                <LoadingOverlay />
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
                                {loading && <span className="mr-2 inline-flex"><div className="amik-spinner w-4 h-4"><span className="amik-spinner-dot" /></div></span>}
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
