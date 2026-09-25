"use client";

import React, { useState } from "react";
import { MaintenanceSubNav } from "@/components/admin/maintenance/MaintenanceSubNav";
import { reindexAction } from "../maintenance-actions";
import { Search, RefreshCw, CheckCircle2, Loader2, Database, Layers } from "lucide-react";

export function ReindexManagementClient({ initialCounts }: { initialCounts: Record<string, number> }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleReindex = async () => {
    setLoading(true);
    setMessage(null);

    const res = await reindexAction();
    if (res.success && res.result) {
      setResult(res.result);
      setMessage({ type: "success", text: "Database collections successfully verified and re-indexed!" });
    } else {
      setMessage({ type: "error", text: res.error || "Re-index operation failed" });
    }

    setLoading(false);
  };

  const collections = [
    { name: "ToolConfig", desc: "Online tools catalog & metadata index", count: initialCounts.tools || 0 },
    { name: "CategoryConfig", desc: "Tool categories & hierarchy index", count: initialCounts.categories || 0 },
    { name: "User", desc: "Registered user profiles & roles index", count: initialCounts.users || 0 },
    { name: "ContentItem", desc: "CMS blog posts & pages index", count: initialCounts.content || 0 },
    { name: "AuditLog", desc: "Security event trail index", count: initialCounts.auditLogs || 0 },
    { name: "ErrorLog", desc: "Runtime error diagnostic index", count: initialCounts.errorLogs || 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Sub Navigation */}
      <MaintenanceSubNav />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Search className="h-6 w-6 text-blue-600" />
            Database & Search Collection Re-index
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Refresh and verify database index health across primary collections without dropping production data.
          </p>
        </div>

        <button
          onClick={handleReindex}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 transition-colors shadow-sm cursor-pointer disabled:opacity-50 self-start sm:self-center"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          <span>Rebuild Database Indexes</span>
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

      {/* Collections Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {collections.map((c) => (
          <div
            key={c.name}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100">
                  {c.name}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  INDEX HEALTHY
                </span>
              </div>
              <p className="text-xs text-zinc-500 mb-4">{c.desc}</p>
            </div>

            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs">
              <span className="text-zinc-400">Indexed Documents:</span>
              <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">
                {c.count.toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Re-index Execution Result Card */}
      {result && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Latest Re-index Operation Summary
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
              <span className="text-zinc-400 block">Re-indexed At:</span>
              <span className="font-semibold">{new Date(result.reindexedAt).toLocaleString()}</span>
            </div>
            <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
              <span className="text-zinc-400 block">Execution Time:</span>
              <span className="font-semibold">{result.durationMs} ms</span>
            </div>
            <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
              <span className="text-zinc-400 block">Collections Verified:</span>
              <span className="font-semibold">{result.collections.length}</span>
            </div>
            <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
              <span className="text-zinc-400 block">Status:</span>
              <span className="font-semibold text-emerald-600">COMPLETED</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
