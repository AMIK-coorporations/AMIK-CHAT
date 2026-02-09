
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
import { insforge } from "@/lib/insforge";
import { useAuth } from "@/hooks/useAuth";
import AppLogo from '@/components/AppLogo';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
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
            const { data, error: authError } = await insforge.auth.signInWithPassword({
                email,
                password
            });

            if (authError) throw authError;

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

            const errorStr = error.message || String(error);
            if (error.statusCode === 401 || errorStr.includes('Invalid credentials') || errorStr.includes('invalid-credential')) {
                errorMessage = 'غلط ای میل یا خفیہ کوڈ۔ براہ کرم دوبارہ کوشش کریں۔';
            } else if (error.statusCode === 404) {
                errorMessage = 'اس ای میل کے ساتھ کوئی کھاتہ موجود نہیں ہے۔';
            } else if (error.statusCode === 429 || errorStr.includes('Too many')) {
                errorMessage = 'بہت زیادہ ناکام کوششیں۔ براہ کرم کچھ دیر بعد کوشش کریں۔';
            } else if (errorStr.includes('Request failed') || errorStr.includes('fetch') || errorStr.includes('network')) {
                errorMessage = 'سرور سے رابطہ نہیں ہو سکا۔ براہ کرم اپنا انٹرنیٹ کنکشن چیک کریں اور دوبارہ کوشش کریں۔';
            } else if (errorStr && errorStr !== '[object Object]') {
                errorMessage = errorStr;
            }

            console.error("Login error:", error);

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
                    <AppLogo width={48} height={48} className="mx-auto" alt="AMIK CHAT Logo" />
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
                        <div className="relative my-4">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-card px-2 text-muted-foreground">یا</span>
                            </div>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            disabled={googleLoading || loading}
                            onClick={async () => {
                                setGoogleLoading(true);
                                try {
                                    await insforge.auth.signInWithOAuth({
                                        provider: 'google',
                                        redirectTo: `${window.location.origin}/chats`,
                                    });
                                } catch (error: any) {
                                    console.error("Google auth error:", error);
                                    toast({
                                        variant: "destructive",
                                        title: "گوگل سے داخلہ ناکام",
                                        description: "براہ کرم دوبارہ کوشش کریں۔",
                                    });
                                    setGoogleLoading(false);
                                }
                            }}
                        >
                            {googleLoading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <svg className="h-5 w-5" viewBox="0 0 24 24">
                                    <path
                                        fill="currentColor"
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    />
                                    <path
                                        fill="#34A853"
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    />
                                    <path
                                        fill="#FBBC05"
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    />
                                    <path
                                        fill="#EA4335"
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    />
                                    <path fill="none" d="M1 1h22v22H1z" />
                                </svg>
                            )}
                        </Button>
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
