"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Download, Share2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ScreenshotToolProps {
  onClose: () => void;
  onScreenshotTaken?: (imageData: string) => void;
}

export default function ScreenshotTool({ onClose, onScreenshotTaken }: ScreenshotToolProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCapture = async () => {
    try {
      setIsCapturing(true);
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { mediaSource: 'screen' }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (error) {
      console.error("Error starting screen capture:", error);
      toast({ variant: 'destructive', title: 'خرابی', description: 'اسکرین کیپچر شروع نہیں کیا جا سکا' });
      setIsCapturing(false);
    }
  };

  const takeScreenshot = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to data URL
    const imageData = canvas.toDataURL('image/png');
    setScreenshot(imageData);

    // Stop the stream
    if (video.srcObject) {
      const stream = video.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }

    setIsCapturing(false);
    onScreenshotTaken?.(imageData);
  };

  const downloadScreenshot = () => {
    if (!screenshot) return;

    const link = document.createElement('a');
    link.href = screenshot;
    link.download = `screenshot-${Date.now()}.png`;
    link.click();
    
    toast({ title: 'اسکرین شاٹ ڈاؤن لوڈ ہو گیا' });
  };

  const shareScreenshot = async () => {
    if (!screenshot) return;

    try {
      // Convert data URL to blob
      const response = await fetch(screenshot);
      const blob = await response.blob();
      
      if (navigator.share) {
        await navigator.share({
          title: 'Screenshot',
          files: [new File([blob], 'screenshot.png', { type: 'image/png' })]
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.write([
          new ClipboardItem({
            'image/png': blob
          })
        ]);
        toast({ title: 'اسکرین شاٹ کلپ بورڈ پر کاپی ہو گیا' });
      }
    } catch (error) {
      console.error("Error sharing screenshot:", error);
      toast({ variant: 'destructive', title: 'خرابی', description: 'اسکرین شاٹ شیئر نہیں کیا جا سکا' });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">اسکرین شاٹ ٹول</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4">
          {!screenshot && !isCapturing && (
            <div className="text-center py-12">
              <Camera className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">اسکرین شاٹ لیں</h3>
              <p className="text-muted-foreground mb-6">
                اپنی اسکرین کا کیپچر لیں اور شیئر کریں
              </p>
              <Button onClick={startCapture} size="lg">
                <Camera className="h-5 w-5 mr-2" />
                اسکرین کیپچر شروع کریں
              </Button>
            </div>
          )}

          {isCapturing && (
            <div className="space-y-4">
              <div className="relative">
                <video
                  ref={videoRef}
                  className="w-full h-auto rounded-lg border"
                  autoPlay
                  muted
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-black/50 text-white px-4 py-2 rounded-lg">
                    اسکرین شاٹ کے لیے دبائیں
                  </div>
                </div>
              </div>
              <div className="flex justify-center gap-4">
                <Button onClick={takeScreenshot} variant="default">
                  <Camera className="h-5 w-5 mr-2" />
                  اسکرین شاٹ لیں
                </Button>
                <Button onClick={onClose} variant="outline">
                  منسوخ کریں
                </Button>
              </div>
            </div>
          )}

          {screenshot && (
            <div className="space-y-4">
              <div className="relative">
                <img
                  src={screenshot}
                  alt="Screenshot"
                  className="w-full h-auto rounded-lg border"
                />
              </div>
              <div className="flex justify-center gap-4">
                <Button onClick={downloadScreenshot} variant="default">
                  <Download className="h-5 w-5 mr-2" />
                  ڈاؤن لوڈ کریں
                </Button>
                <Button onClick={shareScreenshot} variant="outline">
                  <Share2 className="h-5 w-5 mr-2" />
                  شیئر کریں
                </Button>
                <Button onClick={() => setScreenshot(null)} variant="ghost">
                  نیا اسکرین شاٹ
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Hidden canvas for screenshot processing */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
} 