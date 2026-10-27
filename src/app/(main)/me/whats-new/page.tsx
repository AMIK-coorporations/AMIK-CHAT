"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Sparkles, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Update = {
  date: string;
  title: string;
  items: string[];
};

// نئی تبدیلیاں سب سے اوپر شامل کریں
const updates: Update[] = [
  {
    date: "27 اکتوبر 2026",
    title: "داخلے اور خروج کے نئے بٹن",
    items: [
      "داخل ہوں، کھاتہ بنائیں اور کھاتہ خروج بٹنوں پر دروازے والا نیا اینیمیٹڈ آئیکن۔",
      "کھاتہ خروج دبانے پر آدمی دروازے سے باہر نکلتا دکھائی دیتا ہے۔",
    ],
  },
  {
    date: "26 اکتوبر 2026",
    title: "تیز اور محفوظ داخلہ",
    items: [
      "داخل ہونے کے بعد چیٹس اب فوراً کھلتی ہیں، خالی اسکرین پر نہیں رکتیں۔",
      "صفحہ دوبارہ کھولنے پر بھی آپ داخل رہتے ہیں۔",
      "پاس ورڈ کم از کم 8 حروف اور ایک عدد پر مشتمل ہونا ضروری۔",
      "غلط پتے پر جانے کے لیے نیا صفحہ جو واپس راستہ دکھاتا ہے۔",
    ],
  },
  {
    date: "26 اکتوبر 2026",
    title: "حقیقی تصدیقی کوڈ",
    items: [
      "کھاتہ بناتے وقت اب اصل تصدیقی کوڈ آپ کی ای میل پر آتا ہے۔",
      "کوڈ دوبارہ بھیجنے کی سہولت۔",
    ],
  },
];

export default function WhatsNewPage() {
  const [selected, setSelected] = useState<number | null>(null);
  const current = selected !== null ? updates[selected] : null;

  return (
    <div>
      <header className="sticky top-0 z-10 flex items-center gap-4 border-b bg-background p-3">
        <Link href="/me" className="p-1 rounded-md hover:bg-muted">
          <ChevronLeft className="h-6 w-6" />
        </Link>
        <h1 className="flex-1 truncate text-lg font-semibold">نیا کیا ہے</h1>
      </header>

      <div className="p-4">
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {updates.map((u, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelected(i)}
                  className="flex w-full items-center gap-3 p-4 text-left transition-all hover:bg-muted/50 active:scale-[0.98] animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500"
                  style={{ animationDelay: `${i * 90}ms` }}
                >
                  <Sparkles className="h-6 w-6 text-accent shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{u.title}</span>
                      {i === 0 && (
                        <span className="rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground">نیا</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{u.date}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={selected !== null} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-[92vw] rounded-2xl sm:max-w-md" dir="rtl">
          {current && (
            <>
              <DialogHeader className="text-right sm:text-right">
                <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-accent/15 animate-in zoom-in-50 spin-in-12 duration-500">
                  <Sparkles className="h-7 w-7 text-accent" />
                </div>
                <DialogTitle className="text-center">{current.title}</DialogTitle>
                <DialogDescription className="text-center">{current.date}</DialogDescription>
              </DialogHeader>
              <ul className="space-y-3">
                {current.items.map((it, j) => (
                  <li
                    key={`${selected}-${j}`}
                    className="flex items-start gap-2 text-sm animate-in fade-in slide-in-from-right-4 fill-mode-both duration-500"
                    style={{ animationDelay: `${150 + j * 120}ms` }}
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
