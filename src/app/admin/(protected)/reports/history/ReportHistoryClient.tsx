"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  deleteReportJobAction,
  retryReportJobAction,
} from "../reports-actions";
import {
  Clock,
  Download,
  Trash2,
  RotateCw,
  FileSpreadsheet,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
} from "lucide-react";

interface Props {
  initialJobs: any[];
}

export function ReportHistoryClient({ initialJobs }: Props) {
  const [jobs, setJobs] = useState(initialJobs);
  const [isPending, startTransition] = useTransition();

  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  // Filter jobs
  const filteredJobs = jobs.filter((job) => {
    const matchesStatus = statusFilter === "all" || job.status === statusFilter;
    const matchesSearch =
      job.reportType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (job.requestedByEmail && job.requestedByEmail.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  // Handle Job Deletion
  const handleDelete = (jobId: string) => {
    if (!confirm("Are you sure you want to delete this report file and job history?")) return;

    startTransition(async () => {
      try {
        await deleteReportJobAction(jobId);
        setJobs((prev) => prev.filter((j) => j.id !== jobId));
        setMessage("Report deleted successfully.");
      } catch (err: any) {
        setMessage(`Error: ${err.message || "Failed to delete report"}`);
      }
    });
  };

  // Handle Retry
  const handleRetry = (jobId: string) => {
    startTransition(async () => {
      try {
        await retryReportJobAction(jobId);
        setMessage("Report generation retried!");
        setTimeout(() => window.location.reload(), 1000);
      } catch (err: any) {
        setMessage(`Error: ${err.message || "Failed to retry report"}`);
      }
    });
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "N/A";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            href="/admin/reports"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-orange-600 mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Reports Dashboard
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Clock className="w-7 h-7 text-orange-600" />
            Report History & Background Jobs
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track generated reports, background processing status, file sizes, download logs, and expiration.
          </p>
        </div>

        <Link
          href="/admin/reports/generate"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-sm transition-colors"
        >
          <FileSpreadsheet className="w-4 h-4" />
          Generate New Report
        </Link>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-sm font-semibold flex items-center gap-2 ${message.startsWith("Error") ? "bg-rose-50 text-rose-800 border border-rose-200" : "bg-emerald-50 text-emerald-800 border border-emerald-200"}`}>
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {message}
        </div>
      )}

      {/* Filters Bar */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search report type or user..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-orange-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-slate-500">Status:</span>
          {["all", "COMPLETED", "PROCESSING", "FAILED", "EXPIRED"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg font-semibold capitalize transition-colors ${
                statusFilter === st
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Report Type</th>
                <th className="p-3.5 text-center">Format</th>
                <th className="p-3.5 text-center">File Size</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-center">Downloads</th>
                <th className="p-3.5 text-center">Requested By</th>
                <th className="p-3.5 text-center">Date</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredJobs.map((job) => (
                <tr key={job.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-3.5 whitespace-nowrap">
                    <div className="font-bold text-slate-900 capitalize">{job.reportType.replace(/_/g, " ")}</div>
                    <div className="text-[11px] text-slate-400 font-mono">Job ID: {job.id}</div>
                  </td>

                  <td className="p-3.5 whitespace-nowrap text-center">
                    <span className="uppercase font-mono text-xs font-bold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                      {job.format}
                    </span>
                  </td>

                  <td className="p-3.5 whitespace-nowrap text-center font-mono text-xs text-slate-600">
                    {formatFileSize(job.fileSize)}
                  </td>

                  <td className="p-3.5 whitespace-nowrap text-center">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                        job.status === "COMPLETED"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : job.status === "FAILED"
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : job.status === "EXPIRED"
                          ? "bg-slate-100 text-slate-600 border-slate-200"
                          : "bg-amber-50 text-amber-800 border-amber-200"
                      }`}
                    >
                      {job.status}
                    </span>
                  </td>

                  <td className="p-3.5 whitespace-nowrap text-center font-mono text-xs font-bold text-slate-700">
                    {job.downloadCount || 0}
                  </td>

                  <td className="p-3.5 whitespace-nowrap text-center text-xs text-slate-600">
                    {job.requestedByEmail || job.requestedBy}
                  </td>

                  <td className="p-3.5 whitespace-nowrap text-center text-xs text-slate-500 font-mono">
                    {new Date(job.createdAt).toLocaleDateString()}
                  </td>

                  <td className="p-3.5 whitespace-nowrap text-right text-xs">
                    <div className="flex items-center justify-end gap-1.5">
                      {job.status === "COMPLETED" && (
                        <a
                          href={`/api/admin/reports/download/${job.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors inline-flex items-center gap-1 font-semibold"
                          title="Download Report File"
                        >
                          <Download className="w-3.5 h-3.5" /> Download
                        </a>
                      )}

                      {job.status === "FAILED" && (
                        <button
                          type="button"
                          onClick={() => handleRetry(job.id)}
                          disabled={isPending}
                          className="p-1.5 text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors inline-flex items-center gap-1 font-semibold"
                          title="Retry Report Generation"
                        >
                          <RotateCw className="w-3.5 h-3.5" /> Retry
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDelete(job.id)}
                        disabled={isPending}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete Report"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredJobs.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 text-sm">
                    No report history records matching filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
