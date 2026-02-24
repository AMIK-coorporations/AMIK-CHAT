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
import { insforge } from "@/lib/insforge";
import { useAuth } from "@/hooks/useAuth";
import { setDocInInsforge } from "@/lib/insforgeUtils";
import AppLogo from '@/components/AppLogo';

export default function SignupClient() {
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
            const { data: authData, error: authError } = await insforge.auth.signUp({
                email,
                password,
                name: username
            });

            if (authError) throw authError;
            if (!authData?.user) throw new Error("سائن اپ ناکام ہو گیا۔");

            const userId = authData.user.id;

            const userDoc = {
                name: username,
                displayName: username,
                email: email,
                avatarUrl: `https://placehold.co/100x100.png?text=${username.charAt(0)}`,
                photoURL: `https://placehold.co/100x100.png?text=${username.charAt(0)}`,
                createdAt: new Date(),
                lastSeen: new Date(),
                isOnline: true
            };

            // Create in InsForge Database
            try {
                console.log("Creating profile in InsForge...", userId);
                await setDocInInsforge('users', userId, userDoc);
                console.log("InsForge profile created");
            } catch (error) {
                console.error("InsForge profile creation failed:", error);
            }

            // Show success message
            toast({
                title: 'کھاتہ بن گیا!',
                description: 'آپ کا کھاتہ کامیابی سے بن گیا ہے۔',
            });

            // Wait for auth state to update
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Use window.location for a full page reload to ensure auth state is properly set
            window.location.href = '/chats';

        } catch (error: any) {
            let description = "ایک نامعلوم خرابی پیش آگئی۔";

            // Handle InsForge / SDK error codes
            if (error.statusCode === 409 || error.message?.includes('already exists')) {
                description = "یہ ای میل پہلے سے استعمال ہو رہی ہے۔ براہ کرم دوسری ای میل استعمال کریں یا لاگ ان کریں۔";
            } else if (error.statusCode === 400) {
                description = "درج کردہ معلومات درست نہیں ہیں۔ براہ کرم دوبارہ چیک کریں۔";
            } else if (error.statusCode === 429 || error.message?.includes('Too many')) {
                description = "بہت زیادہ درخواستیں۔ براہ کرم کچھ دیر بعد دوبارہ کوشش کریں۔";
            } else if (error.message?.includes('Request failed') || error.message?.includes('fetch') || error.message?.includes('network')) {
                description = "سرور سے رابطہ نہیں ہو سکا۔ براہ کرم اپنا انٹرنیٹ کنکشن چیک کریں اور دوبارہ کوشش کریں۔";
            } else if (error.message) {
                description = error.message;
            }

            console.error("Signup error:", error);

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
    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <AppLogo width={48} height={48} className="mx-auto" alt="AMIK CHAT Logo" />
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
                        <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
                            <Link href="/privacy-policy" className="hover:underline">پرائیویسی پالیسی</Link>
                            <span>•</span>
                            <Link href="/terms-of-services" className="hover:underline">شرائط و ضوابط</Link>
                        </div>
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
