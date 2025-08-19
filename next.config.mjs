/** @type {import('next').NextConfig} */
import withPWA from 'next-pwa';

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        port: '',
        pathname: '/**',
      },
    ],
    // Ensure static images are properly handled
    unoptimized: false,
    // Add logo.png to the list of allowed images
    domains: [],
  },
  // Production optimizations for Vercel
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@radix-ui/react-icons', '@radix-ui/react-primitives'],
  },
  // Webpack optimizations for production
  webpack: (config, { isServer, dev }) => {
    if (!isServer) {
      // Exclude Node.js specific modules from client bundle
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
        util: false,
        buffer: false,
        querystring: false,
      };
    }
    
    // Production optimizations
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
            },
          },
        },
      };
    }
    
    return config;
  },
  // Enable compression
  compress: true,
  // Reduce build time
  swcMinify: true,
  // Enable static optimization
  staticPageGenerationTimeout: 120,
  // Ensure static assets are properly copied
  trailingSlash: false,
};

export default withPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
})(nextConfig);
