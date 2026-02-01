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
            { name: t("nav.intro"), slug: "intro" },
            { name: t("nav.setup"), slug: "setup" },
            { name: t("nav.firstLogin"), slug: "first-login" },
            { name: t("nav.interface"), slug: "interface" },
        ]
    },
    {
        title: t("sections.coreFeatures"),
        icon: Zap,
        slug: "features",
        items: [
            { name: t("nav.messaging"), slug: "messaging" },
            { name: t("nav.calls"), slug: "calls" },
            { name: t("nav.fileSharing"), slug: "file-sharing" },
            { name: t("nav.voiceNotes"), slug: "voice-notes" },
            { name: t("nav.screenShare"), slug: "screen-share" },
            { name: t("nav.aiFeatures"), slug: "ai-features" },
        ]
    },
    {
        title: t("sections.contacts"),
        icon: Users,
        slug: "contacts",
        items: [
            { name: t("nav.addContacts"), slug: "add-contacts" },
            { name: t("nav.groups"), slug: "groups" },
            { name: t("nav.blocking"), slug: "blocking" },
        ]
    },
    {
        title: t("sections.qr"),
        icon: QrCode,
        slug: "qr-code",
        items: [
            { name: t("nav.scan"), slug: "scan" },
            { name: t("nav.generate"), slug: "generate" },
        ]
    },
    {
        title: t("sections.advanced"),
        icon: Code,
        slug: "advanced",
        items: [
            { name: t("nav.miniPrograms"), slug: "mini-programs" },
            { name: t("nav.bots"), slug: "bots" },
            { name: t("nav.translations"), slug: "translations" },
        ]
    },
    {
        title: t("sections.settings"),
        icon: Settings,
        slug: "settings",
        items: [
            { name: t("nav.profile"), slug: "profile" },
            { name: t("nav.appearance"), slug: "appearance" },
            { name: t("nav.notifications"), slug: "notifications" },
            { name: t("nav.privacy"), slug: "privacy" },
            { name: t("nav.data"), slug: "data" },
        ]
    },
    {
        title: t("sections.security"),
        icon: ShieldCheck,
        slug: "security",
        items: [
            { name: t("nav.encryption"), slug: "encryption" },
            { name: t("nav.backup"), slug: "backup" },
            { name: t("nav.permissions"), slug: "permissions" },
        ]
    },
    {
        title: t("sections.faq"),
        icon: HelpCircle,
        slug: "faq",
        items: [
            { name: t("nav.general"), slug: "general" },
        ]
    },
    {
        title: t("sections.troubleshooting"),
        icon: MessageCircle,
        slug: "troubleshooting",
        items: [
            { name: t("nav.commonIssues"), slug: "common-issues" },
            { name: t("nav.connection"), slug: "connection" },
        ]
    },
    {
        title: t("sections.support"),
        icon: HelpCircle,
        slug: "support",
        items: [
            { name: t("nav.contact"), slug: "contact" },
        ]
    }
];

export default function Sidebar() {
    const { lang, t } = useLanguage();
    const pathname = usePathname();
    const [basePath, setBasePath] = React.useState("/docs");

    React.useEffect(() => {
        if (typeof window !== "undefined") {
            const host = window.location.hostname;
            if (host.startsWith("docs.")) {
                setBasePath("");
            }
        }
    }, []);

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
                                    const href = `${basePath}/${lang}/${section.slug}/${item.slug}`;
                                    const active = pathname === href || pathname === href.replace("/docs", "");
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
