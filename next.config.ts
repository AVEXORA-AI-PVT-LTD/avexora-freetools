import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: process.env.VERCEL ? undefined : "standalone",
  serverExternalPackages: ['onnxruntime-node'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
    ],
  },
  // Increase timeout for static generation to prevent Vercel from killing slow DB queries
  staticPageGenerationTimeout: 300,
  async redirects() {
    return [
      // The first static card page became the Digital Business Card Generator.
      {
        source: "/business-card.html",
        destination: "/business-legal/digital-business-card-generator",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
