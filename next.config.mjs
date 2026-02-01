/** @type {import('next').NextConfig} */
import withPWA from 'next-pwa';

const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'storage.googleapis.com' },
      { protocol: 'https', hostname: 'amik-qr-code.vercel.app' },
      { protocol: 'https', hostname: 'amik-ai-agent.vercel.app' },
    ],
    unoptimized: false,
  },
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@radix-ui/react-icons', '@radix-ui/react-primitives'],
  },
  webpack: (config, { isServer, dev }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false, net: false, tls: false, crypto: false, stream: false,
        url: false, zlib: false, http: false, https: false, assert: false,
        os: false, path: false, util: false, buffer: false, querystring: false,
      };
    }
    return config;
  },
  compress: true,
  swcMinify: true,
  staticPageGenerationTimeout: 120,
  trailingSlash: false,
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [
        // 1. Root of docs subdomain -> docs home
        {
          source: '/',
          has: [{ type: 'host', value: 'docs.amikchat.site' }],
          destination: '/docs',
        },
        // 2. Explicit language paths
        {
          source: '/:lang(ur|en|zh)/:path*',
          has: [{ type: 'host', value: 'docs.amikchat.site' }],
          destination: '/docs/:lang/:path*',
        },
        // 3. Language-less paths (e.g. /getting-started/intro) -> default to Urdu
        {
          source: '/:path*',
          has: [{ type: 'host', value: 'docs.amikchat.site' }],
          destination: '/docs/ur/:path*',
        },
      ],
    };
  },
};

export default withPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
})(nextConfig);
