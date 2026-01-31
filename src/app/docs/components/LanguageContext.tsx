"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Language = "ur" | "en" | "zh";

interface LanguageContextType {
    lang: Language;
    setLang: (lang: Language) => void;
    t: (key: string) => string;
}

import urTranslations from "../translations/ur.json";
import enTranslations from "../translations/en.json";
import zhTranslations from "../translations/zh.json";

const translations: Record<Language, any> = {
    ur: urTranslations,
    en: enTranslations,
    zh: zhTranslations
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
