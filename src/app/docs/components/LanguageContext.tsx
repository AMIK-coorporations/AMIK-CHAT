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
        "sections.qr": "کیو آر کوڈ",
        "sections.advanced": "جدید خصوصیات",
        "sections.settings": "ترتیبات",
        "sections.security": "سیکیورٹی",
        "sections.faq": "عام سوالات",
        "sections.troubleshooting": "مسائل کا حل",
        "sections.support": "مدد اور رابطہ",
        "nav.intro": "تعارف",
        "nav.setup": "اکاؤنٹ بنانا",
        "nav.firstLogin": "پہلی بار لاگ ان",
        "nav.interface": "انٹرفیس کا جائزہ",
        "nav.messaging": "پیغام رسانی",
        "nav.calls": "آواز اور ویڈیو کالز",
        "nav.fileSharing": "فائل شیئرنگ",
        "nav.voiceNotes": "آواز کے پیغامات",
        "nav.screenShare": "اسکرین شیئر",
        "nav.aiFeatures": "AI خصوصیات",
        "nav.addContacts": "رابطے شامل کریں",
        "nav.groups": "گروپس",
        "nav.blocking": "بلاک کرنا",
        "nav.scan": "اسکین اور شیئر",
        "nav.generate": "کیو آر بنائیں",
        "nav.miniPrograms": "منی پروگرامز",
        "nav.bots": "بوٹس",
        "nav.translations": "ترجمے",
        "nav.profile": "پروفائل",
        "nav.appearance": "ظاہری شکل",
        "nav.notifications": "اطلاعات",
        "nav.privacy": "رازداری",
        "nav.data": "ڈیٹا",
        "nav.encryption": "انکرپشن",
        "nav.backup": "بیک اپ",
        "nav.permissions": "اجازتیں",
        "nav.general": "عمومی",
        "nav.commonIssues": "عام مسائل",
        "nav.connection": "کنکشن کے مسائل",
        "nav.contact": "رابطہ کریں"
    },
    en: {
        "nav.home": "Home",
        "nav.search": "Search...",
        "nav.language": "Language",
        "sections.gettingStarted": "Getting Started",
        "sections.coreFeatures": "Core Features",
        "sections.contacts": "Contacts",
        "sections.qr": "QR Code",
        "sections.advanced": "Advanced",
        "sections.settings": "Settings",
        "sections.security": "Security",
        "sections.faq": "FAQ",
        "sections.troubleshooting": "Troubleshooting",
        "sections.support": "Support",
        "nav.intro": "Introduction",
        "nav.setup": "Account Setup",
        "nav.firstLogin": "First Login",
        "nav.interface": "Interface Overview",
        "nav.messaging": "Messaging",
        "nav.calls": "Voice & Video Calls",
        "nav.fileSharing": "File Sharing",
        "nav.voiceNotes": "Voice Notes",
        "nav.screenShare": "Screen Share",
        "nav.aiFeatures": "AI Features",
        "nav.addContacts": "Add Contacts",
        "nav.groups": "Groups",
        "nav.blocking": "Blocking",
        "nav.scan": "Scan & Share",
        "nav.generate": "Generate QR",
        "nav.miniPrograms": "Mini Programs",
        "nav.bots": "Bots",
        "nav.translations": "Translations",
        "nav.profile": "Profile",
        "nav.appearance": "Appearance",
        "nav.notifications": "Notifications",
        "nav.privacy": "Privacy",
        "nav.data": "Data",
        "nav.encryption": "Encryption",
        "nav.backup": "Backup",
        "nav.permissions": "Permissions",
        "nav.general": "General",
        "nav.commonIssues": "Common Issues",
        "nav.connection": "Connection Problems",
        "nav.contact": "Contact Us"
    },
    zh: {
        "nav.home": "首页",
        "nav.search": "搜索...",
        "nav.language": "语言",
        "sections.gettingStarted": "入门指南",
        "sections.coreFeatures": "核心功能",
        "sections.contacts": "联系人",
        "sections.qr": "二维码",
        "sections.advanced": "高级功能",
        "sections.settings": "设置",
        "sections.security": "安全",
        "sections.faq": "常见问题",
        "sections.troubleshooting": "故障排除",
        "sections.support": "支持",
        "nav.intro": "介绍",
        "nav.setup": "账户设置",
        "nav.firstLogin": "首次登录",
        "nav.interface": "界面概览",
        "nav.messaging": "消息",
        "nav.calls": "语音和视频通话",
        "nav.fileSharing": "文件共享",
        "nav.voiceNotes": "语音消息",
        "nav.screenShare": "屏幕共享",
        "nav.aiFeatures": "AI功能",
        "nav.addContacts": "添加联系人",
        "nav.groups": "群组",
        "nav.blocking": "屏蔽",
        "nav.scan": "扫描和分享",
        "nav.generate": "生成二维码",
        "nav.miniPrograms": "小程序",
        "nav.bots": "机器人",
        "nav.translations": "翻译",
        "nav.profile": "个人资料",
        "nav.appearance": "外观",
        "nav.notifications": "通知",
        "nav.privacy": "隐私",
        "nav.data": "数据",
        "nav.encryption": "加密",
        "nav.backup": "备份",
        "nav.permissions": "权限",
        "nav.general": "常规",
        "nav.commonIssues": "常见问题",
        "nav.connection": "连接问题",
        "nav.contact": "联系我们"
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
