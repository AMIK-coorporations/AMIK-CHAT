"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function DocsPage() {
    const router = useRouter();

    return (
        <div className="p-4 space-y-4">
            <header className="flex items-center gap-4 mb-6">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <h1 className="text-2xl font-bold">دستاویزات</h1>
            </header>
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-muted-foreground">
                <p>دستاویزات کا مواد جلد آرہا ہے۔</p>
            </div>
        </div>
    );
}
