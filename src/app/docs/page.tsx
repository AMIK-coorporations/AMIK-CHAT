"use client";

import React from "react";
import Link from "next/link";
import { useLanguage } from "@/app/docs/components/LanguageContext";
import {
    BookOpen,
    Settings,
    MessageCircle,
    ShieldCheck,
    HelpCircle,
    ChevronRight,
    ArrowRight,
    Rocket
} from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * AMIK CHAT Documentation Portal
 * Updated at: 2026-01-31T21:28:00 (ID: ver-1.0.1)
 */
export default function DocsPage() {
    const { t } = useLanguage();

    const categories = [
        {
            title: "شروعات",
            englishTitle: "Getting Started",
            description: "اکاؤنٹ بنانے اور پہلے لاگ ان کے بارے میں معلومات حاصل کریں۔",
            icon: Rocket,
            slug: "intro",
            color: "text-blue-500",
            bg: "bg-blue-500/10"
        },
        {
            title: "بنیادی خصوصیات",
            englishTitle: "Core Features",
            description: "پیغام رسانی، کالنگ اور فائل شیئرنگ کے بارے میں جانیں۔",
            icon: MessageCircle,
            slug: "messaging",
            color: "text-green-500",
            bg: "bg-green-500/10"
        },
        {
            title: "رابطے اور کیو آر",
            englishTitle: "Contacts & QR",
            description: "رابطے شامل کرنے اور کیو آر کوڈ استعمال کرنے کا طریقہ۔",
            icon: Settings,
            slug: "scan",
            color: "text-purple-500",
            bg: "bg-purple-500/10"
        }
    ];

    return (
        <div className="space-y-12 py-6">
            <section className="text-center space-y-4">
                <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
                    ہم آپ کی مدد کیسے کر سکتے ہیں؟
                </h1>
                <p className="text-xl text-muted-foreground mx-auto max-w-2xl">
                    AMIK CHAT کی تمام خصوصیات اور ان کو استعمال کرنے کے طریقوں کے بارے میں یہاں تفصیلی رہنمائی حاصل کریں۔
                </p>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {categories.map((cat, idx) => (
                    <Link
                        key={idx}
                        href={`/docs/${cat.slug}`}
                        className="group relative flex flex-col items-center p-8 border rounded-2xl bg-card hover:bg-accent/40 transition-all hover:shadow-xl hover:-translate-y-1"
                    >
                        <div className={`p-4 rounded-full ${cat.bg} ${cat.color} mb-6 transition-transform group-hover:scale-110`}>
                            <cat.icon className="h-8 w-8" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">{cat.title}</h3>
                        <p className="text-sm text-muted-foreground text-center mb-6">
                            {cat.description}
                        </p>
                        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                            مزید پڑھیں
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </div>
                    </Link>
                ))}
            </div>

            <section className="bg-muted/40 rounded-3xl p-10 mt-16 border border-dashed text-center">
                <h2 className="text-2xl font-bold mb-4">عام سوالات (FAQ)</h2>
                <p className="text-muted-foreground mb-8">
                    وہ سوالات جن کے جوابات اکثر صارفین تلاش کرتے ہیں۔
                </p>
                <Link href="/docs/faq">
                    <Button size="lg" className="rounded-full px-8">
                        تمام سوالات دیکھیں
                    </Button>
                </Link>
            </section>
        </div>
    );
}
