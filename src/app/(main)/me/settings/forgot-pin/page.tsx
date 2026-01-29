"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SecurityPin from "@/components/SecurityPin";
import LoadingOverlay from "@/components/LoadingOverlay";
import { motion, AnimatePresence } from "framer-motion";

export default function ForgotPinPage() {
    const router = useRouter();
    const { user, updateProfile, loading } = useAuth();
    const { toast } = useToast();

    const [step, setStep] = useState<"email" | "otp" | "reset">("email");
    const [emailInput, setEmailInput] = useState("");
    const [otpInput, setOtpInput] = useState("");
    const [generatedOtp, setGeneratedOtp] = useState("");

    const handleSendOtp = () => {
        if (emailInput.toLowerCase() !== user?.email?.toLowerCase()) {
            toast({
                variant: "destructive",
                title: "غلط ای میل",
                description: "براہ کرم اپنا رجسٹرڈ ای میل ایڈریس درج کریں۔",
            });
            return;
        }

        // Simulate OTP generation
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        setGeneratedOtp(otp);
        console.log("SIMULATED OTP:", otp);

        toast({
            title: "OTP بھیج دیا گیا",
            description: `آپ کے ای میل پر چھ ہندسوں کا کوڈ بھیج دیا گیا ہے۔ (شمارہ: ${otp})`,
        });
        setStep("otp");
    };

    const handleVerifyOtp = () => {
        if (otpInput === generatedOtp) {
            setStep("reset");
        } else {
            toast({
                variant: "destructive",
                title: "غلط OTP",
                description: "درج کردہ کوڈ درست نہیں ہے۔",
            });
        }
    };

    const handleResetSuccess = async (newPin: string) => {
        try {
            await updateProfile({ securityPin: newPin });
            toast({
                title: "پن تبدیل ہو گیا",
                description: "آپ کا نیا پن کامیابی سے سیٹ کر دیا گیا ہے۔",
            });
            router.push("/money");
        } catch (error) {
            toast({
                variant: "destructive",
                title: "خرابی",
                description: "پن سیٹ کرنے میں مسئلہ پیش آیا۔",
            });
        }
    };

    if (loading) return <LoadingOverlay />;

    return (
        <div className="flex h-screen flex-col bg-background">
            <header className="sticky top-0 z-10 flex items-center gap-4 border-b bg-background p-3">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ChevronLeft className="h-6 w-6" />
                </Button>
                <h1 className="flex-1 truncate text-lg font-semibold text-center">پن بحال کریں</h1>
                <div className="w-10"></div>
            </header>

            <div className="flex-1 flex flex-col items-center justify-center p-6">
                <AnimatePresence mode="wait">
                    {step === "email" && (
                        <motion.div
                            key="email"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.05 }}
                            className="w-full max-w-sm space-y-8 text-center"
                        >
                            <div className="mx-auto bg-primary/10 p-5 rounded-full w-fit">
                                <Mail className="w-10 h-10 text-primary" />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-2xl font-bold">ای میل کی تصدیق</h2>
                                <p className="text-muted-foreground">پن کوڈ بحال کرنے کے لیے اپنا رجسٹرڈ ای میل درج کریں</p>
                            </div>
                            <Input
                                type="email"
                                placeholder="آپ کا ای میل"
                                value={emailInput}
                                onChange={(e) => setEmailInput(e.target.value)}
                                className="text-center h-12 text-lg"
                            />
                            <Button onClick={handleSendOtp} className="w-full h-12 text-lg font-semibold">
                                OTP حاصل کریں
                            </Button>
                        </motion.div>
                    )}

                    {step === "otp" && (
                        <motion.div
                            key="otp"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="w-full max-w-sm space-y-8 text-center"
                        >
                            <div className="mx-auto bg-primary/10 p-5 rounded-full w-fit">
                                <ShieldCheck className="w-10 h-10 text-primary" />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-2xl font-bold">OTP درج کریں</h2>
                                <p className="text-muted-foreground">ای میل پر موصول ہونے والا چھ ہندسوں کا کوڈ درج کریں</p>
                            </div>
                            <Input
                                type="tel"
                                placeholder="چھ ہندسوں کا کوڈ"
                                value={otpInput}
                                onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                className="text-center h-14 text-2xl font-bold tracking-[0.5em]"
                            />
                            <Button onClick={handleVerifyOtp} className="w-full h-12 text-lg font-semibold">
                                تصدیق کریں
                            </Button>
                        </motion.div>
                    )}

                    {step === "reset" && (
                        <motion.div
                            key="reset"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="w-full"
                        >
                            <SecurityPin mode="setup" onSuccess={handleResetSuccess} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
