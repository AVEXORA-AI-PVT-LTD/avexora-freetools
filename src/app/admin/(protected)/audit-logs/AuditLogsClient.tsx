"use client";

import { useState, useTransition } from "react";
import { getAuditLogsAction, exportAuditLogsAction } from "./audit-actions";
import { AUDIT_ACTIONS, TARGET_TYPES } from "@/lib/admin/audit-actions";
import { formatChangeSummary, FieldChange } from "@/lib/admin/audit-sanitizer";
import {
  History,
  Search,
  RefreshCw,
  Download,
  Filter,
  X,
  Eye,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Laptop,
  Terminal,
  FileCode,
  Copy,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  FileText,
} from "lucide-react";

interface Props {
  initialData: Awaited<ReturnType<typeof getAuditLogsAction>>;
}

export function AuditLogsClient({ initialData }: Props) {
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState(initialData);

  // Filters State
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("ALL");
  const [targetType, setTargetType] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [severity, setSeverity] = useState("ALL");
  const [dateRange, setDateRange] = useState("all");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  // Pagination State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  // Selected Log for Inspection Modal
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [modalTab, setModalTab] = useState<"summary" | "json">("summary");
  const [copiedJson, setCopiedJson] = useState(false);

  // Refetch helper
  const handleFilterChange = (overrides: Record<string, any> = {}) => {
    const newParams = {
      search: overrides.search !== undefined ? overrides.search : search,
      action: overrides.action !== undefined ? overrides.action : action,
      targetType: overrides.targetType !== undefined ? overrides.targetType : targetType,
      status: overrides.status !== undefined ? overrides.status : status,
      severity: overrides.severity !== undefined ? overrides.severity : severity,
      dateRange: overrides.dateRange !== undefined ? overrides.dateRange : dateRange,
      sortOrder: overrides.sortOrder !== undefined ? overrides.sortOrder : sortOrder,
      page: overrides.page !== undefined ? overrides.page : page,
      limit: overrides.limit !== undefined ? overrides.limit : limit,
    };

    startTransition(async () => {
      const res = await getAuditLogsAction(newParams);
      setData(res);
    });
  };

  // Reset Filters
  const handleClearFilters = () => {
    setSearch("");
    setAction("ALL");
    setTargetType("ALL");
    setStatus("ALL");
    setSeverity("ALL");
    setDateRange("all");
    setSortOrder("desc");
    setPage(1);

    startTransition(async () => {
      const res = await getAuditLogsAction({
        search: "",
        action: "ALL",
        targetType: "ALL",
        status: "ALL",
        severity: "ALL",
        dateRange: "all",
        sortOrder: "desc",
        page: 1,
        limit,
      });
      setData(res);
    });
  };

  // Export Audit Logs
  const handleExport = async (format: "csv" | "json") => {
    startTransition(async () => {
      const res = await exportAuditLogsAction(
        { search, action, targetType, status, severity, dateRange },
        format
      );

      if (res.success && res.content) {
        const blob = new Blob([res.content], { type: res.mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = res.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        alert("Failed to export audit logs.");
      }
    });
  };

  // Copy JSON to clipboard
  const handleCopyJson = (obj: any) => {
    navigator.clipboard.writeText(JSON.stringify(obj, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <History className="w-7 h-7 text-orange-600" />
            Audit & Compliance Logs
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Append-only historical audit trail recording administrative, security, tool, user, and financial mutations.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => handleFilterChange({ page })}
            disabled={isPending}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-sm transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isPending ? "animate-spin text-orange-600" : ""}`} />
            Refresh
          </button>

          {/* Export Dropdown */}
          <div className="relative group">
            <button
              disabled={isPending}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-sm transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-slate-200 rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 py-1">
              <button
                onClick={() => handleExport("csv")}
                className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-orange-600"
              >
                Export CSV (.csv)
              </button>
              <button
                onClick={() => handleExport("json")}
                className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-orange-600"
              >
                Export JSON (.json)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Filtered Events</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{data.pagination.totalCount}</div>
          <p className="text-xs text-slate-400 mt-0.5">Matching current query</p>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Events Today</div>
          <div className="text-2xl font-extrabold text-orange-600 mt-1">{data.stats.todayCount}</div>
          <p className="text-xs text-slate-400 mt-0.5">Recorded since midnight</p>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Security & Failures</div>
          <div className="text-2xl font-extrabold text-rose-600 mt-1">{data.stats.failedCount}</div>
          <p className="text-xs text-slate-400 mt-0.5">Failed or denied actions</p>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active Actors</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{data.stats.uniqueActorsCount}</div>
          <p className="text-xs text-slate-400 mt-0.5">Unique user & system actors</p>
        </div>
      </div>

      {/* Filter & Toolbar */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search actor, action, target, IP, request ID..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
                handleFilterChange({ search: e.target.value, page: 1 });
              }}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-900 placeholder:text-slate-400"
            />
          </div>

          {/* Action Filter */}
          <div>
            <select
              value={action}
              onChange={(e) => {
                setAction(e.target.value);
                setPage(1);
                handleFilterChange({ action: e.target.value, page: 1 });
              }}
              className="w-full py-2 px-3 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-700"
            >
              <option value="ALL">All Action Types</option>
              {Object.values(AUDIT_ACTIONS).map((act) => (
                <option key={act} value={act}>
                  {act}
                </option>
              ))}
            </select>
          </div>

          {/* Target Type Filter */}
          <div>
            <select
              value={targetType}
              onChange={(e) => {
                setTargetType(e.target.value);
                setPage(1);
                handleFilterChange({ targetType: e.target.value, page: 1 });
              }}
              className="w-full py-2 px-3 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-700"
            >
              <option value="ALL">All Target Types</option>
              {TARGET_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Filter */}
          <div>
            <select
              value={dateRange}
              onChange={(e) => {
                setDateRange(e.target.value);
                setPage(1);
                handleFilterChange({ dateRange: e.target.value, page: 1 });
              }}
              className="w-full py-2 px-3 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-700"
            >
              <option value="all">All Time Range</option>
              <option value="today">Today</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
            </select>
          </div>
        </div>

        {/* Secondary Filter Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-500">Status:</span>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                  handleFilterChange({ status: e.target.value, page: 1 });
                }}
                className="py-1 px-2 text-xs bg-slate-100 rounded-lg text-slate-700 border-none font-medium focus:ring-1 focus:ring-orange-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="SUCCESS">SUCCESS</option>
                <option value="FAILED">FAILED</option>
                <option value="DENIED">DENIED</option>
              </select>
            </div>

            {/* Severity Filter */}
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-500">Severity:</span>
              <select
                value={severity}
                onChange={(e) => {
                  setSeverity(e.target.value);
                  setPage(1);
                  handleFilterChange({ severity: e.target.value, page: 1 });
                }}
                className="py-1 px-2 text-xs bg-slate-100 rounded-lg text-slate-700 border-none font-medium focus:ring-1 focus:ring-orange-500"
              >
                <option value="ALL">All Severities</option>
                <option value="INFO">INFO</option>
                <option value="WARNING">WARNING</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>

            {/* Sort Order */}
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-500">Order:</span>
              <select
                value={sortOrder}
                onChange={(e) => {
                  setSortOrder(e.target.value as any);
                  handleFilterChange({ sortOrder: e.target.value });
                }}
                className="py-1 px-2 text-xs bg-slate-100 rounded-lg text-slate-700 border-none font-medium focus:ring-1 focus:ring-orange-500"
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
            </div>
          </div>

          {(search || action !== "ALL" || targetType !== "ALL" || status !== "ALL" || severity !== "ALL" || dateRange !== "all") && (
            <button
              onClick={handleClearFilters}
              className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700"
            >
              <X className="w-3.5 h-3.5" /> Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Data Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="p-4">Timestamp & Event ID</th>
                <th className="p-4">Actor</th>
                <th className="p-4">Action</th>
                <th className="p-4">Target Resource</th>
                <th className="p-4">Status & Severity</th>
                <th className="p-4">IP & Request ID</th>
                <th className="p-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <History className="w-8 h-8 text-slate-300" />
                      <div className="font-medium text-slate-700">No Audit Events Found</div>
                      <p className="text-xs text-slate-400 max-w-sm">
                        No audit events match your selected search or filter criteria.
                      </p>
                      <button
                        onClick={handleClearFilters}
                        className="mt-2 text-xs font-semibold text-orange-600 hover:underline"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                data.items.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-900 text-xs">
                        {new Date(log.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </div>
                      <div className="font-mono text-[11px] text-slate-400 mt-0.5">
                        {log.eventId || log.id}
                      </div>
                    </td>

                    <td className="p-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-800 text-xs flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        {log.actorName || "System Actor"}
                      </div>
                      <div className="font-mono text-[11px] text-slate-500">{log.actorEmail || "-"}</div>
                    </td>

                    <td className="p-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${
                          log.action.includes("DELETE") || log.action.includes("BLOCK")
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : log.action.includes("CREATE") || log.action.includes("PUBLISH")
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : log.action.includes("UPDATE") || log.action.includes("ROLE")
                            ? "bg-amber-50 text-amber-800 border-amber-200"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>

                    <td className="p-4 whitespace-nowrap">
                      <div className="text-xs font-semibold text-slate-900">
                        {log.targetName || log.targetId || "-"}
                      </div>
                      <div className="text-[11px] text-slate-400 font-medium">
                        {log.targetType} {log.targetId ? `(${log.targetId})` : ""}
                      </div>
                    </td>

                    <td className="p-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${
                            log.status === "SUCCESS"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {log.status === "SUCCESS" ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <XCircle className="w-3 h-3 text-rose-600" />
                          )}
                          {log.status}
                        </span>

                        <span
                          className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                            log.severity === "CRITICAL"
                              ? "bg-rose-500 text-white"
                              : log.severity === "WARNING"
                              ? "bg-amber-500 text-white"
                              : "bg-slate-200 text-slate-700"
                          }`}
                        >
                          {log.severity}
                        </span>
                      </div>
                    </td>

                    <td className="p-4 whitespace-nowrap">
                      <div className="text-xs font-mono text-slate-700">{log.ip || "Local"}</div>
                      <div className="text-[11px] font-mono text-slate-400 truncate max-w-[120px]" title={log.requestId || undefined}>
                        {log.requestId || "-"}
                      </div>
                    </td>

                    <td className="p-4 whitespace-nowrap text-right text-xs">
                      <button
                        onClick={() => {
                          setSelectedLog(log);
                          setModalTab("summary");
                        }}
                        className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors inline-flex items-center gap-1 font-semibold"
                        title="View Detailed Log"
                      >
                        <Eye className="w-4 h-4" />
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span>Show</span>
            <select
              value={limit}
              onChange={(e) => {
                const newLimit = Number(e.target.value);
                setLimit(newLimit);
                setPage(1);
                handleFilterChange({ limit: newLimit, page: 1 });
              }}
              className="py-1 px-2 text-xs bg-white border border-slate-200 rounded-lg font-semibold text-slate-700"
            >
              <option value={20}>20 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>
            <span>
              Showing {data.pagination.totalCount === 0 ? 0 : (page - 1) * limit + 1}–
              {Math.min(page * limit, data.pagination.totalCount)} of {data.pagination.totalCount} audit logs
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const newPage = Math.max(1, page - 1);
                setPage(newPage);
                handleFilterChange({ page: newPage });
              }}
              disabled={page === 1 || isPending}
              className="px-3 py-1.5 font-medium bg-white border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50 transition-colors inline-flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <span className="font-semibold text-slate-800">
              Page {page} of {data.pagination.totalPages || 1}
            </span>
            <button
              onClick={() => {
                const newPage = Math.min(data.pagination.totalPages, page + 1);
                setPage(newPage);
                handleFilterChange({ page: newPage });
              }}
              disabled={page >= data.pagination.totalPages || isPending}
              className="px-3 py-1.5 font-medium bg-white border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50 transition-colors inline-flex items-center gap-1"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Audit Log Inspection Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 space-y-4 shadow-xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                    {selectedLog.eventId || selectedLog.id}
                  </span>
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                      selectedLog.severity === "CRITICAL"
                        ? "bg-rose-500 text-white"
                        : selectedLog.severity === "WARNING"
                        ? "bg-amber-500 text-white"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {selectedLog.severity}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-1 flex items-center gap-2">
                  {selectedLog.action}
                </h3>
              </div>

              <button onClick={() => setSelectedLog(null)} className="p-1.5 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content Scroll Area */}
            <div className="overflow-y-auto flex-1 space-y-4 pr-1">
              {/* Event Attributes Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                <div>
                  <span className="font-semibold text-slate-500 block">Actor:</span>
                  <div className="font-bold text-slate-900">{selectedLog.actorName || "System Actor"}</div>
                  <div className="font-mono text-[11px] text-slate-500">{selectedLog.actorEmail || "-"}</div>
                </div>

                <div>
                  <span className="font-semibold text-slate-500 block">Target Resource:</span>
                  <div className="font-bold text-slate-900">{selectedLog.targetName || selectedLog.targetId || "-"}</div>
                  <div className="text-[11px] text-slate-500">{selectedLog.targetType}</div>
                </div>

                <div>
                  <span className="font-semibold text-slate-500 block">Timestamp:</span>
                  <div className="font-semibold text-slate-900">
                    {new Date(selectedLog.createdAt).toLocaleString()}
                  </div>
                  <div className="font-mono text-[11px] text-slate-500">Env: {selectedLog.environment || "production"}</div>
                </div>

                <div>
                  <span className="font-semibold text-slate-500 block">IP Address:</span>
                  <div className="font-mono text-slate-900">{selectedLog.ip || "Local"}</div>
                </div>

                <div>
                  <span className="font-semibold text-slate-500 block">Request ID:</span>
                  <div className="font-mono text-slate-900">{selectedLog.requestId || "-"}</div>
                </div>

                <div>
                  <span className="font-semibold text-slate-500 block">User Agent:</span>
                  <div className="font-mono text-[11px] text-slate-600 truncate" title={selectedLog.userAgent || undefined}>
                    {selectedLog.userAgent || "-"}
                  </div>
                </div>
              </div>

              {/* Modal Tabs */}
              <div className="flex border-b border-slate-200 text-xs">
                <button
                  onClick={() => setModalTab("summary")}
                  className={`py-2 px-4 font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                    modalTab === "summary"
                      ? "border-orange-600 text-orange-600"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <FileText className="w-4 h-4" /> Change Summary & Metadata
                </button>
                <button
                  onClick={() => setModalTab("json")}
                  className={`py-2 px-4 font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                    modalTab === "json"
                      ? "border-orange-600 text-orange-600"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <FileCode className="w-4 h-4" /> Raw JSON Payload
                </button>
              </div>

              {/* Tab 1: Change Summary */}
              {modalTab === "summary" && (
                <div className="space-y-3">
                  {selectedLog.changes && selectedLog.changes.length > 0 ? (
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                        Modified Fields ({selectedLog.changes.length})
                      </span>
                      <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
                        {selectedLog.changes.map((ch: FieldChange) => (
                          <div key={ch.field} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                            <span className="font-mono font-bold text-slate-800">{ch.field}</span>
                            <div className="flex items-center gap-2 font-mono text-[11px]">
                              <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded">
                                {ch.oldValue === undefined || ch.oldValue === null ? "(none)" : JSON.stringify(ch.oldValue)}
                              </span>
                              <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">
                                {ch.newValue === undefined || ch.newValue === null ? "(none)" : JSON.stringify(ch.newValue)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500">
                      No state mutation diff recorded for this event.
                    </div>
                  )}

                  {/* Metadata preview */}
                  {selectedLog.metadata && (
                    <div className="space-y-2 pt-2">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                        Sanitized Event Metadata
                      </span>
                      <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono overflow-x-auto max-h-48">
                        {JSON.stringify(selectedLog.metadata, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Raw JSON */}
              {modalTab === "json" && (
                <div className="relative">
                  <button
                    onClick={() => handleCopyJson(selectedLog)}
                    className="absolute right-3 top-3 px-2.5 py-1 text-xs font-semibold bg-slate-800 text-slate-200 hover:text-white rounded-lg flex items-center gap-1 border border-slate-700"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    {copiedJson ? "Copied!" : "Copy JSON"}
                  </button>
                  <pre className="p-4 bg-slate-950 text-emerald-400 rounded-xl text-xs font-mono overflow-x-auto max-h-96">
                    {JSON.stringify(selectedLog, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
