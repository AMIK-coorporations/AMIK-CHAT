"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/app/docs/components/LanguageContext";
import { cn } from "@/lib/utils";
import {
    BookOpen,
    Settings,
    MessageCircle,
    ShieldCheck,
    HelpCircle,
    ChevronRight,
    Code,
    Users,
    QrCode,
    Zap
} from "lucide-react";

const getNavItems = (t: any) => [
    {
        title: t("sections.gettingStarted"),
        icon: BookOpen,
        slug: "getting-started",
        items: [
            { name: "Introduction", slug: "intro" },
            { name: "Account Setup", slug: "setup" },
        ]
    },
    {
        title: t("sections.coreFeatures"),
        icon: Zap,
        slug: "features",
        items: [
            { name: "Messaging", slug: "messaging" },
            { name: "Voice & Video", slug: "calls" },
        ]
    },
    {
        title: t("sections.qr"),
        icon: QrCode,
        slug: "qr-code",
        items: [
            { name: "Scan & Share", slug: "scan" },
        ]
    }
];

export default function Sidebar() {
    const { lang, t } = useLanguage();
    const pathname = usePathname();
    const navItems = getNavItems(t);

    return (
        <aside className="hidden w-64 flex-col border-r bg-muted/30 md:flex">
            <div className="flex-1 overflow-y-auto p-4 py-6">
                <nav className="space-y-6">
                    {navItems.map((section, idx) => (
                        <div key={idx} className="space-y-3">
                            <h4 className="flex items-center gap-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                <section.icon className="h-3 w-3" />
                                {section.title}
                            </h4>
                            <div className="space-y-1">
                                {section.items.map((item, itemIdx) => {
                                    const href = `/docs/${lang}/${section.slug}/${item.slug}`;
                                    const active = pathname === href;
                                    return (
                                        <Link
                                            key={itemIdx}
                                            href={href}
                                            className={cn(
                                                "group flex items-center justify-between rounded-md px-2 py-1.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                                                active ? "bg-accent text-accent-foreground" : "text-foreground"
                                            )}
                                        >
                                            <span>{item.name}</span>
                                            <ChevronRight className={cn(
                                                "h-3 w-3 transition-transform",
                                                active ? "rotate-90" : "opacity-0 group-hover:opacity-100"
                                            )} />
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>
            </div>
        </aside>
    );
}
