import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit .next/standalone: a self-contained server plus only the traced
  // node_modules. This is what the Dockerfile ships, and it is why the runtime
  // image never runs `npm install`.
  output: "standalone",
};

export default nextConfig;
