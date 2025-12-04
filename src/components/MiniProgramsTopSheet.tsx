"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const apps = [
  {
    title: "AMIK QR CODE",
    urduTitle: "اے ایم آئی کے کیو آر کوڈ",
    url: "https://amik-qr-code.vercel.app",
    logo: "https://amik-qr-code.vercel.app/favicon.ico",
  },
  {
    title: "AMIK AI AGENT",
    urduTitle: "اے ایم آئی کے اے آئی ایجنٹ",
    url: "https://amik-ai-agent.vercel.app",
    logo: "https://amik-ai-agent.vercel.app/favicon.ico",
  },
];

interface MiniProgramsTopSheetProps {
  className?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MiniProgramsTopSheet({
  className,
  open,
  onOpenChange,
}: MiniProgramsTopSheetProps) {
  const startYRef = useRef<number | null>(null);
  const closeStartYRef = useRef<number | null>(null);
  const [closeDragY, setCloseDragY] = useState(0);
  const [isCloseDragging, setIsCloseDragging] = useState(false);

  // Open from top drag
  const handleStart = (clientY: number) => {
    startYRef.current = clientY;
  };

  const handleMove = (clientY: number) => {
    if (startYRef.current == null) return;
    const delta = clientY - startYRef.current;
    if (delta > 60) {
      onOpenChange(true);
      startYRef.current = null;
    }
  };

  const handleEnd = () => {
    startYRef.current = null;
  };

  // Close from bottom drag (swipe up on the line)
  const handleCloseStart = (clientY: number) => {
    setIsCloseDragging(true);
    setCloseDragY(0);
    closeStartYRef.current = clientY;
  };

  const handleCloseMove = (clientY: number) => {
    if (closeStartYRef.current == null) return;
    const delta = clientY - closeStartYRef.current;
    // delta is negative when swiping up
    if (delta < 0) {
      setCloseDragY(delta);
    }
    if (delta < -80) {
      onOpenChange(false);
      closeStartYRef.current = null;
      setIsCloseDragging(false);
      setCloseDragY(0);
    }
  };

  const handleCloseEnd = () => {
    closeStartYRef.current = null;
    setIsCloseDragging(false);
    // snap back if not closed
    setCloseDragY(0);
  };

  return (
    <>
      <div
        className={cn(
          // Invisible drag area at the very top of the screen
          "pointer-events-auto absolute inset-x-0 top-0 z-30 h-4",
          className
        )}
        onMouseDown={(e) => handleStart(e.clientY)}
        onMouseMove={(e) => {
          if (startYRef.current != null) handleMove(e.clientY);
        }}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={(e) => handleStart(e.touches[0]?.clientY ?? 0)}
        onTouchMove={(e) => handleMove(e.touches[0]?.clientY ?? 0)}
        onTouchEnd={handleEnd}
      />

      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="top"
          className="inset-x-0 top-0 h-screen max-h-screen overflow-y-auto border-b bg-background p-4 pt-6 shadow-none data-[state=open]:animate-in data-[state=open]:slide-in-from-top data-[state=closed]:animate-out data-[state=closed]:slide-out-to-top [&>button]:hidden"
          style={{
            transform: `translateY(${closeDragY}px)`,
            transition: isCloseDragging ? "none" : "transform 0.2s ease-out",
          }}
        >
          <SheetHeader className="mb-3">
            <SheetTitle className="text-base font-semibold" dir="rtl">
              منی پروگرامز
            </SheetTitle>
          </SheetHeader>

          <div className="grid grid-cols-3 gap-3" dir="rtl">
            {apps.map((app) => (
              <Link
                key={app.title}
                href={app.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col items-center gap-1 rounded-xl bg-background/80 p-2 text-center shadow-sm transition hover:-translate-y-1 hover:bg-primary/5 hover:shadow-md"
              >
                <div className="relative mb-1 flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-muted shadow">
                  <Image
                    src={app.logo}
                    alt={app.title}
                    width={48}
                    height={48}
                    className="h-10 w-10 rounded-xl object-contain transition-transform duration-300 group-hover:scale-110"
                  />
                </div>
                <div className="space-y-0.5">
                  <div className="text-[11px] font-semibold leading-tight">
                    {app.urduTitle}
                  </div>
                  <div className="text-[10px] text-muted-foreground leading-tight ltr:font-medium">
                    {app.title}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* iOS-style bottom back handle at the very bottom */}
          <div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center">
            <button
              type="button"
              className="pointer-events-auto flex items-center justify-center"
              aria-label="Close mini programs"
              onMouseDown={(e) => handleCloseStart(e.clientY)}
              onMouseMove={(e) => {
                if (closeStartYRef.current != null) handleCloseMove(e.clientY);
              }}
              onMouseUp={handleCloseEnd}
              onMouseLeave={handleCloseEnd}
              onTouchStart={(e) =>
                handleCloseStart(e.touches[0]?.clientY ?? 0)
              }
              onTouchMove={(e) =>
                handleCloseMove(e.touches[0]?.clientY ?? 0)
              }
              onTouchEnd={handleCloseEnd}
            >
              <span className="h-1.5 w-20 rounded-full bg-muted" />
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

