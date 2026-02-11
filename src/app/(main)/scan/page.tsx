"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChevronLeft, VideoOff, Loader2, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getDocFromInsforge, getContactDoc, setDocInInsforge } from '@/lib/insforgeUtils';
import { useAuth } from '@/hooks/useAuth';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import LoadingOverlay from '@/components/LoadingOverlay';
import { createOrNavigateToChat } from '@/lib/chatUtils';
import type { User } from '@/lib/types';

export default function ScanPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user: currentUser, userData } = useAuth();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleScannedCode = useCallback(async (code: string) => {
    if (isProcessing || !currentUser) {
      if (!currentUser) {
        toast({
          variant: 'destructive',
          title: 'لاگ ان نہیں',
          description: 'کیو آر کوڈ اسکین کرنے کے لیے لاگ ان ہونا ضروری ہے۔'
        });
      }
      return;
    }

    if (!userData) {
      toast({
        variant: 'destructive',
        title: 'پروفائل لوڈ ہو رہی ہے',
        description: 'براہ کرم ایک لمحہ انتظار کریں اور دوبارہ اسکین کریں۔',
        duration: 3000,
      });
      return;
    }

    setIsProcessing(true);

    // Show processing message
    toast({
      title: 'پروسیسنگ...',
      description: 'کیو آر کوڈ کو پروسیس کیا جا رہا ہے۔',
    });

    try {
      if (scannerRef.current?.isScanning) {
        try {
          await scannerRef.current.stop();
        } catch (err) {
          console.error("Error stopping scanner:", err);
        }
      }

      const cleanCode = code.trim();
      if (!cleanCode.startsWith('amik-chat-user://')) {
        toast({
          variant: 'destructive',
          title: 'غلط کیو آر کوڈ',
          description: 'یہ ایک درست اے ایم آئی کے چیٹ کیو آر کوڈ نہیں ہے۔',
        });
        setIsProcessing(false);
        router.back();
        return;
      }

      const contactId = cleanCode.replace('amik-chat-user://', '');

      if (contactId === currentUser.id) {
        toast({
          title: "یہ آپ ہیں!",
          description: "آپ خود کو بطور رابطہ شامل نہیں کر سکتے۔",
        });
        setIsProcessing(false);
        router.back();
        return;
      }

      // Lookup user in InsForge
      const contactData = await getDocFromInsforge<User>('users', contactId);

      if (!contactData) {
        console.error("User not found in InsForge for ID:", contactId);
        toast({
          variant: 'destructive',
          title: 'صارف نہیں ملا',
          description: 'یہ کیو آر کوڈ کسی رجسٹرڈ صارف سے منسلک نہیں ہے۔ صارف کو ایپ میں لاگ ان ہونا ضروری ہے۔'
        });
        setIsProcessing(false);
        router.back();
        return;
      }

      // Check for existing contact in InsForge
      const existingContactData = await getContactDoc(currentUser.id, contactId);

      if (existingContactData) {
        const chatId = await createOrNavigateToChat(currentUser.id, userData, contactData);
        toast({
          title: 'پہلے سے رابطہ ہے',
          description: `${contactData.name ?? (contactData as any).displayName ?? 'یہ صارف'} پہلے ہی آپ کے رابطوں میں ہے، چیٹ کھول رہے ہیں۔`,
        });
        setIsProcessing(false);
        router.push(`/chats/${chatId}`);
        return;
      }

      // Add to InsForge user_contacts
      try {
        await setDocInInsforge('user_contacts', `${currentUser.id}_${contactId}`, {
          userId: currentUser.id,
          contactId: contactId,
          contactName: contactData.name ?? (contactData as any).displayName ?? 'User',
          contactAvatarUrl: contactData.avatarUrl ?? (contactData as any).photoURL ?? '',
          addedAt: new Date()
        });
      } catch (err: any) {
        console.error("InsForge QR scan sync failed:", err);
      }

      const chatId = await createOrNavigateToChat(currentUser.id, userData, contactData);

      toast({
        title: 'چیٹ کے لیے تیار!',
        description: `${contactData.name ?? (contactData as any).displayName ?? 'صارف'} کے ساتھ چیٹ کھول رہے ہیں۔`,
      });
      setIsProcessing(false);
      router.push(`/chats/${chatId}`);

    } catch (error: any) {
      console.error("Error adding contact from QR code:", error);
      setIsProcessing(false);
      toast({
        variant: 'destructive',
        title: 'رابطہ شامل کرنے میں خرابی',
        description: error.message || 'کچھ غلط ہو گیا۔ براہ کرم دوبارہ کوشش کریں۔',
      });
      router.back();
    }
  }, [currentUser, isProcessing, router, toast, userData]);

  useEffect(() => {
    if (!readerRef.current || scannerRef.current) return;

    const qrScanner = new Html5Qrcode(readerRef.current.id);
    scannerRef.current = qrScanner;

    const startScanning = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        setHasCameraPermission(true);

        if (qrScanner.getState() === Html5QrcodeScannerState.SCANNING) {
          return;
        }

        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        };

        try {
          await qrScanner.start(
            { facingMode: 'environment' },
            config,
            (decodedText, _decodedResult) => {
              handleScannedCode(decodedText);
            },
            (_errorMessage) => {
              // parse error, ignore it.
            }
          );
        } catch (envError) {
          console.warn('Environment camera failed, trying user camera...', envError);
          await qrScanner.start(
            { facingMode: 'user' },
            config,
            (decodedText, _decodedResult) => {
              handleScannedCode(decodedText);
            },
            (_errorMessage) => {
              // parse error, ignore it.
            }
          );
        }

        setIsScanning(true);

      } catch (error: any) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'کیمرے تک رسائی نہیں',
          description: error.message?.includes('Permission denied') || error.name === 'NotAllowedError'
            ? 'براہ کرم براؤزر کی ترتیبات میں کیمرے کی اجازت دیں۔'
            : 'کیمرے تک رسائی حاصل نہیں ہو سکی۔ براہ کرم دوبارہ کوشش کریں۔',
          duration: 5000,
        });
      }
    };

    startScanning();

    return () => {
      const qrScanner = scannerRef.current;
      if (qrScanner && qrScanner.isScanning) {
        qrScanner.stop().catch(err => console.error("Error stopping scanner:", err));
      }
    };
  }, [readerRef, handleScannedCode]);

  // New: pick QR from gallery and decode
  const handlePickFromGallery = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessing(true);
      let decoded: string | null = null;

      // Strategy 1: html5-qrcode built-in decoder
      try {
        decoded = (await scannerRef.current?.scanFile(file, true)) ?? null;
      } catch (_) { }

      // Strategy 2: Native BarcodeDetector (if available)
      if (!decoded && 'BarcodeDetector' in window) {
        try {
          // @ts-ignore
          const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
          const bitmap = await createImageBitmap(file);
          const canvas = document.createElement('canvas');
          canvas.width = bitmap.width;
          canvas.height = bitmap.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(bitmap, 0, 0);
            const detected = await detector.detect(canvas);
            if (detected && detected.length > 0) {
              decoded = detected[0].rawValue || null;
            }
          }
        } catch (_) { }
      }

      // Strategy 3: jsQR multi-pass (scales + rotations + binarization)
      if (!decoded) {
        try {
          const jsQR = (await import('jsqr')).default as any;
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.src = URL.createObjectURL(file);
          await new Promise((res, rej) => { img.onload = () => res(null); img.onerror = rej; });

          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('no-canvas');

          const scales = [1, 0.75, 0.5, 1.5, 2];
          const rotations = [0, 90, 180, 270];

          const tryDecode = (): string | null => {
            for (const scale of scales) {
              const w = Math.max(64, Math.floor(img.width * scale));
              const h = Math.max(64, Math.floor(img.height * scale));
              canvas.width = w; canvas.height = h;
              // Rotate attempts
              for (const rot of rotations) {
                ctx.resetTransform?.();
                ctx.clearRect(0, 0, w, h);
                if (rot === 0) {
                  ctx.drawImage(img, 0, 0, w, h);
                } else {
                  ctx.translate(w / 2, h / 2);
                  ctx.rotate((rot * Math.PI) / 180);
                  ctx.drawImage(img, -w / 2, -h / 2, w, h);
                  ctx.setTransform(1, 0, 0, 1, 0, 0);
                }
                let imageData = ctx.getImageData(0, 0, w, h);
                let result = jsQR(imageData.data, w, h);
                if (result?.data) return result.data as string;
                // Try simple thresholding
                for (let t = 50; t <= 200; t += 50) {
                  const data = imageData.data;
                  for (let i = 0; i < data.length; i += 4) {
                    const v = (data[i] + data[i + 1] + data[i + 2]) / 3;
                    const bin = v < t ? 0 : 255;
                    data[i] = data[i + 1] = data[i + 2] = bin;
                  }
                  ctx.putImageData(imageData, 0, 0);
                  imageData = ctx.getImageData(0, 0, w, h);
                  result = jsQR(imageData.data, w, h);
                  if (result?.data) return result.data as string;
                }
              }
            }
            return null;
          };

          decoded = tryDecode();
        } catch (_) { }
      }

      if (decoded) {
        await handleScannedCode(decoded);
      } else {
        throw new Error('کوئی کیو آر کوڈ نہیں ملا');
      }
    } catch (err: any) {
      console.error('Gallery QR scan error:', err);
      toast({ variant: 'destructive', title: 'اسکین ناکام', description: 'تصویر میں درست کیو آر کوڈ نہیں ملا۔' });
      setIsProcessing(false);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex h-screen flex-col bg-black">
      <header className="sticky top-0 z-10 flex items-center gap-4 border-b border-zinc-800 bg-black p-3 text-white">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="hover:bg-zinc-800">
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <h1 className="flex-1 truncate text-lg font-semibold text-center">کیو آر اسکین</h1>
        <div className="w-10 flex justify-end">
          {/* New: pick from gallery */}
          <Button variant="ghost" size="icon" onClick={handlePickFromGallery} className="hover:bg-zinc-800" aria-label="گیلری سے منتخب کریں">
            <ImageIcon className="h-6 w-6" />
          </Button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </div>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center p-4 relative">
        <div id="qr-reader" ref={readerRef} className="w-full max-w-sm aspect-square"></div>

        {hasCameraPermission === false && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white p-4 text-center">
            <VideoOff className="h-16 w-16 mb-4" />
            <Alert variant="destructive" className="bg-transparent border-red-500 text-white">
              <AlertTitle>کیمرے تک رسائی مسترد</AlertTitle>
              <AlertDescription>
                کیو آر کوڈ اسکین کرنے کے لیے براہ کرم اپنے براؤزر کی ترتیبات میں کیمرے کی اجازت کو فعال کریں۔
              </AlertDescription>
            </Alert>
          </div>
        )}

        {isProcessing && (
          <LoadingOverlay message="پروسیسنگ..." />
        )}

        {!isProcessing && <p className="mt-4 text-center text-white">
          {hasCameraPermission === null ? 'اسکینر شروع ہو رہا ہے...' : isScanning ? 'اسکین کرنے کے لیے فریم کے اندر ایک کیو آر کوڈ رکھیں۔' : 'کیمرے کا انتظار ہے...'}
        </p>}
      </main>
    </div>
  );
}
