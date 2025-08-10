
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/hooks/useAuth';

const APP_LOGO_URL = "https://storage.googleapis.com/project-123-files/user-upload-5f6962ce-4b8c-4467-9c98-132da9700305.png?v=10";

export const metadata: Metadata = {
  title: 'اے ایم آئی کے چیٹ',
  description: 'ایک جدید چیٹ ایپلیکیشن',
  manifest: '/manifest.json',
  themeColor: '#05c765',
  icons: {
    icon: APP_LOGO_URL,
    shortcut: APP_LOGO_URL,
    apple: APP_LOGO_URL,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ur" dir="ltr" suppressHydrationWarning={true}>
      <head>
        <meta name="theme-color" content="#05c765" />
      </head>
      <body className="font-body antialiased" suppressHydrationWarning={true}>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
