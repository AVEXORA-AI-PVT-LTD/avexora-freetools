"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  generateReportPreviewAction,
  requestReportGenerationAction,
} from "../reports-actions";
import {
  FileSpreadsheet,
  Calendar,
  Filter,
  Eye,
  Download,
  Clock,
  CreditCard,
  Wrench,
  Users,
  DollarSign,
  Globe,
  Search,
  AlertTriangle,
  MessageSquare,
  RefreshCw,
  CheckCircle2,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";

interface Props {
  initialType?: string;
  toolCategories: string[];
}

export function ReportGeneratorClient({ initialType, toolCategories }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [reportType, setReportType] = useState(initialType || "tool_usage");
  const [format, setFormat] = useState<"csv" | "xlsx" | "pdf">("xlsx");
  const [range, setRange] = useState("30days");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Dynamic Filters
  const [category, setCategory] = useState("all");
  const [toolSlug, setToolSlug] = useState("all");
  const [plan, setPlan] = useState("all");
  const [status, setStatus] = useState("all");
  const [severity, setSeverity] = useState("all");
  const [feedbackType, setFeedbackType] = useState("all");

  // Preview State
  const [previewData, setPreviewData] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Trigger Live Preview
  const handlePreview = () => {
    startTransition(async () => {
      setMessage(null);
      const res = await generateReportPreviewAction(reportType, {
        range,
        startDate,
        endDate,
        category,
        toolSlug,
        plan,
        status,
        severity,
        feedbackType,
      });
      setPreviewData(res);
    });
  };

  // Trigger Full Report Export
  const handleExport = async () => {
    setIsGenerating(true);
    setMessage(null);
    try {
      const res = await requestReportGenerationAction(reportType, format, {
        range,
        startDate,
        endDate,
        category,
        toolSlug,
        plan,
        status,
        severity,
        feedbackType,
      });

      if (res.success && res.jobId) {
        setMessage("Report generated successfully! Download starting...");
        window.open(`/api/admin/reports/download/${res.jobId}`, "_blank");
        setTimeout(() => {
          router.push("/admin/reports/history");
        }, 1500);
      }
    } catch (err: any) {
      setMessage(`Error: ${err.message || "Failed to generate report"}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const reportTypeOptions = [
    { id: "tool_usage", label: "Tool Usage & Performance", icon: Wrench },
    { id: "user_activity", label: "User Registrations & Activity", icon: Users },
    { id: "revenue", label: "Revenue & Financial Transactions", icon: DollarSign },
    { id: "subscription", label: "Subscriptions & Renewals", icon: CreditCard },
    { id: "website_traffic", label: "Website Traffic & Demographics", icon: Globe },
    { id: "seo", label: "SEO Metadata Audit", icon: Search },
    { id: "error", label: "Error Diagnostics", icon: AlertTriangle },
    { id: "feedback", label: "Feedback & Support Tickets", icon: MessageSquare },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            href="/admin/reports"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-orange-600 mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-7 h-7 text-orange-600" />
            Report Generator
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure report parameters, apply filters, preview executive summaries, and export datasets.
          </p>
        </div>

        <Link
          href="/admin/reports/history"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-sm transition-colors"
        >
          <Clock className="w-4 h-4 text-slate-500" />
          View History
        </Link>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-sm font-semibold flex items-center gap-2 ${message.startsWith("Error") ? "bg-rose-50 text-rose-800 border border-rose-200" : "bg-emerald-50 text-emerald-800 border border-emerald-200"}`}>
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {message}
        </div>
      )}

      {/* Main Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Form Controls */}
        <div className="lg:col-span-1 space-y-6 bg-white p-6 border border-slate-200 rounded-2xl shadow-sm">
          {/* 1. Select Report Type */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">1. Select Report Type</label>
            <select
              value={reportType}
              onChange={(e) => {
                setReportType(e.target.value);
                setPreviewData(null);
              }}
              className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:ring-2 focus:ring-orange-500 outline-none text-sm"
            >
              {reportTypeOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Date Range Controls */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-orange-600" /> 2. Date Range
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {["today", "yesterday", "7days", "30days", "90days", "custom"].map((rKey) => (
                <button
                  key={rKey}
                  type="button"
                  onClick={() => setRange(rKey)}
                  className={`py-2 px-3 rounded-lg font-semibold transition-colors border text-center ${
                    range === rKey
                      ? "bg-orange-600 text-white border-orange-600 shadow-sm"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {rKey === "today"
                    ? "Today"
                    : rKey === "yesterday"
                    ? "Yesterday"
                    : rKey === "7days"
                    ? "Last 7 Days"
                    : rKey === "30days"
                    ? "Last 30 Days"
                    : rKey === "90days"
                    ? "Last 90 Days"
                    : "Custom Range"}
                </button>
              ))}
            </div>

            {range === "custom" && (
              <div className="grid grid-cols-2 gap-2 pt-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-700"
                />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-700"
                />
              </div>
            )}
          </div>

          {/* 3. Export Format */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">3. Export Format</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "csv", label: "CSV", sub: "UTF-8 Raw" },
                { id: "xlsx", label: "XLSX", sub: "Multi-Sheet" },
                { id: "pdf", label: "PDF", sub: "Branded PDF" },
              ].map((fmt) => (
                <button
                  key={fmt.id}
                  type="button"
                  onClick={() => setFormat(fmt.id as any)}
                  className={`py-2 px-2 rounded-xl font-bold border text-center transition-colors ${
                    format === fmt.id
                      ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <div className="text-xs uppercase">{fmt.label}</div>
                  <div className="text-[10px] text-slate-400 font-normal">{fmt.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 4. Dynamic Filters */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-blue-600" /> 4. Context Filters
            </label>

            {/* Tool Usage Filters */}
            {reportType === "tool_usage" && (
              <div className="space-y-2 text-xs">
                <div>
                  <label className="font-semibold text-slate-600">Category Filter:</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 capitalize"
                  >
                    <option value="all">All Categories</option>
                    {toolCategories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* User Activity Filters */}
            {reportType === "user_activity" && (
              <div className="space-y-2 text-xs">
                <div>
                  <label className="font-semibold text-slate-600">Account Status:</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800"
                  >
                    <option value="all">All Statuses</option>
                    <option value="ACTIVE">Active</option>
                    <option value="DISABLED">Disabled</option>
                    <option value="BLOCKED">Blocked</option>
                  </select>
                </div>
              </div>
            )}

            {/* Revenue / Subscriptions Filters */}
            {(reportType === "revenue" || reportType === "subscription") && (
              <div className="space-y-2 text-xs">
                <div>
                  <label className="font-semibold text-slate-600">Plan Filter:</label>
                  <select
                    value={plan}
                    onChange={(e) => setPlan(e.target.value)}
                    className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800"
                  >
                    <option value="all">All Plans</option>
                    <option value="FREE">Free Tier</option>
                    <option value="PRO">Pro Plan (₹999)</option>
                    <option value="ENTERPRISE">Enterprise (₹2999)</option>
                  </select>
                </div>
              </div>
            )}

            {/* Error Filters */}
            {reportType === "error" && (
              <div className="space-y-2 text-xs">
                <div>
                  <label className="font-semibold text-slate-600">Severity:</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800"
                  >
                    <option value="all">All Severities</option>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-4 space-y-2">
            <button
              type="button"
              onClick={handlePreview}
              disabled={isPending}
              className="w-full py-2.5 px-4 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Eye className="w-4 h-4 text-slate-500" /> Live Preview Summary
            </button>

            <button
              type="button"
              onClick={handleExport}
              disabled={isGenerating}
              className="w-full py-3 px-4 text-sm font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl transition-colors shadow-sm inline-flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {isGenerating ? "Processing Report..." : `Export ${format.toUpperCase()} Report`}
            </button>
          </div>
        </div>

        {/* Right Column: Live Preview Panel */}
        <div className="lg:col-span-2 space-y-6">
          {previewData ? (
            <div className="bg-white p-6 border border-slate-200 rounded-2xl shadow-sm space-y-6">
              <div>
                <span className="text-[11px] font-bold text-orange-600 uppercase tracking-wider bg-orange-50 px-2.5 py-1 rounded-md border border-orange-200">
                  Live Report Preview
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-2">{previewData.title}</h2>
                <p className="text-xs text-slate-500 mt-0.5">{previewData.subtitle}</p>
                <p className="text-xs text-slate-400 font-mono mt-1">Range: {previewData.dateRangeText}</p>
              </div>

              {/* KPI Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {previewData.summary.map((sum: any, idx: number) => (
                  <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{sum.label}</div>
                    <div className="text-xl font-extrabold text-slate-900">{sum.value}</div>
                  </div>
                ))}
              </div>

              {/* Sample Data Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span>Sample Data Records ({previewData.totalRows} total rows)</span>
                  <span>Showing first 5 sample rows</span>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-500 uppercase tracking-wider">
                      <tr>
                        {previewData.columns.slice(0, 6).map((col: any) => (
                          <th key={col.key} className="p-2.5">{col.header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {previewData.sampleRows.map((row: any, rIdx: number) => (
                        <tr key={rIdx} className="hover:bg-slate-50">
                          {previewData.columns.slice(0, 6).map((col: any) => (
                            <td key={col.key} className="p-2.5 whitespace-nowrap">
                              {row[col.key] !== null && row[col.key] !== undefined ? String(row[col.key]) : "-"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 border border-slate-200 rounded-2xl shadow-sm text-center space-y-3 flex flex-col items-center justify-center min-h-[400px]">
              <div className="p-4 bg-orange-50 rounded-full text-orange-600">
                <FileSpreadsheet className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Configure & Preview Your Report</h3>
              <p className="text-xs text-slate-500 max-w-sm">
                Select your report type and date range on the left, then click "Live Preview Summary" to inspect the data before downloading.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
