import Link from "next/link";
import { ChevronLeft, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

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
  return (
    <div>
      <header className="sticky top-0 z-10 flex items-center gap-4 border-b bg-background p-3">
        <Link href="/me" className="p-1 rounded-md hover:bg-muted">
          <ChevronLeft className="h-6 w-6" />
        </Link>
        <h1 className="flex-1 truncate text-lg font-semibold">نیا کیا ہے</h1>
      </header>

      <div className="space-y-4 p-4" dir="rtl">
        {updates.map((u, i) => (
          <Card key={i}>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-accent" />
                <h2 className="flex-1 font-semibold">{u.title}</h2>
                {i === 0 && (
                  <span className="rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground">نیا</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{u.date}</p>
              <ul className="list-disc space-y-1 pr-5 text-sm">
                {u.items.map((it, j) => (
                  <li key={j}>{it}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
