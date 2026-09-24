import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: process.env.VERCEL ? undefined : "standalone",
  serverExternalPackages: ['onnxruntime-node'],
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
