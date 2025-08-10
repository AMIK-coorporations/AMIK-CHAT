
"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChevronLeft, VideoOff, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function ScanPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerRef = useRef<HTMLDivElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleScannedCode = useCallback(async (code: string) => {
    if (isProcessing || !currentUser) return;
    setIsProcessing(true);

    if (scannerRef.current?.isScanning) {
        try {
            await scannerRef.current.stop();
        } catch (err) {
            console.error("Error stopping scanner:", err);
        }
    }

    if (!code.startsWith('amik-chat-user://')) {
        toast({
            variant: 'destructive',
            title: 'غلط کیو آر کوڈ',
            description: 'یہ ایک درست اے ایم آئی کے چیٹ کیو آر کوڈ نہیں ہے۔',
        });
        router.back();
        return;
    }

    const contactId = code.replace('amik-chat-user://', '');

    if (contactId === currentUser.uid) {
        toast({
            title: "یہ آپ ہیں!",
            description: "آپ خود کو بطور رابطہ شامل نہیں کر سکتے۔",
        });
        router.back();
        return;
    }

    try {
        const userDocRef = doc(db, 'users', contactId);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
            toast({ variant: 'destructive', title: 'صارف نہیں ملا', description: 'یہ کیو آر کوڈ کسی درست صارف سے منسلک نہیں ہے۔' });
            router.back();
            return;
        }

        const contactData = userDoc.data();

        const existingContactRef = doc(db, 'users', currentUser.uid, 'contacts', contactId);
        const existingContactSnap = await getDoc(existingContactRef);
        if (existingContactSnap.exists()) {
            toast({
                title: 'پہلے سے رابطہ ہے',
                description: `${contactData.name} پہلے ہی آپ کے رابطوں میں ہے۔`,
            });
            router.push('/contacts');
            return;
        }

        const newContactRef = doc(db, 'users', currentUser.uid, 'contacts', contactId);
        await setDoc(newContactRef, { addedAt: serverTimestamp() });

        toast({
            title: 'رابطہ شامل ہو گیا!',
            description: `${contactData.name} کو آپ کے رابطوں میں شامل کر دیا گیا ہے۔`,
        });
        router.push('/contacts');

    } catch (error: any) {
        console.error("Error adding contact from QR code:", error);
        toast({
            variant: 'destructive',
            title: 'رابطہ شامل کرنے میں خرابی',
            description: error.message || 'کچھ غلط ہو گیا۔ براہ کرم دوبارہ کوشش کریں۔',
        });
        router.back();
    }
  }, [currentUser, isProcessing, router, toast]);

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

        await qrScanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            rememberLastUsedCamera: true,
          },
          (decodedText, _decodedResult) => {
            handleScannedCode(decodedText);
          },
          (errorMessage) => {
            // parse error, ignore it.
          }
        )
        setIsScanning(true);

      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
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


  return (
    <div className="flex h-screen flex-col bg-black">
      <header className="sticky top-0 z-10 flex items-center gap-4 border-b border-zinc-800 bg-black p-3 text-white">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="hover:bg-zinc-800">
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <h1 className="flex-1 truncate text-lg font-semibold text-center">کیو آر اسکین</h1>
        <div className="w-10"></div>
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
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white">
            <Loader2 className="h-16 w-16 animate-spin mb-4" />
            <p>پروسیسنگ...</p>
          </div>
        )}
        
        {!isProcessing && <p className="mt-4 text-center text-white">
          {hasCameraPermission === null ? 'اسکینر شروع ہو رہا ہے...' : isScanning ? 'اسکین کرنے کے لیے فریم کے اندر ایک کیو آر کوڈ رکھیں۔' : 'کیمرے کا انتظار ہے...'}
        </p>}
      </main>
    </div>
  );
}
