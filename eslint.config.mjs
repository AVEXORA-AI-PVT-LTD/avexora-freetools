import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Static assets are never app source (this also excludes the vendored,
    // minified pdf.worker.min.mjs, which isn't meant to be linted at all).
    "public/**",
    // One-off, non-shipped dev scripts (AEO coverage audits), not part of
    // the app's build or runtime.
    "check-aeo.js",
    "check-aeo.py",
    // Same: a one-off usage query and an already-applied codemod.
    "query-usage.js",
    "replace-quickactions.js",
  ]),
]);

export default eslintConfig;
