"use client";

import Link from "next/link";
import {
  Wrench,
  Users,
  DollarSign,
  CreditCard,
  Globe,
  Search,
  AlertTriangle,
  MessageSquare,
  FileSpreadsheet,
  Download,
  Clock,
  ChevronRight,
  ArrowUpRight,
  CheckCircle2,
} from "lucide-react";

interface Props {
  overview: {
    totalJobs: number;
    completedJobs: number;
    recentJobs: any[];
    lastGeneratedMap: Record<string, string>;
  };
}

export function ReportsDashboardClient({ overview }: Props) {
  const reportCards = [
    {
      id: "tool_usage",
      title: "Tool Usage Report",
      description: "Analyze tool views, executions, success rates, latency, and signup conversions.",
      icon: Wrench,
      color: "text-orange-600 bg-orange-50 border-orange-200",
      formats: ["CSV", "XLSX", "PDF"],
      lastGenerated: overview.lastGeneratedMap["tool_usage"] || "Never",
    },
    {
      id: "user_activity",
      title: "User Activity Report",
      description: "User registrations, tool usage volume, account status, and subscription tiers.",
      icon: Users,
      color: "text-emerald-600 bg-emerald-50 border-emerald-200",
      formats: ["CSV", "XLSX", "PDF"],
      lastGenerated: overview.lastGeneratedMap["user_activity"] || "Never",
    },
    {
      id: "revenue",
      title: "Revenue Report",
      description: "Financial transactions, gross revenue, net amounts, taxes, and payment gateways.",
      icon: DollarSign,
      color: "text-emerald-700 bg-emerald-50 border-emerald-200",
      formats: ["CSV", "XLSX", "PDF"],
      lastGenerated: overview.lastGeneratedMap["revenue"] || "Never",
    },
    {
      id: "subscription",
      title: "Subscription Report",
      description: "Paid plan subscriptions, active status, renewals, cancellations, and churn.",
      icon: CreditCard,
      color: "text-amber-600 bg-amber-50 border-amber-200",
      formats: ["CSV", "XLSX", "PDF"],
      lastGenerated: overview.lastGeneratedMap["subscription"] || "Never",
    },
    {
      id: "website_traffic",
      title: "Website Traffic Report",
      description: "Unique visitors, page impressions, traffic channels, devices, and countries.",
      icon: Globe,
      color: "text-blue-600 bg-blue-50 border-blue-200",
      formats: ["CSV", "XLSX", "PDF"],
      lastGenerated: overview.lastGeneratedMap["website_traffic"] || "Never",
    },
    {
      id: "seo",
      title: "SEO Audit Report",
      description: "Meta titles, descriptions, canonical URLs, schema markup, and sitemap health.",
      icon: Search,
      color: "text-indigo-600 bg-indigo-50 border-indigo-200",
      formats: ["CSV", "XLSX", "PDF"],
      lastGenerated: overview.lastGeneratedMap["seo"] || "Never",
    },
    {
      id: "error",
      title: "Error Diagnostics Report",
      description: "Application exception logs, severity ratings, request IDs, and resolution status.",
      icon: AlertTriangle,
      color: "text-rose-600 bg-rose-50 border-rose-200",
      formats: ["CSV", "XLSX", "PDF"],
      lastGenerated: overview.lastGeneratedMap["error"] || "Never",
    },
    {
      id: "feedback",
      title: "Feedback & Tickets Report",
      description: "User contact submissions, bug reports, feature requests, and priority status.",
      icon: MessageSquare,
      color: "text-violet-600 bg-violet-50 border-violet-200",
      formats: ["CSV", "XLSX", "PDF"],
      lastGenerated: overview.lastGeneratedMap["feedback"] || "Never",
    },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-7 h-7 text-orange-600" />
            Reports & Export Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Generate, schedule, preview, and download custom CSV, XLSX, and PDF exports.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/reports/history"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-sm transition-colors"
          >
            <Clock className="w-4 h-4 text-slate-500" />
            Report History ({overview.totalJobs})
          </Link>

          <Link
            href="/admin/reports/generate"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-sm transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            New Custom Report
          </Link>
        </div>
      </div>

      {/* Overview Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-1">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Generated Reports</div>
          <div className="text-2xl font-extrabold text-slate-900">{overview.totalJobs.toLocaleString()}</div>
          <p className="text-xs text-slate-500">Total job requests created</p>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-1">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Completed Exports</div>
          <div className="text-2xl font-extrabold text-emerald-600">{overview.completedJobs.toLocaleString()}</div>
          <p className="text-xs text-slate-500">Ready for instant download</p>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-1">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Available Export Formats</div>
          <div className="text-lg font-extrabold text-slate-900 flex items-center gap-2 mt-1">
            <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-md text-xs font-mono font-bold text-slate-700">CSV</span>
            <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 rounded-md text-xs font-mono font-bold text-emerald-700">XLSX</span>
            <span className="px-2 py-0.5 bg-rose-50 border border-rose-200 rounded-md text-xs font-mono font-bold text-rose-700">PDF</span>
          </div>
          <p className="text-xs text-slate-500">UTF-8 safe, multi-sheet & branded</p>
        </div>
      </div>

      {/* 8 Report Module Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {reportCards.map((card) => {
          const IconComponent = card.icon;
          return (
            <div
              key={card.id}
              className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-xl border ${card.color}`}>
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    {card.formats.join(" • ")}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900">{card.title}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{card.description}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Last Generated:</span>
                  <span className="font-semibold text-slate-700">{card.lastGenerated}</span>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <Link
                    href={`/admin/reports/generate?type=${card.id}`}
                    className="flex-1 text-center py-2 px-3 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl transition-colors shadow-sm"
                  >
                    Generate Report
                  </Link>

                  <Link
                    href={`/admin/reports/history?type=${card.id}`}
                    className="p-2 text-slate-500 hover:text-orange-600 hover:bg-orange-50 border border-slate-200 rounded-xl transition-colors"
                    title="View History"
                  >
                    <Clock className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity Table */}
      <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recent Report Exports</h2>
            <p className="text-xs text-slate-500">Latest generated background jobs and download files</p>
          </div>

          <Link
            href="/admin/reports/history"
            className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
          >
            View all history <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="p-3">Report Type</th>
                <th className="p-3 text-center">Format</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Requested By</th>
                <th className="p-3 text-center">Created At</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {overview.recentJobs.map((job) => (
                <tr key={job.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-3 whitespace-nowrap">
                    <div className="font-bold text-slate-900 capitalize">{job.reportType.replace(/_/g, " ")}</div>
                    <div className="text-[11px] text-slate-400 font-mono">ID: {job.id.substring(job.id.length - 8)}</div>
                  </td>

                  <td className="p-3 whitespace-nowrap text-center">
                    <span className="uppercase font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                      {job.format}
                    </span>
                  </td>

                  <td className="p-3 whitespace-nowrap text-center">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                        job.status === "COMPLETED"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : job.status === "FAILED"
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : "bg-amber-50 text-amber-800 border-amber-200"
                      }`}
                    >
                      {job.status}
                    </span>
                  </td>

                  <td className="p-3 whitespace-nowrap text-center text-xs text-slate-600">
                    {job.requestedByEmail || job.requestedBy}
                  </td>

                  <td className="p-3 whitespace-nowrap text-center text-xs text-slate-500 font-mono">
                    {new Date(job.createdAt).toLocaleDateString()}
                  </td>

                  <td className="p-3 whitespace-nowrap text-right text-xs">
                    {job.status === "COMPLETED" ? (
                      <a
                        href={`/api/admin/reports/download/${job.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" /> Download
                      </a>
                    ) : (
                      <span className="text-slate-400 text-xs">Unavailable</span>
                    )}
                  </td>
                </tr>
              ))}

              {overview.recentJobs.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 text-sm">
                    No reports generated yet. Click "New Custom Report" to create your first report.
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
