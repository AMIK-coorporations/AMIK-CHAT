"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Language = "ur" | "en" | "zh";

interface LanguageContextType {
    lang: Language;
    setLang: (lang: Language) => void;
    t: (key: string) => string;
}

const translations = {
    ur: {
        "nav.home": "ہیلو",
        "nav.search": "تلاش کریں...",
        "nav.language": "زبان",
        "sections.gettingStarted": "شروعات",
        "sections.coreFeatures": "بنیادی خصوصیات",
        "sections.contacts": "رابطے",
        "sections.qr": "کیو آر کوڈ"
    },
    en: {
        "nav.home": "Home",
        "nav.search": "Search...",
        "nav.language": "Language",
        "sections.gettingStarted": "Getting Started",
        "sections.coreFeatures": "Core Features",
        "sections.contacts": "Contacts",
        "sections.qr": "QR Code"
    },
    zh: {
        "nav.home": "首页",
        "nav.search": "搜索...",
        "nav.language": "语言",
        "sections.gettingStarted": "入门指南",
        "sections.coreFeatures": "核心功能",
        "sections.contacts": "联系人",
        "sections.qr": "二维码"
    }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [lang, setLang] = useState<Language>("ur");

    useEffect(() => {
        const saved = localStorage.getItem("docs-lang") as Language;
        if (saved && (saved === "ur" || saved === "en" || saved === "zh")) {
            setLang(saved);
        }
    }, []);

    const handleSetLang = (newLang: Language) => {
        setLang(newLang);
        localStorage.setItem("docs-lang", newLang);
    };

    const t = (key: string) => {
        return (translations[lang] as any)[key] || key;
    };

    return (
        <LanguageContext.Provider value={{ lang, setLang: handleSetLang, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) throw new Error("useLanguage must be used within LanguageProvider");
    return context;
}
