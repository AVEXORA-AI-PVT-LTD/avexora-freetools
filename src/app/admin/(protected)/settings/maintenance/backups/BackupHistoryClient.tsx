"use client";

import React, { useState } from "react";
import Link from "next/link";
import { MaintenanceSubNav } from "@/components/admin/maintenance/MaintenanceSubNav";
import {
  createBackupAction,
  downloadBackupAction,
  deleteBackupAction,
  verifyBackupAction,
} from "../maintenance-actions";
import {
  Database,
  Plus,
  Download,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  FileCheck,
  RotateCcw,
} from "lucide-react";

interface BackupHistoryClientProps {
  initialBackups: any[];
}

export function BackupHistoryClient({ initialBackups }: BackupHistoryClientProps) {
  const [backups, setBackups] = useState<any[]>(initialBackups);
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleCreateBackup = async () => {
    setLoading(true);
    setMessage(null);
    const res = await createBackupAction("MANUAL");
    if (res.success && res.backup) {
      setBackups([res.backup, ...backups]);
      setMessage({ type: "success", text: "Manual backup created successfully!" });
    } else {
      setMessage({ type: "error", text: res.error || "Failed to create backup" });
    }
    setLoading(false);
  };

  const handleVerify = async (id: string) => {
    setActionId(id);
    setMessage(null);
    const res = await verifyBackupAction(id);
    if (res.success && res.result?.verified) {
      setBackups(
        backups.map((b) =>
          b.id === id ? { ...b, verificationStatus: "VERIFIED" } : b
        )
      );
      setMessage({ type: "success", text: `Backup ${id} checksum verified successfully!` });
    } else {
      setMessage({ type: "error", text: res.error || "Checksum verification failed" });
    }
    setActionId(null);
  };

  const handleDownload = async (id: string) => {
    setActionId(id);
    setMessage(null);
    const res = await downloadBackupAction(id);
    if (res.success && res.downloadUrl) {
      window.open(res.downloadUrl, "_blank");
    } else {
      setMessage({ type: "error", text: res.error || "Failed to generate download URL" });
    }
    setActionId(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this backup file? This action is permanent.")) return;
    setActionId(id);
    setMessage(null);
    const res = await deleteBackupAction(id);
    if (res.success) {
      setBackups(backups.filter((b) => b.id !== id));
      setMessage({ type: "success", text: `Backup ${id} deleted.` });
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Database className="h-6 w-6 text-orange-600" />
            Database Backup History
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            View backup snapshots, verify SHA-256 integrity checksums, download backup files, and initiate safe restores.
          </p>
        </div>

        <button
          onClick={handleCreateBackup}
          disabled={loading}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-600 text-white font-semibold text-xs hover:bg-orange-700 transition-colors shadow-xs cursor-pointer disabled:opacity-50 self-start sm:self-center"
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
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Backup Snapshots ({backups.length})
          </span>
        </div>

        {backups.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No database backups created yet. Click "Create Manual Backup" to generate one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold uppercase tracking-wider">
                  <th className="p-3.5">Backup ID</th>
                  <th className="p-3.5">Type</th>
                  <th className="p-3.5">Created At</th>
                  <th className="p-3.5">Size</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {backups.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-3.5 font-mono text-[11px] font-bold text-slate-900">
                      {b.id}
                    </td>
                    <td className="p-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {b.type || "MANUAL"}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-600 font-medium">
                      {new Date(b.createdAt).toLocaleString()}
                    </td>
                    <td className="p-3.5 font-mono text-slate-600">
                      {b.fileSize ? `${(b.fileSize / (1024 * 1024)).toFixed(2)} MB` : "N/A"}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                          b.verificationStatus === "VERIFIED"
                            ? "text-emerald-600"
                            : "text-amber-600"
                        }`}
                      >
                        {b.verificationStatus === "VERIFIED" ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          <AlertTriangle className="h-3 w-3" />
                        )}
                        {b.verificationStatus || "PENDING"}
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-1.5">
                      <button
                        onClick={() => handleVerify(b.id)}
                        disabled={actionId === b.id}
                        title="Verify Integrity Checksum"
                        className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium cursor-pointer"
                      >
                        <FileCheck className="h-3.5 w-3.5 inline" />
                      </button>

                      <button
                        onClick={() => handleDownload(b.id)}
                        disabled={actionId === b.id}
                        title="Download Snapshot File"
                        className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium cursor-pointer"
                      >
                        <Download className="h-3.5 w-3.5 inline" />
                      </button>

                      <Link
                        href={`/admin/settings/maintenance/restore?backupId=${b.id}`}
                        title="Restore Snapshot"
                        className="inline-block px-2 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-medium cursor-pointer"
                      >
                        <RotateCcw className="h-3.5 w-3.5 inline" />
                      </Link>

                      <button
                        onClick={() => handleDelete(b.id)}
                        disabled={actionId === b.id}
                        title="Delete Backup Snapshot"
                        className="px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-medium cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5 inline" />
                      </button>
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
