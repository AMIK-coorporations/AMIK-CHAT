"use client";

import React from "react";
import Sidebar from "@/app/docs/components/Sidebar";
import Header from "@/app/docs/components/Header";
import { LanguageProvider } from "@/app/docs/components/LanguageContext";

export default function DocsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <LanguageProvider>
            <div className="flex h-screen flex-col bg-background text-foreground overflow-hidden">
                <Header />
                <div className="flex flex-1 overflow-hidden">
                    <Sidebar />
                    <main className="flex-1 overflow-y-auto p-6 md:p-10">
                        <div className="mx-auto max-w-4xl">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </LanguageProvider>
    );
}
