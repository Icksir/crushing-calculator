import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.dofusdu.de',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
