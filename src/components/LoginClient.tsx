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

export default function LoginClient() {
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
                            className="group w-full flex items-center justify-center overflow-hidden transition-all duration-300 h-11"
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
                                <div className="flex items-center justify-center">
                                    <svg className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" viewBox="0 0 48 48">
                                        <path
                                            fill="#EA4335"
                                            d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                                        />
                                        <path
                                            fill="#4285F4"
                                            d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                                        />
                                        <path
                                            fill="#FBBC05"
                                            d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z"
                                        />
                                        <path
                                            fill="#34A853"
                                            d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                                        />
                                    </svg>
                                    <span className="max-w-0 opacity-0 overflow-hidden whitespace-nowrap transition-all duration-300 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-2 text-sm font-medium">
                                        گوگل کے ساتھ داخل ہوں
                                    </span>
                                </div>
                            )}
                        </Button>
                        <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
                            <Link href="/privacy-policy" className="hover:underline">پرائیویسی پالیسی</Link>
                            <span>•</span>
                            <Link href="/terms-of-services" className="hover:underline">شرائط و ضوابط</Link>
                        </div>
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
