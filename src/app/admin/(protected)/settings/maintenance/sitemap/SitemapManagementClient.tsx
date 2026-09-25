"use client";

import React, { useState } from "react";
import { MaintenanceSubNav } from "@/components/admin/maintenance/MaintenanceSubNav";
import { rebuildSitemapAction } from "../maintenance-actions";
import { FileSpreadsheet, RefreshCw, CheckCircle2, Loader2, Globe, ExternalLink } from "lucide-react";

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="h-6 w-6 text-emerald-600" />
            XML Sitemap Rebuild & Domain Validation
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Generate and validate XML sitemap for search engines using canonical production domain URLs.
          </p>
        </div>

        <button
          onClick={handleRebuild}
          disabled={loading}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 transition-colors shadow-xs cursor-pointer disabled:opacity-50 self-start sm:self-center"
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
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
          <Globe className="h-4 w-4 text-emerald-600" /> Sitemap Domain & Namespace Verification
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-400 block mb-1">Canonical Domain:</span>
            <span className="font-mono font-bold text-slate-900 text-sm">{domain}</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-400 block mb-1">Sitemap File Location:</span>
            <span className="font-mono font-bold text-slate-900 text-sm">/public/sitemap.xml</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-slate-400 block mb-1">XML Schema Namespace:</span>
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
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Latest Sitemap Build Summary
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="text-slate-400 block">Total Index URLs:</span>
              <span className="font-bold text-base text-slate-900">{result.urlCount}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="text-slate-400 block">Generated At:</span>
              <span className="font-semibold text-slate-900">{new Date(result.generatedAt).toLocaleString()}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="text-slate-400 block">XML Validation:</span>
              <span className="font-semibold text-emerald-600">PASSED ({result.status})</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="text-slate-400 block">Sitemap URL:</span>
              <span className="font-mono text-[10px] truncate block text-slate-900">{result.sitemapUrl}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
