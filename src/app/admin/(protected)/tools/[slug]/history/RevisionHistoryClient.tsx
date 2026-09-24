"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Clock, Eye, GitCompare, RotateCcw } from "lucide-react";
import { useDialog } from "@/components/admin/DialogProvider";
import { restoreToolRevision } from "./history-actions";
import { ObjectDiff } from "./ObjectDiff";
import type { Prisma } from "@prisma/client";

type Revision = {
  id: string;
  version: string;
  changelog: string | null;
  revisionType: string;
  isPublished: boolean;
  createdAt: string;
  createdByName: string;
  snapshot: Prisma.JsonValue;
};

export function RevisionHistoryClient({
  toolName,
  toolSlug,
  currentVersion,
  revisions,
}: {
  toolName: string;
  toolSlug: string;
  currentVersion: string;
  revisions: Revision[];
}) {
  const { showConfirm, showAlert } = useDialog();
  const [isRestoring, setIsRestoring] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedRev1, setSelectedRev1] = useState<Revision | null>(null);
  const [selectedRev2, setSelectedRev2] = useState<Revision | null>(null);

  const handleRestore = (rev: Revision) => {
    showConfirm(
      "Restore Version",
      `Are you sure you want to restore ${toolName} to version ${rev.version}? The current configuration will be replaced, and a new revision will be created. Your existing history will NOT be deleted.`,
      async () => {
        setIsRestoring(true);
        try {
          const res = await restoreToolRevision(rev.id);
          if (res.success) {
            showAlert("Success", `Tool restored to version ${rev.version} successfully!`);
            window.location.reload();
          } else {
            showAlert("Error", res.error || "Failed to restore.");
          }
        } catch (e) {
          showAlert("Error", (e instanceof Error ? e.message : String(e)) || "Failed to restore.");
        } finally {
          setIsRestoring(false);
        }
      }
    );
  };

  if (compareMode && selectedRev1 && selectedRev2) {
    // Determine which is older (based on createdAt)
    const d1 = new Date(selectedRev1.createdAt).getTime();
    const d2 = new Date(selectedRev2.createdAt).getTime();
    const older = d1 < d2 ? selectedRev1 : selectedRev2;
    const newer = d1 < d2 ? selectedRev2 : selectedRev1;

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center gap-4">
            <button onClick={() => setCompareMode(false)} className="text-slate-500 hover:text-slate-800 p-2 border rounded-md">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Compare Revisions</h1>
              <p className="text-sm text-slate-500">Comparing {older.version} vs {newer.version}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 overflow-auto">
          <div className="grid grid-cols-2 gap-8 mb-6 border-b pb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Older: v{older.version}</h3>
              <p className="text-sm text-slate-500">{new Date(older.createdAt).toLocaleString()}</p>
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Newer: v{newer.version}</h3>
              <p className="text-sm text-slate-500">{new Date(newer.createdAt).toLocaleString()}</p>
            </div>
          </div>
          
          <ObjectDiff oldObj={older.snapshot} newObj={newer.snapshot} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200">
        <div className="flex items-center gap-4">
          <Link href={`/admin/tools/${toolSlug}`} className="text-slate-500 hover:text-slate-800 p-2 border rounded-md">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{toolName} - Revision History</h1>
            <p className="text-sm text-slate-500">Current active version: <span className="font-bold">{currentVersion}</span></p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Version</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Change / Notes</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date & User</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {revisions.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">No revisions found for this tool.</td>
              </tr>
            ) : revisions.map((rev) => (
              <tr key={rev.id} className="hover:bg-slate-50">
                <td className="px-6 py-4">
                  <div className="font-bold text-slate-900">v{rev.version}</div>
                  {rev.version === currentVersion && (
                    <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 mt-1">Current</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-slate-800 max-w-md truncate">{rev.changelog || "No changelog provided"}</div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                    {rev.revisionType}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-slate-900">{new Date(rev.createdAt).toLocaleString()}</div>
                  <div className="text-xs text-slate-500">by {rev.createdByName}</div>
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button 
                    onClick={() => {
                      if (!selectedRev1) setSelectedRev1(rev);
                      else if (!selectedRev2) {
                        setSelectedRev2(rev);
                        setCompareMode(true);
                      }
                    }}
                    className={`inline-flex items-center justify-center p-1.5 rounded-md border text-sm font-medium transition-colors ${
                      (selectedRev1?.id === rev.id || selectedRev2?.id === rev.id) 
                      ? "bg-blue-50 border-blue-200 text-blue-700" 
                      : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                    }`}
                    title="Select for Compare"
                  >
                    <GitCompare className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleRestore(rev)}
                    disabled={isRestoring || rev.version === currentVersion}
                    className="inline-flex items-center justify-center p-1.5 bg-white border border-slate-300 text-orange-600 rounded-md hover:bg-orange-50 disabled:opacity-50"
                    title="Restore"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {selectedRev1 && !compareMode && (
        <div className="fixed bottom-4 right-4 bg-slate-800 text-white p-4 rounded-lg shadow-xl flex items-center gap-4 animate-in slide-in-from-bottom">
          <div>
            <p className="font-medium text-sm">Compare Mode</p>
            <p className="text-xs text-slate-300">Select another revision to compare.</p>
          </div>
          <button onClick={() => setSelectedRev1(null)} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-xs font-medium">Cancel</button>
        </div>
      )}
    </div>
  );
}
