import AppLogo from '@/components/AppLogo';
import Image from 'next/image';

export default function TestLogoPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <h1 className="text-2xl font-bold mb-8">Logo Test Page</h1>
      
      <div className="space-y-8">
        <div>
          <h2 className="text-lg font-semibold mb-4">AppLogo Component</h2>
          <div className="flex gap-4">
            <AppLogo width={64} height={64} />
            <AppLogo width={128} height={128} />
            <AppLogo width={256} height={256} />
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Direct Image Component</h2>
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
          <h2 className="text-lg font-semibold mb-4">Image URLs</h2>
          <div className="space-y-2 text-sm">
            <p>Logo path: /logo.png</p>
            <p>Favicon path: /favicon.ico</p>
            <p>Manifest path: /manifest.json</p>
          </div>
        </div>
      </div>
    </div>
  );
} 