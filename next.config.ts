import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit .next/standalone: a self-contained server plus only the traced
  // node_modules. This is what the Dockerfile ships, and it is why the runtime
  // image never runs `npm install`.
  //
  // Vercel builds through its own adapter and does not consume this output, so
  // it is left off there rather than built and thrown away. VERCEL is set by
  // Vercel during the build; everywhere else — local, CI, the image — is
  // unaffected.
  output: process.env.VERCEL ? undefined : "standalone",

  // Safety margin on top of the src/server/cache.ts memoization fix: static
  // generation for a MongoDB-backed page can still occasionally be slower
  // than the 60s default (cross-region latency, cold connection), and one
  // slow page shouldn't fail the whole build.
  staticPageGenerationTimeout: 180,
};

export default nextConfig;
