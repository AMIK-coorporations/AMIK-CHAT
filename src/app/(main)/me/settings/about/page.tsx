"use client";

import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Shield, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AboutPage() {
    const router = useRouter();

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <header className="sticky top-0 z-10 flex items-center gap-4 border-b bg-background p-3">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ChevronLeft className="h-6 w-6" />
                </Button>
                <h1 className="text-lg font-semibold">ایپ کے بارے میں</h1>
            </header>

            <div className="p-4 space-y-6">
                <div className="flex flex-col items-center justify-center space-y-2 py-8">
                    <div className="h-24 w-24 rounded-xl bg-primary/10 flex items-center justify-center">
                        <img src="/logo.png" alt="AMIK Chat" className="h-16 w-16" />
                    </div>
                    <h2 className="text-2xl font-bold">AMIK CHAT</h2>
                    <p className="text-muted-foreground">Version 1.0.0</p>
                </div>

                <Card>
                    <CardContent className="p-0">
                        <div className="divide-y">
                            <Link href="/privacy-policy" className="flex items-center p-4 transition-colors hover:bg-muted/50">
                                <FileText className="h-6 w-6 text-accent mr-4" />
                                <div className="flex-1">
                                    <p className="font-medium">پرائیویسی پالیسی</p>
                                    <p className="text-sm text-muted-foreground">ہماری پالیسی پڑھیں</p>
                                </div>
                                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            </Link>
                            <Link href="/terms-of-services" className="flex items-center p-4 transition-colors hover:bg-muted/50">
                                <FileText className="h-6 w-6 text-accent mr-4" />
                                <div className="flex-1">
                                    <p className="font-medium">شرائط و ضوابط</p>
                                    <p className="text-sm text-muted-foreground">استعمال کی شرائط</p>
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
