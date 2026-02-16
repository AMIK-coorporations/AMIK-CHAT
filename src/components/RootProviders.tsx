"use client";

import React, { ReactNode } from 'react';

import { AuthProvider } from '@/hooks/useAuth';
import { CallProvider } from '@/context/CallContext';
import { Toaster } from "@/components/ui/toaster";
import { Analytics } from "@vercel/analytics/next";
import { ErrorBoundary } from '@/components/ErrorBoundary';
import PrefetchRoutes from '@/components/PrefetchRoutes';
import { ThemeProvider } from './ThemeProvider';
import OneSignalInitializer from './OneSignalInitializer';

export default function RootProviders({ children }: { children: React.ReactNode }) {
    return (
        <ErrorBoundary>
            <AuthProvider>
                <OneSignalInitializer />
                <CallProvider>
                    <ThemeProvider>
                        <PrefetchRoutes />
                        {children}
                        <Toaster />
                        <Analytics />
                    </ThemeProvider>
                </CallProvider>
            </AuthProvider>
        </ErrorBoundary>
    );
}
