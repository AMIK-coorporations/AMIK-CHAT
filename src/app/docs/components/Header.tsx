"use client";

import React from "react";
import { Search, Globe, Menu } from "lucide-react";
import { useLanguage } from "./LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Header() {
    const { lang, setLang, t } = useLanguage();

    return (
        <header className="sticky top-0 z-50 flex h-16 w-full items-center justify-between border-b bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-5 w-5" />
                </Button>
                <div className="flex items-center gap-2 font-bold text-xl">
                    <span className="text-primary italic">AMIK</span>
                    <span>دستاویزات</span>
                </div>
            </div>

            <div className="flex flex-1 items-center justify-center max-w-md px-4">
                <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder={t("nav.search")}
                        className="pl-9 w-full bg-muted/50 focus-visible:ring-primary h-9"
                    />
                    <kbd className="pointer-events-none absolute right-3 top-1/2 hidden h-5 -translate-y-1/2 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                        <span className="text-xs">⌘</span>K
                    </kbd>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="gap-2">
                            <Globe className="h-4 w-4" />
                            <span className="hidden sm:inline uppercase">{lang}</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setLang("ur")}>اردو</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setLang("en")}>English</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setLang("zh")}>中文</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
