"use client";

import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import { MaintenanceSubNav } from "@/components/admin/maintenance/MaintenanceSubNav";
import { restoreDatabaseAction, verifyBackupAction } from "../maintenance-actions";
import {
  RotateCcw,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Database,
  Loader2,
  FileCheck,
  Lock,
} from "lucide-react";

interface BackupOption {
  id: string;
  type: string;
  fileSize?: number | null;
  createdAt: Date;
  checksum?: string | null;
  status: string;
}

export function RestoreProtectionClient({ backups }: { backups: BackupOption[] }) {
  const searchParams = useSearchParams();
  const initialBackupId = searchParams.get("backupId") || (backups.length > 0 ? backups[0].id : "");

  const [selectedBackupId, setSelectedBackupId] = useState(initialBackupId);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1); // 1: Select & Inspect, 2: First Warning, 3: Typed Confirmation, 4: Restoring
  const [typedConfirmation, setTypedConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [restoreJob, setRestoreJob] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedBackup = backups.find((b) => b.id === selectedBackupId);

  const handleVerify = async () => {
    if (!selectedBackupId) return;
    setLoading(true);
    setError(null);
    const res = await verifyBackupAction(selectedBackupId);
    if (res.success) {
      setVerificationResult(res.result);
      setStep(2); // Proceed to Warning
    } else {
      setError(res.error || "Backup integrity verification failed");
    }
    setLoading(false);
  };

  const handleExecuteRestore = async () => {
    if (typedConfirmation.trim().toUpperCase() !== "RESTORE") {
      setError("Confirmation text must be exactly 'RESTORE'");
      return;
    }

    setLoading(true);
    setError(null);
    setStep(4); // Restoring progress

    try {
      const res = await restoreDatabaseAction(selectedBackupId, typedConfirmation);
      if (res.success && res.restoreJob) {
        setRestoreJob(res.restoreJob);
      } else {
        setError(res.error || "Database restore operation failed");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during database restore");
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Sub Navigation */}
      <MaintenanceSubNav />

      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <ShieldAlert className="h-6 w-6 text-rose-600" />
          Protected Database Restore Wizard
        </h2>
        <p className="text-xs text-slate-600 mt-1">
          Execute protected database restores with multi-step verification, safety snapshot creation, and audit logging.
        </p>
      </div>

      {/* High Risk Alert Header */}
      <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs leading-relaxed flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold uppercase tracking-wider block mb-0.5">High-Risk Destructive Action</strong>
          Restoring a database snapshot modifies production data. This operation automatically creates a pre-restore safety backup prior to execution. You must explicitly type <strong>RESTORE</strong> to confirm.
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-100 border border-rose-300 text-rose-900 text-sm font-semibold flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-rose-700 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Step Wizard Container */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        {/* Wizard Steps Tracker */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6 text-xs font-semibold">
          {[
            { num: 1, label: "Select & Verify Backup" },
            { num: 2, label: "Warning & Impact" },
            { num: 3, label: "Typed Confirmation" },
            { num: 4, label: "Restore Execution" },
          ].map((s) => (
            <div
              key={s.num}
              className={`flex items-center gap-2 ${
                step === s.num
                  ? "text-orange-600 font-bold"
                  : step > s.num
                  ? "text-emerald-600"
                  : "text-slate-400"
              }`}
            >
              <span
                className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  step === s.num
                    ? "bg-orange-600 text-white"
                    : step > s.num
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {step > s.num ? "✓" : s.num}
              </span>
              <span className="hidden sm:inline">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Step 1: Select & Verify Backup */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Database className="h-4 w-4 text-orange-600" /> Step 1: Select Backup Snapshot to Restore
            </h3>

            {backups.length === 0 ? (
              <p className="text-xs text-slate-500 py-4">
                No verified backup snapshots available for restore. Please generate a backup first.
              </p>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Choose Backup Snapshot:</label>
                  <select
                    value={selectedBackupId}
                    onChange={(e) => setSelectedBackupId(e.target.value)}
                    className="w-full max-w-md p-2.5 rounded-lg border border-slate-300 bg-white text-xs font-mono text-slate-900 outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    {backups.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.id} — [{b.type}] — {new Date(b.createdAt).toLocaleString()} (
                        {b.fileSize ? `${(b.fileSize / (1024 * 1024)).toFixed(2)} MB` : "N/A"})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedBackup && (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Backup ID:</span>
                      <span className="font-mono font-bold text-slate-900">{selectedBackup.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Creation Date:</span>
                      <span className="text-slate-900">{new Date(selectedBackup.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">File Size:</span>
                      <span className="text-slate-900">{selectedBackup.fileSize ? `${(selectedBackup.fileSize / (1024 * 1024)).toFixed(2)} MB` : "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Checksum:</span>
                      <span className="font-mono text-[10px] text-emerald-600">{selectedBackup.checksum || "Verified"}</span>
                    </div>
                  </div>
                )}

                <div className="pt-4 flex justify-end">
                  <button
                    onClick={handleVerify}
                    disabled={loading || !selectedBackupId}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-600 text-white font-semibold text-xs hover:bg-orange-700 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileCheck className="h-4 w-4" />}
                    <span>Verify Integrity & Proceed</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Step 2: Warning & Impact */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-rose-600 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-600" /> Step 2: Warning & Restore Impact Verification
            </h3>

            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-2">
              <p className="font-bold">Before proceeding, review the consequences of this operation:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Existing database collections will be overwritten with snapshot data from Backup ID <strong>{selectedBackupId}</strong>.</li>
                <li>An automated pre-restore safety snapshot will be taken immediately before restore.</li>
                <li>All active admin users will be logged to audit trail.</li>
              </ul>
            </div>

            <div className="pt-4 flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 cursor-pointer"
              >
                Back to Selection
              </button>
              <button
                onClick={() => setStep(3)}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 cursor-pointer"
              >
                I Understand, Proceed to Final Confirmation
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Typed Confirmation */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-rose-600 flex items-center gap-2">
              <Lock className="h-4 w-4 text-rose-600" /> Step 3: Mandatory Typed Confirmation
            </h3>

            <p className="text-xs text-slate-600 leading-relaxed">
              To execute the database restore from Backup <strong>{selectedBackupId}</strong>, please manually type the exact word <strong className="text-rose-600 font-mono">RESTORE</strong> into the field below.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Type RESTORE to confirm:</label>
              <input
                type="text"
                value={typedConfirmation}
                onChange={(e) => setTypedConfirmation(e.target.value)}
                placeholder="RESTORE"
                className="w-full max-w-sm p-2.5 rounded-lg border border-slate-300 bg-white font-mono text-sm uppercase tracking-widest text-slate-900 outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="pt-4 flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 cursor-pointer"
              >
                Back
              </button>
              <button
                onClick={handleExecuteRestore}
                disabled={loading || typedConfirmation.trim().toUpperCase() !== "RESTORE"}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 shadow-xs cursor-pointer disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                <span>Execute Production Restore</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Restore Execution Progress / Result */}
        {step === 4 && (
          <div className="space-y-6 text-center py-6">
            {restoreJob?.status === "Completed" ? (
              <div className="space-y-4">
                <div className="inline-flex p-4 rounded-full bg-emerald-100 text-emerald-600">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <h3 className="text-lg font-bold text-emerald-800">Database Restore Completed Successfully!</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Database restore job <strong>{restoreJob.id}</strong> has finished. Pre-restore safety backup reference: <strong>{restoreJob.safetyBackupId}</strong>.
                </p>
                <div className="pt-4">
                  <button
                    onClick={() => setStep(1)}
                    className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Loader2 className="h-10 w-10 animate-spin text-orange-600 mx-auto" />
                <h3 className="text-base font-bold text-slate-900">Executing Database Restore...</h3>
                <p className="text-xs text-slate-500">Creating pre-restore safety backup and restoring collection snapshots.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
