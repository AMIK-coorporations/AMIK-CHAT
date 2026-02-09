"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Shield, SunMoon } from "lucide-react";


export default function SettingsPage() {
  const router = useRouter();

  return (
    <div>
      <header className="sticky top-0 z-10 flex items-center gap-4 border-b bg-background p-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <h1 className="flex-1 truncate text-lg font-semibold">ترتیبات</h1>
      </header>

      <div className="p-4 space-y-4">
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              <Link href="/me/settings/account" className="flex items-center p-4 transition-colors hover:bg-muted/50">
                <Shield className="h-6 w-6 text-accent mr-4" />
                <div className="flex-1">
                  <p className="font-medium">کھاتہ اور حفاظت</p>
                  <p className="text-sm text-muted-foreground">پاس ورڈ، اکاؤنٹ کی تفصیلات</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </Link>
              <Link href="/me/settings/change-pin" className="flex items-center p-4 transition-colors hover:bg-muted/50">
                <Shield className="h-6 w-6 text-accent mr-4" />
                <div className="flex-1">
                  <p className="font-medium">پیسوں کا پن تبدیل کریں</p>
                  <p className="text-sm text-muted-foreground">اپنے سیکیورٹی پن کو تبدیل کریں</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </Link>
              <Link href="/me/settings/theme" className="flex items-center p-4 transition-colors hover:bg-muted/50">
                <SunMoon className="h-6 w-6 text-accent mr-4" />
                <div className="flex-1">
                  <p className="font-medium">پس منظر</p>
                  <p className="text-sm text-muted-foreground">اندھیرا، روشنی، آلہ کی طے شدہ</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </Link>
              <Link href="/me/settings/about" className="flex items-center p-4 transition-colors hover:bg-muted/50">
                <Shield className="h-6 w-6 text-accent mr-4" />
                <div className="flex-1">
                  <p className="font-medium">ایپ کے بارے میں</p>
                  <p className="text-sm text-muted-foreground">ورژن، شرائط اور پرائیویسی</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
