import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: process.env.VERCEL ? undefined : "standalone",
  serverExternalPackages: ['onnxruntime-node'],
  // Increase timeout for static generation to prevent Vercel from killing slow DB queries
  staticPageGenerationTimeout: 300,
};

export default nextConfig;
