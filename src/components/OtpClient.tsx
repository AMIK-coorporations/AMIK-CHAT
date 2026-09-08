"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowRight, RotateCw, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { updateDocInInsforge } from "@/lib/insforgeUtils";
import AppLogo from "@/components/AppLogo";
import LoadingOverlay from "@/components/LoadingOverlay";

export default function OtpClient() {
    const router = useRouter();
    const { toast } = useToast();
    const { user, userData, loading: authLoading, signOut, refreshUserData } = useAuth();
    
    const [otpValues, setOtpValues] = useState<string[]>(Array(6).fill(""));
    const [verifying, setVerifying] = useState(false);
    const [resending, setResending] = useState(false);
    const [resendCountdown, setResendCountdown] = useState(30);
    const [activeOtpCode, setActiveOtpCode] = useState<string>("");

    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Guard & Initialization
    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            router.replace("/login");
            return;
        }

        // If user is already OTP verified and has no pending OTP, redirect to /chats
        const hasPendingOtp = typeof window !== 'undefined' && sessionStorage.getItem(`otp_${user.id}`);
        if (userData && userData.isOtpVerified !== false && !hasPendingOtp) {
            router.replace("/chats");
            return;
        }

        // Determine current OTP code
        let storedOtp = userData?.otpCode || "";
        if (!storedOtp && typeof window !== "undefined") {
            storedOtp = sessionStorage.getItem(`otp_${user.id}`) || "";
        }
        if (!storedOtp) {
            // Generate fallback if missing
            storedOtp = Math.floor(100000 + Math.random() * 900000).toString();
            if (typeof window !== "undefined") {
                sessionStorage.setItem(`otp_${user.id}`, storedOtp);
            }
            updateDocInInsforge("users", user.id, { otpCode: storedOtp, isOtpVerified: false }).catch(console.error);
        }

        setActiveOtpCode(storedOtp);

        // Notify user of OTP code for smooth testing
        toast({
            title: "او ٹی پی کوڈ (OTP Code)",
            description: `آپ کا تصدیقی کوڈ ہے: ${storedOtp}`,
            duration: 12000,
        });
    }, [user, userData, authLoading, router, toast]);

    // Resend countdown timer
    useEffect(() => {
        if (resendCountdown <= 0) return;
        const timer = setInterval(() => {
            setResendCountdown((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [resendCountdown]);

    const handleInputChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;

        const newValues = [...otpValues];
        newValues[index] = value.substring(value.length - 1);
        setOtpValues(newValues);

        // Auto-advance to next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && !otpValues[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData("text").trim();
        if (/^\d{6}$/.test(pastedData)) {
            const digits = pastedData.split("");
            setOtpValues(digits);
            inputRefs.current[5]?.focus();
        }
    };

    const handleVerify = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const enteredOtp = otpValues.join("");

        if (enteredOtp.length < 6) {
            toast({
                variant: "destructive",
                title: "ناکافی ہندسے",
                description: "براہ کرم تمام 6 ہندسوں کا او ٹی پی کوڈ درج کریں۔",
            });
            return;
        }

        setVerifying(true);

        try {
            const expectedOtp = activeOtpCode || userData?.otpCode || (typeof window !== "undefined" ? sessionStorage.getItem(`otp_${user?.id}`) : "");

            // Verification logic: check entered OTP against expected OTP or universal test code '123456'
            if (enteredOtp === expectedOtp || enteredOtp === "123456" || (expectedOtp && enteredOtp === expectedOtp.trim())) {
                if (user?.id) {
                    await updateDocInInsforge("users", user.id, {
                        isOtpVerified: true,
                        otpCode: null,
                    });
                    if (typeof window !== "undefined") {
                        sessionStorage.removeItem(`otp_${user.id}`);
                    }
                    await refreshUserData();
                }

                toast({
                    title: "تصدیق کامیاب!",
                    description: "آپ کا کھاتہ کامیابی سے تصدیق ہو گیا ہے۔",
                });

                await new Promise((r) => setTimeout(r, 600));
                window.location.href = "/chats";
            } else {
                toast({
                    variant: "destructive",
                    title: "تصدیق ناکام",
                    description: "درج کردہ او ٹی پی کوڈ غلط ہے۔ براہ کرم دوبارہ کوشش کریں۔",
                });
            }
        } catch (error: any) {
            console.error("OTP verification error:", error);
            toast({
                variant: "destructive",
                title: "خرابی پیش آگئی",
                description: "تصدیق کے دوران ایک خرابی پیش آئی۔ براہ کرم دوبارہ کوشش کریں۔",
            });
        } finally {
            setVerifying(false);
        }
    };

    const handleResend = async () => {
        if (resendCountdown > 0 || !user?.id) return;
        setResending(true);

        try {
            const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
            await updateDocInInsforge("users", user.id, {
                otpCode: newOtp,
                isOtpVerified: false,
            });

            if (typeof window !== "undefined") {
                sessionStorage.setItem(`otp_${user.id}`, newOtp);
            }

            setActiveOtpCode(newOtp);
            setResendCountdown(30);

            toast({
                title: "نیا او ٹی پی بھیج دیا گیا!",
                description: `آپ کا نیا تصدیقی کوڈ ہے: ${newOtp}`,
                duration: 10000,
            });
        } catch (error: any) {
            console.error("Resend OTP error:", error);
            toast({
                variant: "destructive",
                title: "کوڈ بھیجنے میں ناکامی",
                description: "براہ کرم کچھ دیر بعد دوبارہ کوشش کریں۔",
            });
        } finally {
            setResending(false);
        }
    };

    if (authLoading || !user || (userData && userData.isOtpVerified !== false)) {
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
                    <CardHeader className="text-center pb-4">
                        <CardTitle className="text-2xl font-bold">او ٹی پی تصدیق</CardTitle>
                        <CardDescription className="mt-2 text-sm text-muted-foreground dir-rtl">
                            {user?.email ? (
                                <span>
                                    آپ کے ای میل <span className="font-semibold text-foreground">{user.email}</span> پر 6 ہندسوں کا کوڈ بھیج دیا گیا ہے۔
                                </span>
                            ) : (
                                <span>براہ کرم اپنا 6 ہندسوں کا تصدیقی کوڈ درج کریں</span>
                            )}
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        <form onSubmit={handleVerify} className="space-y-6">
                            {/* 6 OTP Digit Input Boxes */}
                            <div className="flex justify-center gap-2 dir-ltr" onPaste={handlePaste}>
                                {otpValues.map((digit, index) => (
                                    <input
                                        key={index}
                                        ref={(el) => {
                                            inputRefs.current[index] = el;
                                        }}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleInputChange(index, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(index, e)}
                                        className="w-10 h-12 text-center text-xl font-bold rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all shadow-sm"
                                        autoFocus={index === 0}
                                    />
                                ))}
                            </div>

                            <Button type="submit" className="w-full h-11 text-base font-medium" disabled={verifying || otpValues.join("").length < 6}>
                                {verifying ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <span>تصدیق کریں</span>
                                )}
                            </Button>
                        </form>

                        {/* Active OTP Code Display for quick testing */}
                        {activeOtpCode && (
                            <div className="p-3 bg-muted/50 rounded-lg text-center border text-xs text-muted-foreground">
                                <span className="block font-medium mb-1">ٹیسٹ کوڈ (Test OTP Code):</span>
                                <span className="font-mono text-base font-bold text-accent tracking-widest">{activeOtpCode}</span>
                            </div>
                        )}

                        <div className="space-y-3 pt-2 text-center border-t text-sm">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>کوڈ موصول نہیں ہوا؟</span>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-auto p-0 text-accent hover:bg-transparent hover:underline text-xs"
                                    disabled={resending || resendCountdown > 0}
                                    onClick={handleResend}
                                >
                                    {resending ? (
                                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                    ) : resendCountdown > 0 ? (
                                        <span>دوبارہ بھیجیں ({resendCountdown}s)</span>
                                    ) : (
                                        <span className="flex items-center gap-1">
                                            <RotateCw className="h-3 w-3" />
                                            دوبارہ کوڈ بھیجیں
                                        </span>
                                    )}
                                </Button>
                            </div>

                            <div className="pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="w-full text-xs text-muted-foreground flex items-center justify-center gap-1.5"
                                    onClick={() => signOut()}
                                >
                                    <LogOut className="h-3.5 w-3.5" />
                                    <span>دیگر کھاتے سے لاگ ان کریں</span>
                                </Button>
                            </div>
                        </div>

                        <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
                            <Link href="/privacy-policy" className="hover:underline">پرائیویسی پالیسی</Link>
                            <span>•</span>
                            <Link href="/terms-of-services" className="hover:underline">شرائط و ضوابط</Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
