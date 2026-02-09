
"use client";

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import QRCode from 'react-qr-code';
// Revert to inline QR + overlay image for reliability
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

  const qrValue = user ? `amik-chat-user://${user.id}` : '';
  const [overlaySrc, setOverlaySrc] = useState<string>("https://iili.io/fU7NHil.png");
  const overlayCandidates = [
    "https://iili.io/fU7NHil.png",
    "/AMIK%20CHAT%20LOGO%20simple%20crop%202.png",
    "/AMIK CHAT LOGO simple crop 2.png",
    "/qr-logo.png",
    "/logo.png",
  ];
  const handleOverlayError = () => {
    const idx = overlayCandidates.indexOf(overlaySrc);
    const next = overlayCandidates[idx + 1];
    if (next) setOverlaySrc(next);
  };

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
    // Enable CORS for the overlay if needed, though we use local assets for overlay now if possible, 
    // but the main image is the SVG which is data-uri so it's fine.
    // However, we want to draw the OVERLAY on top.

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw QR Code
      ctx.drawImage(img, 0, 0);

      // Draw Overlay
      const overlayImg = new window.Image();
      overlayImg.crossOrigin = "anonymous";
      overlayImg.src = overlaySrc;

      overlayImg.onload = () => {
        // Center the overlay. QR size is 256. Overlay container is 72x72 centered.
        // We need to scale relative to the rendered image size.
        // The img.width might be scaled. 
        // Assuming standard 256x256 viewbox.
        const size = img.width;
        const overlaySize = size * (72 / 256); // Proportional size
        const x = (size - overlaySize) / 2;
        const y = (size - overlaySize) / 2;

        ctx.drawImage(overlayImg, x, y, overlaySize, overlaySize);
        finalizeDownload();
      };

      overlayImg.onerror = () => {
        // If overlay fails, just download the QR
        finalizeDownload();
      };
    };

    const finalizeDownload = () => {
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      const displayName = userData?.name ?? (userData as any)?.displayName ?? user?.id ?? 'amik-user';
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
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <header className="sticky top-0 z-10 flex items-center justify-between bg-background p-3 border-b">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-lg font-semibold">میرا کیو آر کوڈ</h1>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-6 w-6" />
        </Button>
      </header>

      <main className="flex flex-1 flex-col items-center justify-between p-4 md:p-8 text-center w-full max-w-md mx-auto">
        <div className="flex-grow flex flex-col items-center justify-center space-y-6 w-full">
          {user ? (
            <>
              <div className="flex items-center gap-4 self-start w-full px-2">
                <Avatar className="h-16 w-16 border">
                  <AvatarImage src={userData?.avatarUrl ?? (userData as any)?.photoURL ?? ''} alt={userData?.name ?? (userData as any)?.displayName ?? ''} data-ai-hint="profile person" />
                  <AvatarFallback className="text-2xl">{((userData?.name ?? (userData as any)?.displayName ?? user.email ?? '?').charAt(0)).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-xl font-bold text-left truncate">
                    {userData?.name ?? (userData as any)?.displayName ?? user.email?.split('@')[0] ?? 'Unknown User'}
                  </p>
                  <p className="text-muted-foreground text-left">پاکستان</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-md relative mx-auto" ref={qrCodeRef}>
                <div className="absolute inset-0 rounded-lg" aria-hidden="true" />
                <div className="relative">
                  <QRCode
                    value={qrValue}
                    size={256}
                    fgColor="hsl(var(--primary))"
                    bgColor="#FFFFFF"
                    level="H"
                    style={{ maxWidth: '100%', height: 'auto' }}
                  />
                  <div className="absolute top-1/2 left-1/2 h-[72px] w-[72px] -translate-x-1/2 -translate-y-1/2 overflow-hidden border rounded-md border-white/90 z-10 bg-white">
                    <img
                      src={overlaySrc}
                      alt="AMIK Logo"
                      width={72}
                      height={72}
                      className="w-full h-full object-cover"
                      onError={handleOverlayError}
                      decoding="async"
                    />
                  </div>
                </div>
              </div>

              <p className="text-muted-foreground text-sm">دوست کے طور پر شامل کرنے کے لیے کیو آر کوڈ اسکین کریں</p>
            </>
          ) : (
            <div className="space-y-6 flex flex-col items-center w-full">
              <div className="flex items-center gap-4 self-start w-full px-2">
                <Skeleton className="h-16 w-16 rounded-full flex-shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
              <Skeleton className="h-64 w-64 rounded-lg" />
              <Skeleton className="h-4 w-64" />
            </div>
          )}
        </div>

        <div className="w-full mt-6">
          <Separator className="mb-4" />
          <div className="flex gap-3">
            <Button onClick={handleSaveImage} variant="outline" className="flex-1">
              محفوظ کریں
            </Button>
            <Button onClick={() => router.push('/scan')} variant="outline" className="flex-1">
              اسکین کریں
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
