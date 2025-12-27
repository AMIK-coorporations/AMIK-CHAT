
import type {Metadata, Viewport} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/hooks/useAuth';
import { CallProvider } from '@/context/CallContext';
import PrefetchRoutes from '@/components/PrefetchRoutes';
import { Analytics } from "@vercel/analytics/next";
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { initBrowserCompatibility } from '@/lib/browserCompatibility';


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
        <script dangerouslySetInnerHTML={{__html: `
          (function(){
            try{
              var saved = localStorage.getItem('theme') || 'system';
              if(!localStorage.getItem('theme')) localStorage.setItem('theme','system');
              var mql = window.matchMedia('(prefers-color-scheme: dark)');
              var apply = function(mode){
                var isDark = mode === 'dark' || (mode !== 'light' && mql.matches);
                document.documentElement.classList[isDark?'add':'remove']('dark');
              };
              apply(saved);
              mql.addEventListener && mql.addEventListener('change', function(){
                if((localStorage.getItem('theme')||'system')==='system') apply('system');
              });
            }catch(e){}
          })();
        `}} />
      </head>
      <body className="font-body antialiased" suppressHydrationWarning={true}>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // Browser compatibility check
                  if (typeof window !== 'undefined') {
                    if (!window.fetch) console.warn('Fetch API not supported');
                    try {
                      localStorage.setItem('test', 'test');
                      localStorage.removeItem('test');
                    } catch(e) {
                      console.warn('localStorage not available');
                    }
                  }
                  
                  // Handle chunk loading errors with better recovery
                  let chunkErrorCount = 0;
                  const MAX_CHUNK_ERRORS = 3;
                  
                  window.addEventListener('error', function(e) {
                    if (e.message && (e.message.includes('chunk') || e.message.includes('ChunkLoadError'))) {
                      chunkErrorCount++;
                      console.warn('Chunk loading error detected (' + chunkErrorCount + '/' + MAX_CHUNK_ERRORS + ')');
                      
                      if (chunkErrorCount >= MAX_CHUNK_ERRORS) {
                        console.warn('Max chunk errors reached, reloading page...');
                        setTimeout(() => {
                          window.location.reload();
                        }, 2000);
                      } else {
                        // Try to recover by clearing cache
                        if ('caches' in window) {
                          caches.keys().then(function(names) {
                            for (let name of names) {
                              caches.delete(name);
                            }
                          });
                        }
                      }
                    }
                  });
                  
                  // Reset error count on successful navigation
                  window.addEventListener('load', function() {
                    chunkErrorCount = 0;
                  });
                } catch(e) {
                  console.error('Init error:', e);
                }
              })();
            `,
          }}
        />
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
      </body>
    </html>
  );
}
