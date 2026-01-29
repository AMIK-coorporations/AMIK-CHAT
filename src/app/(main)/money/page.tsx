"use client";

import { ChevronLeft, Landmark } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import SecurityPin from '@/components/SecurityPin';
import { useAuth } from '@/hooks/useAuth';
import LoadingOverlay from '@/components/LoadingOverlay';

export default function MoneyPage() {
  const router = useRouter();
  const { userData, updateProfile, loading } = useAuth();
  const [isUnlocked, setIsUnlocked] = useState(false);

  const handlePinSuccess = async (pin: string) => {
    if (!userData?.securityPin) {
      // Setup mode
      await updateProfile({ securityPin: pin });
      setIsUnlocked(true);
    } else {
      // Unlock mode
      setIsUnlocked(true);
    }
  };

  if (loading) return <LoadingOverlay />;

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="sticky top-0 z-10 flex items-center gap-4 border-b bg-background p-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <h1 className="flex-1 truncate text-lg font-semibold text-center">پیسے</h1>
        <div className="w-10"></div>
      </header>

      {!isUnlocked ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <SecurityPin
            mode={userData?.securityPin ? "unlock" : "setup"}
            currentPin={userData?.securityPin}
            onSuccess={handlePinSuccess}
            onForgotPin={() => router.push('/me/settings/forgot-pin')}
          />
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-muted-foreground animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-primary/10 p-6 rounded-full mb-6">
            <Landmark className="h-12 w-12 text-primary" />
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-2">پیسے / ادائیگیاں</h3>
          <p className="text-lg">یہ فیچر جلد آرہا ہے۔</p>
          <p className="max-w-[280px] mt-4 text-sm">
            آپ کا بٹوہ اب محفوظ ہے اور آپ ادائیگیاں شروع کرنے کے لیے تیار ہوں گے۔
          </p>
        </div>
      )}
    </div>
  );
}

