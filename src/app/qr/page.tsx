
"use client";

import { useRouter } from 'next/navigation';
import { useRef } from 'react';
import QRCode from 'react-qr-code';
import { useAuth } from '@/hooks/useAuth';
import { ChevronLeft, MoreHorizontal } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

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
    
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      
      const downloadLink = document.createElement("a");
      downloadLink.download = `amik-chat-qr-${userData?.name || user?.uid}.png`;
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
                  <AvatarImage src={userData.avatarUrl} alt={userData.name} data-ai-hint="profile person" />
                  <AvatarFallback className="text-2xl">{userData.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-xl font-bold text-left">{userData.name}</p>
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
                  <div className="absolute top-1/2 left-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 bg-white p-1 flex items-center justify-center rounded-md border shadow-md">
                     <Image
                        src="https://storage.googleapis.com/project-123-files/user-upload-5f6962ce-4b8c-4467-9c98-132da9700305.png?v=8"
                        alt="AMIK Logo"
                        width={48}
                        height={48}
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
                <Skeleton className="h-[288px] w-[288px] rounded-lg" />
                <Skeleton className="h-4 w-48" />
            </div>
          )}
        </div>

        <footer className="w-full max-w-sm pb-4">
          <div className="flex items-center justify-center space-x-2">
            <Button variant="link" className="text-muted-foreground hover:text-primary px-2" onClick={() => router.push('/scan')}>کیو آر اسکین</Button>
            <Separator orientation="vertical" className="h-4" />
            <Button variant="link" className="text-muted-foreground hover:text-primary px-2">اسٹائل تبدیل کریں</Button>
            <Separator orientation="vertical" className="h-4" />
            <Button variant="link" className="text-muted-foreground hover:text-primary px-2" onClick={handleSaveImage}>تصویر محفوظ کریں</Button>
          </div>
        </footer>
      </main>
    </div>
  );
}
