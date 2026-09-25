"use client";

import React, { useState } from "react";
import { MaintenanceSubNav } from "@/components/admin/maintenance/MaintenanceSubNav";
import { clearCacheAction } from "../maintenance-actions";
import { CacheTarget } from "@/server/admin/maintenance-service";
import { Zap, RefreshCw, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";

export function CacheManagementClient() {
  const [loadingTarget, setLoadingTarget] = useState<string | null>(null);
  const [lastCleared, setLastCleared] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleClearCache = async (target: CacheTarget) => {
    if (target === "full_app" && !confirm("Are you sure you want to clear full application cache?")) return;

    setLoadingTarget(target);
    setMessage(null);

    const res = await clearCacheAction(target);
    if (res.success && res.result) {
      setLastCleared((prev) => ({ ...prev, [target]: new Date().toLocaleTimeString() }));
      setMessage({ type: "success", text: `Cache for '${target}' cleared successfully!` });
    } else {
      setMessage({ type: "error", text: res.error || "Failed to clear cache" });
    }

    setLoadingTarget(null);
  };

  const targets: { key: CacheTarget; title: string; desc: string; badge: string }[] = [
    { key: "homepage", title: "Homepage Cache", desc: "Invalidate static hero sections, featured tools, and home banners", badge: "Route: /" },
    { key: "tools", title: "Tools Directory & Pages", desc: "Invalidate tool catalog cards, tool specs, and execution forms", badge: "Route: /tools/*" },
    { key: "categories", title: "Category Pages", desc: "Invalidate tool category listing and directory hierarchies", badge: "Route: /categories/*" },
    { key: "seo", title: "SEO & Metadata Cache", desc: "Invalidate XML sitemap, robots.txt, and canonical headers", badge: "Files: sitemap.xml" },
    { key: "api", title: "API Endpoint Cache", desc: "Invalidate tagged internal API responses and fetch caches", badge: "Tag: api-cache" },
    { key: "full_app", title: "Full Application Cache", desc: "Invalidate all static pages, layouts, and component caches", badge: "Full Invalidation" },
  ];

  return (
    <div className="space-y-6">
      {/* Sub Navigation */}
      <MaintenanceSubNav />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <Zap className="h-6 w-6 text-amber-500" />
          Targeted Cache Management
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Revalidate targeted static pages, tool directories, SEO sitemaps, and application caches on demand.
        </p>
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

      {/* Cache Provider Summary */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Cache Infrastructure Provider</h3>
          <p className="text-xs text-zinc-500 mt-0.5">Next.js On-Demand Revalidation (ISR) & Data Tag Store</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 px-3 py-1.5 rounded-full">
          <CheckCircle2 className="h-4 w-4" />
          <span>Cache Store Active & Healthy</span>
        </div>
      </div>

      {/* Targets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {targets.map((t) => (
          <div
            key={t.key}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 font-semibold">
                  {t.badge}
                </span>
                {lastCleared[t.key] && (
                  <span className="text-[10px] text-zinc-400">Cleared: {lastCleared[t.key]}</span>
                )}
              </div>
              <h4 className="font-bold text-base text-zinc-900 dark:text-zinc-100 mb-1">{t.title}</h4>
              <p className="text-xs text-zinc-500 leading-relaxed mb-4">{t.desc}</p>
            </div>

            <button
              onClick={() => handleClearCache(t.key)}
              disabled={loadingTarget === t.key}
              className={`w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                t.key === "full_app"
                  ? "bg-rose-600 hover:bg-rose-700 text-white"
                  : "bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              }`}
            >
              {loadingTarget === t.key ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              <span>Clear {t.title}</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
