"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowRight, RotateCw, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { insforge } from "@/lib/insforge";
import { getDocFromInsforge, setDocInInsforge, updateDocInInsforge } from "@/lib/insforgeUtils";
import AppLogo from "@/components/AppLogo";
import LoadingOverlay from "@/components/LoadingOverlay";

export default function OtpClient() {
    const router = useRouter();
    const { toast } = useToast();
    const { user, loading: authLoading, signOut } = useAuth();
    
    const [otpValues, setOtpValues] = useState<string[]>(Array(6).fill(""));
    const [verifying, setVerifying] = useState(false);
    const [resending, setResending] = useState(false);
    const [resendCountdown, setResendCountdown] = useState(30);
    const [pendingEmail, setPendingEmail] = useState<string>("");

    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Guard: OTP is sent by InsForge to the email saved at signup/login.
    // There is no session until the code is verified.
    useEffect(() => {
        if (authLoading) return;

        // Already signed in (verified email or Google/GitHub) -> no OTP needed
        if (user) {
            router.replace("/chats");
            return;
        }

        const email = typeof window !== "undefined" ? sessionStorage.getItem("amik_pending_verify_email") || "" : "";
        if (!email) {
            router.replace("/login");
            return;
        }
        setPendingEmail(email);
    }, [user, authLoading, router]);

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

        if (!pendingEmail) return;
        setVerifying(true);

        try {
            // InsForge checks the real code and creates the logged-in session
            const { data, error } = await insforge.auth.verifyEmail({ email: pendingEmail, otp: enteredOtp });

            if (error || !data?.user) {
                toast({
                    variant: "destructive",
                    title: "تصدیق ناکام",
                    description: "درج کردہ او ٹی پی کوڈ غلط ہے۔ براہ کرم دوبارہ کوشش کریں۔",
                });
                return;
            }

            const verifiedUser = data.user;

            // Create / update the app profile now that a session exists
            try {
                const existing = await getDocFromInsforge<any>("users", verifiedUser.id);
                if (existing) {
                    await updateDocInInsforge("users", verifiedUser.id, { isOtpVerified: true, otpCode: null });
                } else {
                    const storedName = (typeof window !== "undefined" ? sessionStorage.getItem("amik_pending_verify_name") : "") || "";
                    const username = storedName || (verifiedUser.profile as any)?.name || pendingEmail.split("@")[0];
                    await setDocInInsforge("users", verifiedUser.id, {
                        name: username,
                        displayName: username,
                        email: pendingEmail,
                        avatarUrl: `https://placehold.co/100x100.png?text=${username.charAt(0)}`,
                        photoURL: `https://placehold.co/100x100.png?text=${username.charAt(0)}`,
                        createdAt: new Date(),
                        lastSeen: new Date(),
                        isOnline: true,
                        isOtpVerified: true,
                        otpCode: null,
                    });
                }
            } catch (profileError) {
                console.error("Profile setup after OTP failed:", profileError);
            }

            if (typeof window !== "undefined") {
                sessionStorage.removeItem("amik_pending_verify_email");
                sessionStorage.removeItem("amik_pending_verify_name");
                sessionStorage.removeItem(`otp_${verifiedUser.id}`);
            }

            toast({
                title: "تصدیق کامیاب!",
                description: "آپ کا کھاتہ کامیابی سے تصدیق ہو گیا ہے۔",
            });

            await new Promise((r) => setTimeout(r, 600));
            window.location.href = "/chats";
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
        if (resendCountdown > 0 || !pendingEmail) return;
        setResending(true);

        try {
            const { error } = await insforge.auth.resendVerificationEmail({ email: pendingEmail });
            if (error) throw error;

            setResendCountdown(30);

            toast({
                title: "نیا او ٹی پی بھیج دیا گیا!",
                description: "آپ کے ای میل پر نیا تصدیقی کوڈ بھیج دیا گیا ہے۔",
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

    // Leave the OTP screen and log in with another account
    const handleOtherAccount = () => {
        if (typeof window !== "undefined") {
            sessionStorage.removeItem("amik_pending_verify_email");
            sessionStorage.removeItem("amik_pending_verify_name");
        }
        if (user) {
            signOut();
        } else {
            window.location.href = "/login";
        }
    };

    if (authLoading || user || !pendingEmail) {
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
                            {pendingEmail ? (
                                <span>
                                    آپ کے ای میل <span className="font-semibold text-foreground">{pendingEmail}</span> پر 6 ہندسوں کا کوڈ بھیج دیا گیا ہے۔
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
                                    onClick={handleOtherAccount}
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
