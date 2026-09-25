"use client";

import React, { useState } from "react";
import Link from "next/link";
import { MaintenanceSubNav } from "@/components/admin/maintenance/MaintenanceSubNav";
import {
  createBackupAction,
  verifyBackupAction,
  deleteBackupAction,
} from "../maintenance-actions";
import {
  Database,
  Plus,
  ShieldCheck,
  Download,
  RotateCcw,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
} from "lucide-react";

interface BackupRecord {
  id: string;
  type: string;
  status: string;
  storageReference?: string | null;
  fileSize?: number | null;
  checksum?: string | null;
  createdByEmail?: string | null;
  createdAt: Date;
  completedAt?: Date | null;
  expiresAt?: Date | null;
  verificationStatus?: string | null;
  errorMessage?: string | null;
}

export function BackupHistoryClient({ initialBackups }: { initialBackups: BackupRecord[] }) {
  const [backups, setBackups] = useState<BackupRecord[]>(initialBackups);
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleCreateBackup = async () => {
    setLoading(true);
    setMessage(null);
    const res = await createBackupAction("MANUAL");
    if (res.success && res.backup) {
      setBackups([res.backup as any, ...backups]);
      setMessage({ type: "success", text: "Database backup created successfully!" });
    } else {
      setMessage({ type: "error", text: res.error || "Failed to create backup" });
    }
    setLoading(false);
  };

  const handleVerify = async (id: string) => {
    setActionId(id);
    setMessage(null);
    const res = await verifyBackupAction(id);
    if (res.success && res.result?.backup) {
      setBackups(backups.map((b) => (b.id === id ? (res.result.backup as any) : b)));
      setMessage({ type: "success", text: `Backup ${id} integrity verified successfully!` });
    } else {
      setMessage({ type: "error", text: res.error || res.result?.reason || "Verification failed" });
    }
    setActionId(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this backup file?")) return;
    setActionId(id);
    setMessage(null);
    const res = await deleteBackupAction(id);
    if (res.success) {
      setBackups(backups.map((b) => (b.id === id ? { ...b, status: "Deleted" } : b)));
      setMessage({ type: "success", text: `Backup ${id} deleted successfully` });
    } else {
      setMessage({ type: "error", text: res.error || "Failed to delete backup" });
    }
    setActionId(null);
  };

  return (
    <div className="space-y-6">
      {/* Sub Navigation */}
      <MaintenanceSubNav />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Database className="h-6 w-6 text-orange-600" />
            Database Backup History
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            View backup snapshots, verify SHA-256 integrity checksums, download backup files, and initiate safe restores.
          </p>
        </div>

        <button
          onClick={handleCreateBackup}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 text-white font-semibold text-xs hover:bg-orange-700 transition-colors shadow-sm cursor-pointer disabled:opacity-50 self-start sm:self-center"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          <span>Create Manual Backup</span>
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

      {/* Table Card */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
            Backup Snapshots ({backups.length})
          </span>
          <span className="text-xs text-zinc-400">30-Day Retention Policy</span>
        </div>

        {backups.length === 0 ? (
          <div className="p-12 text-center text-zinc-500">
            <Database className="h-10 w-10 text-zinc-300 mx-auto mb-3" />
            <p className="text-sm font-semibold">No backup snapshots found.</p>
            <p className="text-xs text-zinc-400 mt-1">Click 'Create Manual Backup' to generate your first backup.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 border-b border-zinc-200 dark:border-zinc-800 font-semibold uppercase tracking-wider">
                  <th className="p-3.5">Backup ID</th>
                  <th className="p-3.5">Type</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">File Size</th>
                  <th className="p-3.5">Integrity Checksum</th>
                  <th className="p-3.5">Created By</th>
                  <th className="p-3.5">Created At</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300">
                {backups.map((b) => (
                  <tr key={b.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors">
                    <td className="p-3.5 font-mono text-[11px] font-bold text-zinc-900 dark:text-zinc-100">
                      {b.id}
                    </td>
                    <td className="p-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700">
                        {b.type}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                          b.status === "Completed"
                            ? "bg-emerald-100 text-emerald-800"
                            : b.status === "Failed"
                            ? "bg-rose-100 text-rose-800"
                            : b.status === "Deleted"
                            ? "bg-zinc-100 text-zinc-500 line-through"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {b.status === "Completed" && <CheckCircle2 className="h-3 w-3" />}
                        {b.status}
                      </span>
                    </td>
                    <td className="p-3.5 font-medium">
                      {b.fileSize ? `${(b.fileSize / (1024 * 1024)).toFixed(2)} MB` : "N/A"}
                    </td>
                    <td className="p-3.5">
                      {b.checksum ? (
                        <div className="flex items-center gap-1.5" title={b.checksum}>
                          <FileCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          <span className="font-mono text-[10px] text-zinc-500 truncate max-w-[120px]">
                            {b.checksum.substring(0, 12)}...
                          </span>
                        </div>
                      ) : (
                        <span className="text-zinc-400">UNVERIFIED</span>
                      )}
                    </td>
                    <td className="p-3.5 text-zinc-500">{b.createdByEmail || "System Admin"}</td>
                    <td className="p-3.5 text-zinc-500">{new Date(b.createdAt).toLocaleString()}</td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Verify Button */}
                        {b.status === "Completed" && (
                          <button
                            onClick={() => handleVerify(b.id)}
                            disabled={actionId === b.id}
                            className="p-1.5 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-medium transition-colors cursor-pointer"
                            title="Verify Checksum Integrity"
                          >
                            {actionId === b.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <ShieldCheck className="h-3.5 w-3.5" />
                            )}
                          </button>
                        )}

                        {/* Download Button */}
                        {b.status === "Completed" && (
                          <a
                            href={`/api/admin/maintenance/backups/download/${b.id}`}
                            className="p-1.5 rounded bg-orange-50 hover:bg-orange-100 text-orange-700 font-medium transition-colors cursor-pointer"
                            title="Download Backup File"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </a>
                        )}

                        {/* Restore Link */}
                        {b.status === "Completed" && (
                          <Link
                            href={`/admin/settings/maintenance/restore?backupId=${b.id}`}
                            className="p-1.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium transition-colors cursor-pointer"
                            title="Initiate Restore Wizard"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                          </Link>
                        )}

                        {/* Delete Button */}
                        {b.status !== "Deleted" && (
                          <button
                            onClick={() => handleDelete(b.id)}
                            disabled={actionId === b.id}
                            className="p-1.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 font-medium transition-colors cursor-pointer"
                            title="Delete Backup Snapshot"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
