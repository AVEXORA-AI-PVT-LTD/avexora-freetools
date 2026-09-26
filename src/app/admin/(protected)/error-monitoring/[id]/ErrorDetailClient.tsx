"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  updateErrorStatusAction,
  assignErrorAction,
  addErrorInternalNoteAction,
  deleteErrorAction,
  getErrorByIdAction,
} from "../error-actions";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Ban,
  Trash2,
  User,
  Wrench,
  Server,
  Code,
  Copy,
  Check,
  Send,
  ShieldAlert,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface Props {
  data: NonNullable<Awaited<ReturnType<typeof getErrorByIdAction>>>;
}

export function ErrorDetailClient({ data: initialData }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [data, setData] = useState(initialData);
  const { errorLog, userContext, toolContext, assignedAdmin, resolverAdmin, admins } = data;

  const [status, setStatus] = useState(errorLog.status);
  const [assignedAdminId, setAssignedAdminId] = useState(errorLog.assignedAdminId || "");
  const [resolutionNote, setResolutionNote] = useState(errorLog.resolutionNote || "");
  const [showResolutionModal, setShowResolutionModal] = useState(false);

  const [newNote, setNewNote] = useState("");
  const [copiedId, setCopiedId] = useState(false);
  const [copiedReqId, setCopiedReqId] = useState(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(true);

  // Copy helper
  const handleCopy = (text: string, type: "id" | "req") => {
    navigator.clipboard.writeText(text);
    if (type === "id") {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } else {
      setCopiedReqId(true);
      setTimeout(() => setCopiedReqId(false), 2000);
    }
  };

  // Update Status
  const handleStatusChange = (newSt: string) => {
    if (newSt === "Resolved") {
      setShowResolutionModal(true);
      return;
    }

    startTransition(async () => {
      const res = await updateErrorStatusAction(errorLog.id, newSt);
      if (res.success) {
        setStatus(newSt);
        const updated = await getErrorByIdAction(errorLog.id);
        if (updated) setData(updated);
      } else {
        alert(res.error || "Failed to update status");
      }
    });
  };

  // Submit Resolution
  const handleConfirmResolve = async () => {
    startTransition(async () => {
      const res = await updateErrorStatusAction(errorLog.id, "Resolved", resolutionNote);
      if (res.success) {
        setStatus("Resolved");
        setShowResolutionModal(false);
        const updated = await getErrorByIdAction(errorLog.id);
        if (updated) setData(updated);
      } else {
        alert(res.error || "Failed to resolve error");
      }
    });
  };

  // Assign Admin
  const handleAssignAdmin = (adminId: string) => {
    startTransition(async () => {
      const res = await assignErrorAction(errorLog.id, adminId || null);
      if (res.success) {
        setAssignedAdminId(adminId);
        const updated = await getErrorByIdAction(errorLog.id);
        if (updated) setData(updated);
      } else {
        alert(res.error || "Failed to assign error");
      }
    });
  };

  // Add Internal Note
  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    startTransition(async () => {
      const res = await addErrorInternalNoteAction(errorLog.id, newNote);
      if (res.success) {
        setNewNote("");
        const updated = await getErrorByIdAction(errorLog.id);
        if (updated) setData(updated);
      } else {
        alert(res.error || "Failed to add note");
      }
    });
  };

  // Delete Error Log
  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete error ${errorLog.errorId}? This action cannot be undone.`)) {
      return;
    }

    startTransition(async () => {
      const res = await deleteErrorAction(errorLog.id);
      if (res.success) {
        router.push("/admin/error-monitoring");
      } else {
        alert(res.error || "Failed to delete error");
      }
    });
  };

  const internalNotes = (errorLog.internalNotes as Array<any>) || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Back Nav */}
      <div>
        <Link
          href="/admin/error-monitoring"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Error Monitoring
        </Link>
      </div>

      {/* Header Card */}
      <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="font-mono text-lg font-bold text-slate-900">{errorLog.errorId}</span>
              <button
                onClick={() => handleCopy(errorLog.errorId, "id")}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                title="Copy Error ID"
              >
                {copiedId ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>

              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                  errorLog.severity === "Critical"
                    ? "bg-red-50 text-red-700 border-red-200"
                    : errorLog.severity === "High"
                    ? "bg-orange-50 text-orange-700 border-orange-200"
                    : errorLog.severity === "Medium"
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-blue-50 text-blue-700 border-blue-200"
                }`}
              >
                {errorLog.severity} Severity
              </span>

              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                {errorLog.environment}
              </span>

              {errorLog.occurrences > 1 && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                  {errorLog.occurrences} Occurrences
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500">
              First seen: {new Date(errorLog.firstSeenAt).toLocaleString()} • Last seen:{" "}
              {new Date(errorLog.lastSeenAt).toLocaleString()}
            </p>
          </div>

          {/* Actions Toolbar */}
          <div className="flex items-center gap-3 self-start md:self-auto">
            {/* Status Selector */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-slate-500">Status:</label>
              <select
                value={status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={isPending}
                className="py-1.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="Open">Open</option>
                <option value="Investigating">Investigating</option>
                <option value="Resolved">Resolved</option>
                <option value="Ignored">Ignored</option>
              </select>
            </div>

            {/* Assignee Selector */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-slate-500">Assign:</label>
              <select
                value={assignedAdminId}
                onChange={(e) => handleAssignAdmin(e.target.value)}
                disabled={isPending}
                className="py-1.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500 max-w-[150px]"
              >
                <option value="">Unassigned</option>
                {admins.map((adm) => (
                  <option key={adm.id} value={adm.id}>
                    {adm.name || adm.email}
                  </option>
                ))}
              </select>
            </div>

            {/* Delete button */}
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete Error Record"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Primary Error Message Banner */}
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-800 uppercase tracking-wider">
              {errorLog.errorType} {errorLog.errorCode ? `• ${errorLog.errorCode}` : ""}
            </span>
            {errorLog.requestId && (
              <div className="flex items-center gap-1.5 text-xs text-rose-700 font-mono">
                <span>Req ID: {errorLog.requestId}</span>
                <button
                  onClick={() => handleCopy(errorLog.requestId!, "req")}
                  className="p-0.5 hover:text-rose-900"
                >
                  {copiedReqId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}
          </div>
          <p className="text-sm font-semibold text-rose-950 font-mono break-words">{errorLog.message}</p>
        </div>
      </div>

      {/* Main Grid: Info + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Details, Stack trace, Notes) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Technical Details Section */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <button
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
              className="w-full p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-slate-600" />
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                  Technical Diagnostics & Stack Trace
                </h2>
              </div>
              {showTechnicalDetails ? (
                <ChevronUp className="w-4 h-4 text-slate-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-500" />
              )}
            </button>

            {showTechnicalDetails && (
              <div className="p-5 space-y-5">
                {/* Meta details grid */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block font-medium">Endpoint / Route</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {errorLog.method || "GET"} {errorLog.endpoint || "N/A"}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-medium">Fingerprint Hash</span>
                    <span className="font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                      {errorLog.fingerprint || "N/A"}
                    </span>
                  </div>
                </div>

                {/* Stack Trace Box */}
                {errorLog.stackTrace ? (
                  <div>
                    <span className="text-xs font-semibold text-slate-700 block mb-2">Stack Trace</span>
                    <pre className="p-4 bg-slate-950 text-emerald-400 text-xs font-mono rounded-xl overflow-x-auto max-h-96 leading-relaxed select-all">
                      {errorLog.stackTrace}
                    </pre>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-xs text-slate-400 text-center">
                    No stack trace captured for this error.
                  </div>
                )}

                {/* Metadata JSON Box */}
                {errorLog.metadata && (
                  <div>
                    <span className="text-xs font-semibold text-slate-700 block mb-2">
                      Sanitized Context & Headers
                    </span>
                    <pre className="p-4 bg-slate-900 text-slate-200 text-xs font-mono rounded-xl overflow-x-auto max-h-64">
                      {JSON.stringify(errorLog.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Internal Investigation Notes */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-orange-600" />
              Internal Admin Investigation Notes
            </h2>

            {/* Notes List */}
            <div className="space-y-3">
              {internalNotes.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No investigation notes added yet.</p>
              ) : (
                internalNotes.map((n: any) => (
                  <div key={n.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between text-slate-500">
                      <span className="font-semibold text-slate-800">{n.authorName}</span>
                      <span>
                        {new Date(n.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{n.note}</p>
                  </div>
                ))
              )}
            </div>

            {/* Add Note Form */}
            <form onSubmit={handleAddNote} className="space-y-2 pt-2 border-t border-slate-100">
              <textarea
                rows={2}
                placeholder="Add an internal note or diagnostic finding..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white text-slate-900"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!newNote.trim() || isPending}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  Add Note
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column (Tool Context, User Context, Resolution) */}
        <div className="space-y-6">
          {/* Tool Context Card */}
          {toolContext ? (
            <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Wrench className="w-4 h-4 text-orange-600" />
                  Associated Tool
                </h3>
                <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  {toolContext.slug}
                </span>
              </div>

              <div>
                <div className="font-semibold text-slate-900 text-sm">{toolContext.name}</div>
                <p className="text-xs text-slate-500 capitalize">{toolContext.category}</p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Total Executions:</span>
                <span className="font-semibold text-slate-800">{toolContext.totalUsages}</span>
              </div>

              <div className="pt-2">
                <Link
                  href={`/admin/tools?search=${toolContext.slug}`}
                  className="inline-flex items-center gap-1 text-xs font-medium text-orange-600 hover:text-orange-700 hover:underline"
                >
                  Manage Tool Config <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-400">
              No tool associated with this error.
            </div>
          )}

          {/* User Context Card */}
          {userContext ? (
            <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-4 h-4 text-orange-600" />
                  Affected User
                </h3>
                <span className="text-[11px] font-semibold text-orange-700 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full capitalize">
                  {userContext.plan} Plan
                </span>
              </div>

              <div>
                <div className="font-semibold text-slate-900 text-sm">{userContext.name || "User"}</div>
                <div className="text-xs text-slate-500 font-mono">{userContext.email}</div>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-1 text-xs text-slate-500">
                <div className="flex justify-between">
                  <span>Role:</span>
                  <span className="font-medium text-slate-800 capitalize">{userContext.role}</span>
                </div>
                <div className="flex justify-between">
                  <span>Lifetime Tool Usages:</span>
                  <span className="font-medium text-slate-800">{userContext.totalUsages}</span>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href={`/admin/users?search=${userContext.email}`}
                  className="inline-flex items-center gap-1 text-xs font-medium text-orange-600 hover:text-orange-700 hover:underline"
                >
                  View User Profile <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-400">
              No registered user associated (Anonymous request).
            </div>
          )}

          {/* Resolution Info Box (if resolved) */}
          {errorLog.status === "Resolved" && (
            <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl shadow-sm space-y-2">
              <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Resolution Information
              </h3>
              <p className="text-xs text-emerald-900 font-medium">
                Resolved by: {resolverAdmin?.name || resolverAdmin?.email || "Admin"}
              </p>
              {errorLog.resolvedAt && (
                <p className="text-[11px] text-emerald-700">
                  Date: {new Date(errorLog.resolvedAt).toLocaleString()}
                </p>
              )}
              {errorLog.resolutionNote && (
                <div className="mt-2 p-3 bg-white border border-emerald-200 rounded-xl text-xs text-emerald-950 font-sans leading-relaxed">
                  "{errorLog.resolutionNote}"
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Resolution Modal */}
      {showResolutionModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">Resolve Error</h3>
            <p className="text-xs text-slate-500">
              Add an optional resolution note describing what was fixed or changed to resolve this error.
            </p>
            <textarea
              rows={3}
              placeholder="e.g., Fixed timeout configuration in AI provider settings..."
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-900"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowResolutionModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmResolve}
                disabled={isPending}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
              >
                Confirm Resolve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
