"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Clock, 
  Wrench, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Send, 
  UserCheck, 
  MessageSquare, 
  Globe, 
  Monitor, 
  Trash2, 
  Tag, 
  ExternalLink,
  Lock,
  FileText
} from "lucide-react";
import { 
  updateFeedbackStatusAction, 
  updateFeedbackPriorityAction, 
  assignFeedbackAction, 
  addInternalNoteAction, 
  markAsSpamAction, 
  restoreFromSpamAction, 
  deleteFeedbackAction 
} from "../feedback-actions";
import { useRouter } from "next/navigation";

interface FeedbackDetailClientProps {
  submission: any;
  userContext: any;
  toolContext: any;
  assignedAdmin: any;
  availableAdmins: any[];
}

export function FeedbackDetailClient({
  submission: initialSubmission,
  userContext,
  toolContext,
  assignedAdmin: initialAssignedAdmin,
  availableAdmins,
}: FeedbackDetailClientProps) {
  const router = useRouter();
  const [submission, setSubmission] = useState(initialSubmission);
  const [status, setStatus] = useState(initialSubmission.status);
  const [priority, setPriority] = useState(initialSubmission.priority);
  const [assignedAdminId, setAssignedAdminId] = useState(initialSubmission.assignedAdminId || "");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const internalNotes = Array.isArray(submission.internalNotes) ? submission.internalNotes : [];

  const handleStatusChange = async (newStatus: string) => {
    try {
      setActionLoading(true);
      const updated = await updateFeedbackStatusAction(submission.id, newStatus);
      setStatus(updated.status);
      setSubmission(updated);
      setMsg(`Status updated to ${newStatus}`);
    } catch (err: any) {
      alert(err.message || "Failed to update status.");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePriorityChange = async (newPriority: string) => {
    try {
      setActionLoading(true);
      const updated = await updateFeedbackPriorityAction(submission.id, newPriority);
      setPriority(updated.priority);
      setSubmission(updated);
      setMsg(`Priority updated to ${newPriority}`);
    } catch (err: any) {
      alert(err.message || "Failed to update priority.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignChange = async (adminId: string) => {
    try {
      setActionLoading(true);
      const targetId = adminId === "" ? null : adminId;
      const updated = await assignFeedbackAction(submission.id, targetId);
      setAssignedAdminId(adminId);
      setSubmission(updated);
      setMsg("Assignment updated.");
    } catch (err: any) {
      alert(err.message || "Failed to update assignment.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim()) return;

    try {
      setActionLoading(true);
      const updated = await addInternalNoteAction(submission.id, newNoteContent);
      setSubmission(updated);
      setNewNoteContent("");
      setMsg("Internal note added.");
    } catch (err: any) {
      alert(err.message || "Failed to add internal note.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to permanently delete this submission?")) return;

    try {
      setActionLoading(true);
      await deleteFeedbackAction(submission.id);
      router.push("/admin/feedback");
    } catch (err: any) {
      alert(err.message || "Failed to delete submission.");
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Back Navigation */}
      <div>
        <Link
          href="/admin/feedback"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-2"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Submissions List
        </Link>

        {/* Title Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
                #{submission.referenceId}
              </h1>
              <span className="inline-flex items-center rounded-md bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 border border-blue-200">
                {submission.type}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Submitted on {new Date(submission.createdAt).toLocaleString("en-GB")}
            </p>
          </div>

          {/* Top Quick Actions Bar */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Status Dropdown */}
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">Status</label>
              <select
                value={status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={actionLoading}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-900 focus:border-orange-500 focus:outline-none"
              >
                <option value="New">New</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
                <option value="Spam">Spam</option>
              </select>
            </div>

            {/* Priority Dropdown */}
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">Priority</label>
              <select
                value={priority}
                onChange={(e) => handlePriorityChange(e.target.value)}
                disabled={actionLoading}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-900 focus:border-orange-500 focus:outline-none"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>

            {/* Assign Admin Dropdown */}
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">Assign To</label>
              <select
                value={assignedAdminId}
                onChange={(e) => handleAssignChange(e.target.value)}
                disabled={actionLoading}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-900 focus:border-orange-500 focus:outline-none"
              >
                <option value="">-- Unassigned --</option>
                {availableAdmins.map((adm) => (
                  <option key={adm.id} value={adm.id}>
                    {adm.name || adm.email} ({adm.role})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {msg && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs font-semibold text-emerald-800">
          {msg}
        </div>
      )}

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Message Content & Internal Notes (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Submission Message Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="border-b border-slate-200 pb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Subject</span>
              <h2 className="text-lg font-bold text-slate-900 mt-0.5">{submission.subject}</h2>
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">User Message</span>
              <div className="mt-2 rounded-lg bg-slate-50/80 border border-slate-200 p-4 text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                {submission.message}
              </div>
            </div>

            {/* Technical Context Metadata */}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200 text-slate-600">
              <div>
                <span className="text-slate-400 font-semibold">Source: </span>
                <span className="font-mono text-slate-800">{submission.source || "website"}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold">Browser/Device: </span>
                <span className="font-mono text-slate-800">{submission.device || submission.browser || "Web"}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold">User Agent: </span>
                <span className="font-mono text-slate-800 truncate block max-w-full" title={submission.userAgent || ""}>
                  {submission.userAgent || "Unknown"}
                </span>
              </div>
            </div>
          </div>

          {/* Internal Notes Section */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Lock className="h-4 w-4 text-orange-600" />
                Internal Admin Notes ({internalNotes.length})
              </h2>
              <span className="text-[11px] text-slate-400 font-medium">Private to administrators</span>
            </div>

            {/* List of Notes */}
            <div className="space-y-3">
              {internalNotes.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-2">No internal notes added yet.</p>
              ) : (
                internalNotes.map((note: any) => (
                  <div key={note.id} className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs space-y-1">
                    <div className="flex items-center justify-between text-slate-500">
                      <span className="font-bold text-slate-800">{note.authorName}</span>
                      <span>{new Date(note.createdAt).toLocaleString("en-GB")}</span>
                    </div>
                    <p className="text-slate-700 whitespace-pre-wrap">{note.content}</p>
                  </div>
                ))
              )}
            </div>

            {/* Add Note Form */}
            <form onSubmit={handleAddNote} className="pt-2 space-y-3">
              <textarea
                rows={3}
                placeholder="Add a private internal note for other admins..."
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white p-3 text-xs text-slate-900 focus:border-orange-500 focus:outline-none"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={actionLoading || !newNoteContent.trim()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-orange-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-orange-500 disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Add Internal Note</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Context Panels & Actions (1 col) */}
        <div className="space-y-6">
          {/* Submitter Info Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <User className="h-4 w-4 text-slate-500" />
              Submitter Details
            </h3>

            <div className="space-y-1.5 text-xs">
              <div>
                <span className="text-slate-400">Name: </span>
                <span className="font-bold text-slate-900">{submission.name}</span>
              </div>
              <div>
                <span className="text-slate-400">Email: </span>
                <a href={`mailto:${submission.email}`} className="font-semibold text-orange-600 hover:underline">
                  {submission.email}
                </a>
              </div>
            </div>
          </div>

          {/* User Account Context Panel */}
          {userContext ? (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <UserCheck className="h-4 w-4 text-emerald-600" />
                  Registered User Context
                </h3>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {userContext.plan} Plan
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-400">Account Role: </span>
                  <span className="font-bold text-slate-800 capitalize">{userContext.profile?.role}</span>
                </div>
                <div>
                  <span className="text-slate-400">Total Tool Executions: </span>
                  <span className="font-bold text-slate-900 font-mono">{userContext.totalUsage}</span>
                </div>
                <div>
                  <span className="text-slate-400">Member Since: </span>
                  <span className="text-slate-700">
                    {userContext.profile?.createdAt ? new Date(userContext.profile.createdAt).toLocaleDateString("en-GB") : "N/A"}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <Link
                    href={`/admin/users/${userContext.profile?.id}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 hover:underline"
                  >
                    View User Profile →
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500 italic">
              Submitted by a guest user (unauthenticated).
            </div>
          )}

          {/* Associated Tool Context Panel */}
          {toolContext && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Wrench className="h-4 w-4 text-orange-600" />
                  Associated Tool
                </h3>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-mono">
                  {toolContext.slug}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-400">Tool Name: </span>
                  <span className="font-bold text-slate-900">{toolContext.name}</span>
                </div>
                <div>
                  <span className="text-slate-400">Category: </span>
                  <span className="font-semibold text-slate-700 capitalize">{toolContext.category}</span>
                </div>
                <div>
                  <span className="text-slate-400">Total Tool Usage: </span>
                  <span className="font-bold text-slate-900 font-mono">{toolContext.totalUsage}</span>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <Link
                    href={`/admin/tools/${toolContext.slug}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 hover:underline"
                  >
                    Configure Tool →
                  </Link>
                  <a
                    href={`/tools/${toolContext.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800"
                  >
                    Public Page <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Danger Zone Actions */}
          <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-rose-800">
              Admin Control Actions
            </h3>

            <div className="space-y-2">
              {status !== "Spam" ? (
                <button
                  onClick={() => markAsSpamAction(submission.id).then(() => setStatus("Spam"))}
                  className="w-full text-left text-xs font-semibold text-slate-700 hover:text-rose-700 py-1"
                >
                  🚫 Mark Submission as Spam
                </button>
              ) : (
                <button
                  onClick={() => restoreFromSpamAction(submission.id).then(() => setStatus("New"))}
                  className="w-full text-left text-xs font-semibold text-emerald-700 hover:underline py-1"
                >
                  ✅ Restore from Spam to New
                </button>
              )}

              <button
                onClick={handleDelete}
                className="w-full text-left text-xs font-semibold text-rose-600 hover:underline py-1"
              >
                🗑️ Delete Submission Permanently
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
