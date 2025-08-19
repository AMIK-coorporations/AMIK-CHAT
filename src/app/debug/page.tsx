"use client";

import { useState, useEffect } from 'react';
import AppLogo from '@/components/AppLogo';
import Image from 'next/image';

export default function DebugPage() {
  const [logoStatus, setLogoStatus] = useState<string>('Loading...');
  const [imageStatus, setImageStatus] = useState<string>('Loading...');

  useEffect(() => {
    // Test if logo.png is accessible
    const testLogo = new window.Image();
    testLogo.onload = () => setImageStatus('✅ Direct image load successful');
    testLogo.onerror = () => setImageStatus('❌ Direct image load failed');
    testLogo.src = '/logo.png';

    // Test fetch
    fetch('/logo.png')
      .then(response => {
        if (response.ok) {
          setLogoStatus('✅ Fetch successful');
        } else {
          setLogoStatus(`❌ Fetch failed: ${response.status}`);
        }
      })
      .catch(error => {
        setLogoStatus(`❌ Fetch error: ${error.message}`);
      });
  }, []);

  return (
    <div className="min-h-screen bg-background p-8">
      <h1 className="text-2xl font-bold mb-8">Debug Page</h1>
      
      <div className="space-y-8">
        <div>
          <h2 className="text-lg font-semibold mb-4">Logo Loading Status</h2>
          <div className="space-y-2">
            <p>Fetch status: {logoStatus}</p>
            <p>Image load status: {imageStatus}</p>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">AppLogo Component Test</h2>
          <div className="flex gap-4">
            <AppLogo width={64} height={64} />
            <AppLogo width={128} height={128} />
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Direct Image Test</h2>
          <div className="flex gap-4">
            <Image 
              src="/logo.png" 
              alt="Direct Logo" 
              width={64} 
              height={64} 
              className="border"
            />
            <Image 
              src="/logo.png" 
              alt="Direct Logo" 
              width={128} 
              height={128} 
              className="border"
            />
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Environment Info</h2>
          <div className="space-y-2 text-sm">
            <p>Node ENV: {process.env.NODE_ENV}</p>
            <p>Base URL: {process.env.NEXT_PUBLIC_BASE_URL || 'Not set'}</p>
            <p>Current URL: {typeof window !== 'undefined' ? window.location.href : 'SSR'}</p>
          </div>
        </div>
      </div>
    </div>
  );
} 