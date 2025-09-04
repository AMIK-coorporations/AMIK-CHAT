
"use client";

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import QRCode from 'react-qr-code';
import { useAuth } from '@/hooks/useAuth';
import { ChevronLeft, MoreHorizontal } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import NextImage from 'next/image';

export default function QrCodePage() {
  const router = useRouter();
  const { user, userData } = useAuth();
  const qrCodeRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const qrValue = user ? `amik-chat-user://${user.uid}` : '';

  const handleSaveImage = () => {
    if (!qrCodeRef.current) {
        toast({ variant: 'destructive', title: 'خرابی', description: 'کیو آر کوڈ محفوظ نہیں ہو سکا۔' });
        return;
    };

    const svgElement = qrCodeRef.current.querySelector('svg');
    if (!svgElement) {
        toast({ variant: 'destructive', title: 'خرابی', description: 'کیو آر کوڈ عنصر نہیں مل سکا۔' });
        return;
    }
    
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
        toast({ variant: 'destructive', title: 'خرابی', description: 'تصویر نہیں بن سکی۔' });
        return;
    }
    
    const img = new window.Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      
      const downloadLink = document.createElement("a");
      const displayName = userData?.name ?? (userData as any)?.displayName ?? user?.uid ?? 'amik-user';
      downloadLink.download = `amik-chat-qr-${displayName}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();

      toast({ title: 'کامیابی', description: 'کیو آر کوڈ ڈاؤن لوڈ میں محفوظ ہو گیا۔' });
    };
    img.onerror = () => {
       toast({ variant: 'destructive', title: 'خرابی', description: 'محفوظ کرنے کے لیے کیو آر کوڈ لوڈ نہیں ہو سکا۔' });
    }
    img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgData)))}`;
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="sticky top-0 z-10 flex items-center justify-between bg-background p-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-lg font-semibold">میرا کیو آر کوڈ</h1>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-6 w-6" />
        </Button>
      </header>

      <main className="flex flex-1 flex-col items-center justify-between p-8 text-center">
        <div className="flex-grow flex flex-col items-center justify-center space-y-6">
          {userData ? (
            <>
              <div className="flex items-center gap-4 self-start">
                <Avatar className="h-16 w-16 border">
                  <AvatarImage src={userData.avatarUrl ?? (userData as any).photoURL ?? ''} alt={(userData as any).name ?? (userData as any).displayName ?? ''} data-ai-hint="profile person" />
                  <AvatarFallback className="text-2xl">{((userData as any).name ?? (userData as any).displayName ?? '?').charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-xl font-bold text-left">{(userData as any).name ?? (userData as any).displayName ?? 'Unknown'}</p>
                  <p className="text-muted-foreground text-left">پاکستان</p>
                </div>
              </div>

              <div ref={qrCodeRef} className="bg-white p-4 rounded-lg shadow-md relative">
                <QRCode
                  value={qrValue}
                  size={256}
                  fgColor="hsl(var(--primary))"
                  bgColor="#FFFFFF"
                  level="H"
                />
                <div className="absolute top-1/2 left-1/2 h-[72px] w-[72px] -translate-x-1/2 -translate-y-1/2 overflow-hidden border rounded-md border-white/90">
                    <NextImage
                       src="/logo.png"
                       alt="AMIK Logo"
                       width={72}
                       height={72}
                       className="w-full h-full object-cover"
                       data-ai-hint="logo chat bubble"
                   />
                </div>
              </div>

              <p className="text-muted-foreground">دوست کے طور پر شامل کرنے کے لیے کیو آر کوڈ اسکین کریں</p>
            </>
          ) : (
            <div className="space-y-6 flex flex-col items-center">
                <div className="flex items-center gap-4 self-start w-full">
                    <Skeleton className="h-16 w-16 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                </div>
                <Skeleton className="h-64 w-64 rounded-lg" />
                <Skeleton className="h-4 w-64" />
            </div>
          )}
        </div>

        <div className="w-full">
          <Separator className="my-4" />
          <div className="flex justify-center space-x-4">
            <Button onClick={handleSaveImage} variant="outline">
              کیو آر کوڈ محفوظ کریں
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
