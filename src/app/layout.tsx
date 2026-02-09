
import type { Metadata, Viewport } from 'next';
import './globals.css';
import RootProviders from '@/components/RootProviders';

export const metadata: Metadata = {
  title: 'اے ایم آئی کے چیٹ',
  description: 'ایک جدید چیٹ ایپلیکیشن',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: "https://iili.io/fU7NHil.png",
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
    <html lang="ur" dir="ltr" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="/tailwind-static.css" />
      </head>
      <body className="antialiased bg-background text-foreground" suppressHydrationWarning>
        <RootProviders>
          {children}
        </RootProviders>
      </body>
    </html>
  );
}
