"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Shield } from "lucide-react";


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
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
