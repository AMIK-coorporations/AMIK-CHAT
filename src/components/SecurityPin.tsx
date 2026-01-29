"use client";

import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Unlock } from "lucide-react";

interface SecurityPinProps {
    currentPin?: string;
    onSuccess: (pin: string) => void;
    onForgotPin?: () => void;
    mode?: "unlock" | "setup";
}

export default function SecurityPin({ currentPin, onSuccess, onForgotPin, mode = "unlock" }: SecurityPinProps) {
    const [value, setValue] = useState("");
    const [step, setStep] = useState<"enter" | "confirm">(mode === "setup" ? "enter" : "enter");
    const [firstPin, setFirstPin] = useState<string>("");
    const [isError, setIsError] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    useEffect(() => {
        inputRef.current?.focus();
    }, [step]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVal = e.target.value.replace(/\D/g, "").slice(0, 6);
        setValue(newVal);

        if (newVal.length === 6) {
            setTimeout(() => finalize(newVal), 300);
        }
    };

    const finalize = (enteredPin: string) => {
        if (mode === "setup") {
            if (step === "enter") {
                setFirstPin(enteredPin);
                setStep("confirm");
                setValue("");
            } else {
                if (enteredPin === firstPin) {
                    onSuccess(enteredPin);
                } else {
                    showError("پن کوڈز آپس میں نہیں ملتے۔", true);
                }
            }
        } else {
            if (enteredPin === currentPin) {
                onSuccess(enteredPin);
            } else {
                showError("پن کوڈ درست نہیں ہے۔", false);
            }
        }
    };

    const showError = (msg: string, resetToStart: boolean) => {
        setIsError(true);
        toast({ variant: "destructive", title: "غلطی", description: msg });
        setTimeout(() => {
            setIsError(false);
            setValue("");
            if (resetToStart) setStep("enter");
        }, 600);
    };

    return (
        <div
            className="flex flex-col items-center justify-center w-full max-w-sm mx-auto h-full space-y-12 cursor-pointer pb-20"
            onClick={() => inputRef.current?.focus()}
        >
            <input
                ref={inputRef}
                type="tel"
                pattern="[0-9]*"
                inputMode="numeric"
                value={value}
                onChange={handleInputChange}
                className="opacity-0 absolute inset-0 -z-10 pointer-events-none"
                autoFocus
            />

            <div className="text-center space-y-4 px-6 mt-[-10vh]">
                <div className="flex justify-center mb-6">
                    <div className="bg-primary/10 p-4 rounded-full">
                        {mode === "unlock" ? <Lock className="w-8 h-8 text-primary" /> : <Unlock className="w-8 h-8 text-primary" />}
                    </div>
                </div>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-1"
                    >
                        <h2 className="text-2xl font-bold">
                            {mode === "setup"
                                ? (step === "enter" ? "پن سیٹ کریں" : "پن کی تصدیق")
                                : "پن درج کریں"}
                        </h2>
                        <p className="text-muted-foreground text-sm">
                            {mode === "setup"
                                ? (step === "enter" ? "چھ ہندسوں کا کوڈ درج کریں" : "وہی کوڈ دوبارہ درج کریں")
                                : "رسائی کے لیے اپنا کوڈ درج کریں"}
                        </p>
                    </motion.div>
                </AnimatePresence>
            </div>

            <motion.div
                animate={isError ? { x: [-10, 10, -8, 8, -4, 4, 0] } : {}}
                transition={{ duration: 0.5 }}
                className="flex gap-4 justify-center py-6"
            >
                {Array.from({ length: 6 }).map((_, i) => (
                    <motion.div
                        key={i}
                        initial={false}
                        animate={{
                            scale: value[i] ? 1.25 : 1,
                            backgroundColor: value[i] ? "hsl(var(--primary))" : "rgba(156, 163, 175, 0.2)",
                            borderColor: value[i] ? "hsl(var(--primary))" : "transparent"
                        }}
                        className="w-4 h-4 rounded-full transition-all duration-150"
                    />
                ))}
            </motion.div>

            {mode === "unlock" && onForgotPin && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onForgotPin();
                    }}
                    className="text-sm font-medium text-primary hover:underline transition-all mt-4"
                >
                    پن کوڈ بھول گئے؟
                </button>
            )}

            <div className="h-20" />
        </div>
    );
}
