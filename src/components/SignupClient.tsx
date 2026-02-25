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
                            className="group w-full flex items-center justify-center overflow-hidden transition-all duration-300"
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
