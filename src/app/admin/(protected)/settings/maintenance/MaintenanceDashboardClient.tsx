"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { MaintenanceSubNav } from "@/components/admin/maintenance/MaintenanceSubNav";
import {
  getMaintenanceSummaryAction,
  createBackupAction,
  clearCacheAction,
  reindexAction,
  rebuildSitemapAction,
  runHealthCheckAction,
} from "./maintenance-actions";
import {
  Activity,
  Database,
  ShieldCheck,
  Zap,
  Search,
  FileSpreadsheet,
  Power,
  RefreshCw,
  HardDrive,
  CheckCircle2,
  Loader2,
  ArrowRight,
} from "lucide-react";

export function MaintenanceDashboardClient() {
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchSummary = async () => {
    setLoading(true);
    const res = await getMaintenanceSummaryAction();
    if (res.success) {
      setSummary(res);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const handleQuickAction = async (actionKey: string, fn: () => Promise<any>) => {
    setActionLoading(actionKey);
    setMessage(null);
    try {
      const res = await fn();
      if (res.success) {
        setMessage({ type: "success", text: `Action '${actionKey}' completed successfully!` });
        await fetchSummary();
      } else {
        setMessage({ type: "error", text: res.error || `Action '${actionKey}' failed` });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "An unexpected error occurred" });
    }
    setActionLoading(null);
  };

  return (
    <div className="space-y-6">
      {/* Sub Navigation */}
      <MaintenanceSubNav />

      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-orange-600" />
            Backup & Maintenance Center
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Monitor system health, manage automated database backups, clear application cache, and toggle maintenance mode.
          </p>
        </div>

        <button
          onClick={fetchSummary}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition-colors self-start sm:self-center cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Overview</span>
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

      {loading ? (
        <div className="flex items-center justify-center p-12 bg-white border border-slate-200 rounded-2xl">
          <Loader2 className="h-6 w-6 animate-spin text-orange-600 mr-2" />
          <span className="text-sm text-slate-600 font-medium">Loading system maintenance diagnostics...</span>
        </div>
      ) : (
        <>
          {/* System Status Grid */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
              <Activity className="h-4 w-4 text-orange-600" /> System Status Overview
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { label: "Database", status: summary?.health?.components?.database?.status || "Healthy", icon: Database },
                { label: "Storage", status: summary?.health?.components?.storage?.status || "Healthy", icon: HardDrive },
                { label: "Application", status: "Healthy", icon: ShieldCheck },
                { label: "Cache", status: summary?.health?.components?.cache?.status || "Healthy", icon: Zap },
                { label: "Search Index", status: summary?.health?.components?.searchIndex?.status || "Healthy", icon: Search },
                { label: "Sitemap", status: summary?.health?.components?.sitemap?.status || "Healthy", icon: FileSpreadsheet },
              ].map((item, i) => {
                const Icon = item.icon;
                const isHealthy = item.status === "Healthy";
                return (
                  <div
                    key={i}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col items-start"
                  >
                    <Icon className="h-4 w-4 text-slate-400 mb-2" />
                    <span className="text-xs font-semibold text-slate-600">{item.label}</span>
                    <span
                      className={`text-xs font-bold mt-1 inline-flex items-center gap-1 ${
                        isHealthy ? "text-emerald-600" : "text-amber-600"
                      }`}
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      {item.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Latest Backup Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                    <Database className="h-4 w-4 text-orange-600" /> Latest Database Backup
                  </h3>
                  <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-semibold">
                    Total: {summary?.backupsCount || 0}
                  </span>
                </div>

                {summary?.latestBackup ? (
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">Backup ID:</span>
                      <span className="font-mono text-xs font-semibold text-slate-900">{summary.latestBackup.id}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">Created At:</span>
                      <span className="font-semibold text-slate-900">
                        {new Date(summary.latestBackup.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">File Size:</span>
                      <span className="font-semibold text-slate-900">
                        {summary.latestBackup.fileSize
                          ? `${(summary.latestBackup.fileSize / (1024 * 1024)).toFixed(2)} MB`
                          : "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-500">Checksum Status:</span>
                      <span className="font-semibold text-emerald-600">
                        {summary.latestBackup.verificationStatus || "VERIFIED"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 py-4">No completed backups found.</p>
                )}
              </div>

              <Link
                href="/admin/settings/maintenance/backups"
                className="mt-4 text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1"
              >
                <span>View All Backups History</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Maintenance Mode Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                    <Power className="h-4 w-4 text-orange-600" /> Maintenance Mode Status
                  </h3>
                  <span
                    className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                      summary?.maintenanceMode?.enabled
                        ? "bg-rose-100 text-rose-800"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {summary?.maintenanceMode?.enabled ? "ACTIVE" : "INACTIVE"}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Status:</span>
                    <span className="font-semibold text-slate-900">
                      {summary?.maintenanceMode?.enabled
                        ? "Public Access Blocked"
                        : "Public Website Live"}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Estimated Duration:</span>
                    <span className="font-semibold text-slate-900">
                      {summary?.maintenanceMode?.estimatedDuration || "30 minutes"}
                    </span>
                  </div>
                  <div className="py-1.5">
                    <span className="text-slate-500 block mb-1">Visitor Message:</span>
                    <p className="text-xs italic bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-slate-700">
                      "{summary?.maintenanceMode?.message}"
                    </p>
                  </div>
                </div>
              </div>

              <Link
                href="/admin/settings/maintenance/mode"
                className="mt-4 text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1"
              >
                <span>Manage Maintenance Mode Settings</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Quick Actions Grid */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
              Quick Maintenance Actions
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Quick Action 1: Create Backup */}
              <button
                onClick={() => handleQuickAction("Create Backup", () => createBackupAction("MANUAL"))}
                disabled={Boolean(actionLoading)}
                className="p-4 rounded-xl border border-slate-200 hover:border-orange-300 text-left transition-all hover:shadow-xs cursor-pointer flex items-center gap-3 bg-slate-50/50"
              >
                <div className="p-2.5 rounded-lg bg-orange-100 text-orange-700 shrink-0">
                  {actionLoading === "Create Backup" ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Database className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900">Create Backup</h4>
                  <p className="text-[11px] text-slate-500">Export database snapshot</p>
                </div>
              </button>

              {/* Quick Action 2: Clear Cache */}
              <button
                onClick={() => handleQuickAction("Clear Cache", () => clearCacheAction("full_app"))}
                disabled={Boolean(actionLoading)}
                className="p-4 rounded-xl border border-slate-200 hover:border-orange-300 text-left transition-all hover:shadow-xs cursor-pointer flex items-center gap-3 bg-slate-50/50"
              >
                <div className="p-2.5 rounded-lg bg-amber-100 text-amber-700 shrink-0">
                  {actionLoading === "Clear Cache" ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Zap className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900">Clear Cache</h4>
                  <p className="text-[11px] text-slate-500">Invalidate app cache</p>
                </div>
              </button>

              {/* Quick Action 3: Re-index */}
              <button
                onClick={() => handleQuickAction("Re-index", reindexAction)}
                disabled={Boolean(actionLoading)}
                className="p-4 rounded-xl border border-slate-200 hover:border-orange-300 text-left transition-all hover:shadow-xs cursor-pointer flex items-center gap-3 bg-slate-50/50"
              >
                <div className="p-2.5 rounded-lg bg-blue-100 text-blue-700 shrink-0">
                  {actionLoading === "Re-index" ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Search className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900">Re-index Data</h4>
                  <p className="text-[11px] text-slate-500">Rebuild collection indexes</p>
                </div>
              </button>

              {/* Quick Action 4: Rebuild Sitemap */}
              <button
                onClick={() => handleQuickAction("Rebuild Sitemap", rebuildSitemapAction)}
                disabled={Boolean(actionLoading)}
                className="p-4 rounded-xl border border-slate-200 hover:border-orange-300 text-left transition-all hover:shadow-xs cursor-pointer flex items-center gap-3 bg-slate-50/50"
              >
                <div className="p-2.5 rounded-lg bg-emerald-100 text-emerald-700 shrink-0">
                  {actionLoading === "Rebuild Sitemap" ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900">Rebuild Sitemap</h4>
                  <p className="text-[11px] text-slate-500">Generate XML sitemap</p>
                </div>
              </button>

              {/* Quick Action 5: System Health */}
              <button
                onClick={() => handleQuickAction("System Health", runHealthCheckAction)}
                disabled={Boolean(actionLoading)}
                className="p-4 rounded-xl border border-slate-200 hover:border-orange-300 text-left transition-all hover:shadow-xs cursor-pointer flex items-center gap-3 bg-slate-50/50"
              >
                <div className="p-2.5 rounded-lg bg-purple-100 text-purple-700 shrink-0">
                  {actionLoading === "System Health" ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Activity className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900">Health Check</h4>
                  <p className="text-[11px] text-slate-500">Test latency & connections</p>
                </div>
              </button>

              {/* Quick Action 6: Manage Maintenance Mode */}
              <Link
                href="/admin/settings/maintenance/mode"
                className="p-4 rounded-xl border border-slate-200 hover:border-orange-300 text-left transition-all hover:shadow-xs cursor-pointer flex items-center gap-3 bg-slate-50/50"
              >
                <div className="p-2.5 rounded-lg bg-rose-100 text-rose-700 shrink-0">
                  <Power className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900">Maintenance Mode</h4>
                  <p className="text-[11px] text-slate-500">Toggle public site access</p>
                </div>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
