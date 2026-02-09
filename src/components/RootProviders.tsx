"use client";

import React from 'react';

import { AuthProvider } from '@/hooks/useAuth';
import { CallProvider } from '@/context/CallContext';
import { Toaster } from "@/components/ui/toaster";
import { Analytics } from "@vercel/analytics/next";
import { ErrorBoundary } from '@/components/ErrorBoundary';
import PrefetchRoutes from '@/components/PrefetchRoutes';

export default function RootProviders({ children }: { children: React.ReactNode }) {
    return (
        <ErrorBoundary>
            <AuthProvider>
                <CallProvider>
                    <PrefetchRoutes />
                    {children}
                    <Toaster />
                    <Analytics />
                </CallProvider>
            </AuthProvider>
        </ErrorBoundary>
    );
}
