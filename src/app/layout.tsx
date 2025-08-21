
import type {Metadata, Viewport} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/hooks/useAuth';
import PrefetchRoutes from '@/components/PrefetchRoutes';
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: 'اے ایم آئی کے چیٹ',
  description: 'ایک جدید چیٹ ایپلیکیشن',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/logo.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#05c765',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ur" dir="ltr" suppressHydrationWarning={true}>
      <head>
      </head>
      <body className="font-body antialiased" suppressHydrationWarning={true}>
        <AuthProvider>
          <PrefetchRoutes />
          {children}
          <Toaster />
          <Analytics />
        </AuthProvider>
      </body>
    </html>
  );
}
