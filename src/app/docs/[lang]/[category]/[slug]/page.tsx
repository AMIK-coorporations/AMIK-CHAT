"use client";

import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useLanguage } from "@/app/docs/components/LanguageContext";

export default function DocContentPage({ params }: { params: { lang: string, category: string, slug: string } }) {
    const { lang: contextLang } = useLanguage();
    const [content, setContent] = useState<string>("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchDoc() {
            try {
                const response = await fetch(`/api/docs?lang=${contextLang}&category=${params.category}&slug=${params.slug}`);
                const data = await response.json();
                if (data.content) {
                    setContent(data.content);
                } else {
                    setContent("# Not Found\nThe requested documentation page could not be found.");
                }
            } catch (err) {
                setContent("# Error\nCould not load documentation.");
            } finally {
                setLoading(false);
            }
        }
        fetchDoc();
    }, [contextLang, params.category, params.slug]);

    if (loading) return (
        <div className="flex flex-col gap-4 animate-pulse">
            <div className="h-10 w-3/4 bg-muted rounded-md" />
            <div className="h-4 w-full bg-muted rounded-md" />
            <div className="h-4 w-full bg-muted rounded-md" />
            <div className="h-4 w-5/6 bg-muted rounded-md" />
        </div>
    );

    return (
        <article className="prose prose-slate dark:prose-invert max-w-none pt-2 pb-20">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
            </ReactMarkdown>
        </article>
    );
}
