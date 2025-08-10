"use client";

import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function MoneyPage() {
    const router = useRouter();
  return (
    <div>
      <header className="sticky top-0 z-10 flex items-center gap-4 border-b bg-background p-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <h1 className="flex-1 truncate text-lg font-semibold text-center">پیسے</h1>
        <div className="w-10"></div>
      </header>
      <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground h-[80vh]">
        <h3 className="text-lg font-semibold">پیسے / ادائیگیاں</h3>
        <p className="text-sm">یہ فیچر جلد آرہا ہے۔</p>
      </div>
    </div>
  );
}
