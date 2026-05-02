import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.dofusdu.de',
        port: '',
        pathname: '/**',
      },
    ],
    unoptimized: true,
  },
  
  async rewrites() {
    const apiProxyTarget = process.env.API_PROXY_TARGET || 'http://127.0.0.1:8000';
    return [
      {
        source: '/api/:path*',
        destination: `${apiProxyTarget}/api/:path*`,
      },
    ];
  },

  // Enable React strict mode for better development experience
  reactStrictMode: true,
};

export default nextConfig;
