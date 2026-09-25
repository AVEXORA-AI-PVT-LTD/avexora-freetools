"use client";

import React, { useState } from "react";
import { MaintenanceSubNav } from "@/components/admin/maintenance/MaintenanceSubNav";
import { rebuildSitemapAction } from "../maintenance-actions";
import { FileSpreadsheet, RefreshCw, CheckCircle2, AlertTriangle, Loader2, Globe, ExternalLink } from "lucide-react";

export function SitemapManagementClient() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleRebuild = async () => {
    setLoading(true);
    setMessage(null);

    const res = await rebuildSitemapAction();
    if (res.success && res.result) {
      setResult(res.result);
      setMessage({ type: "success", text: "XML Sitemap rebuilt and validated successfully!" });
    } else {
      setMessage({ type: "error", text: res.error || "Sitemap rebuild failed" });
    }

    setLoading(false);
  };

  const domain = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "https://avextools.com";

  return (
    <div className="space-y-6">
      {/* Sub Navigation */}
      <MaintenanceSubNav />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <FileSpreadsheet className="h-6 w-6 text-emerald-600" />
            XML Sitemap Rebuild & Domain Validation
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Generate and validate XML sitemap for search engines using canonical production domain URLs.
          </p>
        </div>

        <button
          onClick={handleRebuild}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 transition-colors shadow-sm cursor-pointer disabled:opacity-50 self-start sm:self-center"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          <span>Rebuild & Validate Sitemap</span>
        </button>
      </div>

      {/* Feedback Banner */}
      {message && (
        <div
          className={`p-4 rounded-xl text-sm font-medium border ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Domain Verification Card */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
          <Globe className="h-4 w-4 text-emerald-600" /> Sitemap Domain & Namespace Verification
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
            <span className="text-zinc-400 block mb-1">Canonical Domain:</span>
            <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100 text-sm">{domain}</span>
          </div>

          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
            <span className="text-zinc-400 block mb-1">Sitemap File Location:</span>
            <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100 text-sm">/public/sitemap.xml</span>
          </div>

          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
            <div>
              <span className="text-zinc-400 block mb-1">XML Schema Namespace:</span>
              <span className="font-semibold text-emerald-600">sitemaps.org/0.9</span>
            </div>
            <a
              href="/sitemap.xml"
              target="_blank"
              className="p-2 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
              title="View Public Sitemap"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Sitemap Generation Result */}
      {result && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Latest Sitemap Build Summary
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
              <span className="text-zinc-400 block">Total Index URLs:</span>
              <span className="font-bold text-base text-zinc-900 dark:text-zinc-100">{result.urlCount}</span>
            </div>
            <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
              <span className="text-zinc-400 block">Generated At:</span>
              <span className="font-semibold">{new Date(result.generatedAt).toLocaleString()}</span>
            </div>
            <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
              <span className="text-zinc-400 block">XML Validation:</span>
              <span className="font-semibold text-emerald-600">PASSED ({result.status})</span>
            </div>
            <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
              <span className="text-zinc-400 block">Sitemap URL:</span>
              <span className="font-mono text-[10px] truncate block">{result.sitemapUrl}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
