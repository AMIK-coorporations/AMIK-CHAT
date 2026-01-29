"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import SecurityPin from "@/components/SecurityPin";
import LoadingOverlay from "@/components/LoadingOverlay";

export default function ChangePinPage() {
    const router = useRouter();
    const { userData, updateProfile, loading } = useAuth();
    const { toast } = useToast();
    const [stage, setStage] = useState<"verify" | "setup">("verify");

    const handleVerifySuccess = () => {
        setStage("setup");
    };

    const handleSetupSuccess = async (newPin: string) => {
        try {
            await updateProfile({ securityPin: newPin });
            toast({
                title: "پن تبدیل ہو گیا",
                description: "آپ کا سیکیورٹی پن کامیابی سے تبدیل کر دیا گیا ہے۔",
            });
            router.push("/me/settings");
        } catch (error) {
            toast({
                variant: "destructive",
                title: "خرابی",
                description: "پن تبدیل کرنے میں مسئلہ پیش آیا۔ دوبارہ کوشش کریں۔",
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
                <h1 className="flex-1 truncate text-lg font-semibold text-center">پن تبدیل کریں</h1>
                <div className="w-10"></div>
            </header>

            <div className="flex-1 flex flex-col items-center justify-center">
                {stage === "verify" ? (
                    <SecurityPin
                        key="verify-pin"
                        mode="unlock"
                        currentPin={userData?.securityPin}
                        onSuccess={handleVerifySuccess}
                    />
                ) : (
                    <SecurityPin
                        key="setup-pin"
                        mode="setup"
                        onSuccess={handleSetupSuccess}
                    />
                )}
            </div>
        </div>
    );
}
