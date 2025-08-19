"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const ROUTES_TO_PREFETCH = [
  "/chats",
  "/contacts",
  "/discover",
  "/me",
];

export default function PrefetchRoutes() {
  const router = useRouter();

  useEffect(() => {
    const prefetchAll = () => {
      ROUTES_TO_PREFETCH.forEach((path) => {
        try {
          router.prefetch(path);
        } catch {}
      });
    };

    // Use requestIdleCallback when available to avoid competing with critical work
    if (typeof (window as any).requestIdleCallback === "function") {
      (window as any).requestIdleCallback(prefetchAll, { timeout: 1500 });
    } else {
      const id = window.setTimeout(prefetchAll, 800);
      return () => window.clearTimeout(id);
    }
  }, [router]);

  return null;
} 