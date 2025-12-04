"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const miniprogramApps = [
  {
    id: 'qr-code',
    title: 'AMIK QR CODE',
    urduName: '???? ??? ?? ???',
    logo: 'https://amik-qr-code.vercel.app/favicon.ico',
    url: 'https://amik-qr-code.vercel.app',
    color: 'bg-blue-500',
  },
  {
    id: 'ai-agent',
    title: 'AMIK AI AGENT',
    urduName: '???? ?? ??? ?????',
    logo: 'https://amik-ai-agent.vercel.app/favicon.ico',
    url: 'https://amik-ai-agent.vercel.app',
    color: 'bg-purple-500',
  },
  {
    id: 'chat',
    title: 'AMIK CHAT',
    urduName: '???? ???',
    logo: '/favicon.ico',
    url: '/chats',
    color: 'bg-green-500',
  },
  {
    id: 'contacts',
    title: 'CONTACTS',
    urduName: '?????',
    logo: '/favicon.ico',
    url: '/contacts',
    color: 'bg-orange-500',
  },
  {
    id: 'discover',
    title: 'DISCOVER',
    urduName: '??????',
    logo: '/favicon.ico',
    url: '/discover',
    color: 'bg-pink-500',
  },
  {
    id: 'scan',
    title: 'SCAN',
    urduName: '?????',
    logo: '/favicon.ico',
    url: '/scan',
    color: 'bg-cyan-500',
  },
  {
    id: 'map',
    title: 'MAP',
    urduName: '????',
    logo: '/favicon.ico',
    url: '/map',
    color: 'bg-red-500',
  },
  {
    id: 'money',
    title: 'MONEY',
    urduName: '????',
    logo: '/favicon.ico',
    url: '/money',
    color: 'bg-yellow-500',
  },
];

interface TopSliderMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TopSliderMenu({ isOpen, onClose }: TopSliderMenuProps) {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 50);
    } else {
      setIsAnimating(true);
      setTimeout(() => {
        setIsVisible(false);
        setIsAnimating(false);
      }, 300);
    }
  }, [isOpen]);

  const handleAppClick = (app: typeof miniprogramApps[0]) => {
    if (app.url.startsWith('http')) {
      window.open(app.url, '_blank', 'noopener,noreferrer');
    } else {
      router.push(app.url);
    }
    onClose();
  };

  if (!isVisible) return null;

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300",
          isAnimating ? (isOpen ? "opacity-0" : "opacity-100") : (isOpen ? "opacity-100" : "opacity-0")
        )}
        onClick={onClose}
      />
      
      <div
        ref={menuRef}
        className={cn(
          "fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b shadow-lg transition-transform duration-300 ease-out",
          isAnimating ? (isOpen ? "-translate-y-full" : "translate-y-0") : (isOpen ? "translate-y-0" : "-translate-y-full")
        )}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold" dir="rtl">??? ????????</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-4 gap-3">
            {miniprogramApps.map((app) => (
              <Card
                key={app.id}
                className={cn(
                  "cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-md group",
                  "border-0 bg-gradient-to-br from-background to-muted/20"
                )}
                onClick={() => handleAppClick(app)}
              >
                <CardContent className="p-3 flex flex-col items-center gap-2 text-center">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-200",
                    app.color
                  )}>
                    <Image
                      src={app.logo}
                      alt={app.title}
                      width={24}
                      height={24}
                      className="rounded-sm"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.parentElement!.innerHTML = `<div class="text-white font-bold text-lg">${app.title.charAt(0)}</div>`;
                      }}
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-foreground leading-tight">
                      {app.title}
                    </p>
                    <p className="text-xs text-muted-foreground leading-tight" dir="rtl">
                      {app.urduName}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
