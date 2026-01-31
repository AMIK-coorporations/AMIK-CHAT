"use client";

import React, { useEffect, useState } from "react";
import { useLanguage } from "@/app/docs/components/LanguageContext";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function DocPage({ params }: { params: { slug: string } }) {
    const { lang } = useLanguage();
    const [content, setContent] = useState<string>("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchDoc() {
            try {
                // In a real app, this would be a server action or a fetch to a local MDX file
                // For simulation, we'll try to fetch the local file text
                const response = await fetch(`/api/docs?lang=${lang}&slug=${params.slug}`);
                const data = await response.json();
                setContent(data.content);
            } catch (err) {
                setContent("# Error\nCould not load documentation.");
            } finally {
                setLoading(false);
            }
        }
        fetchDoc();
    }, [lang, params.slug]);

    if (loading) return <div>لوڈ ہو رہا ہے...</div>;

    return (
        <article className="prose prose-slate dark:prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
            </ReactMarkdown>
        </article>
    );
}
