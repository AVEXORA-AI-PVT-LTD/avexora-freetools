"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  getErrorLogsAction,
  bulkUpdateErrorsAction,
  deleteErrorAction,
  GetErrorLogsParams,
} from "./error-actions";
import {
  Search,
  Filter,
  X,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Ban,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Server,
  Wrench,
  User,
  ArrowUpDown,
  MoreHorizontal,
  ExternalLink,
} from "lucide-react";

interface Props {
  initialData: Awaited<ReturnType<typeof getErrorLogsAction>>;
  searchParams: Record<string, string | undefined>;
}

export function ErrorMonitoringClient({ initialData, searchParams }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // State
  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState(searchParams.search || "");
  const [errorType, setErrorType] = useState(searchParams.errorType || "ALL");
  const [severity, setSeverity] = useState(searchParams.severity || "ALL");
  const [status, setStatus] = useState(searchParams.status || "ALL");
  const [environment, setEnvironment] = useState(searchParams.environment || "ALL");
  const [toolSlug, setToolSlug] = useState(searchParams.toolSlug || "ALL");
  const [page, setPage] = useState(Number(searchParams.page) || 1);
  const [limit, setLimit] = useState(Number(searchParams.limit) || 20);
  const [sortBy, setSortBy] = useState(searchParams.sortBy || "createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">((searchParams.sortOrder as any) || "desc");

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState("");
  const [isBulkLoading, setIsBulkLoading] = useState(false);

  const spStatus = searchParams?.status || "ALL";
  const spType = searchParams?.errorType || "ALL";
  const spSev = searchParams?.severity || "ALL";
  const spEnv = searchParams?.environment || "ALL";
  const spTool = searchParams?.toolSlug || "ALL";
  const spSearch = searchParams?.search || "";
  const spPage = Number(searchParams?.page) || 1;

  // Sync state with incoming server props when searchParams change externally (e.g. layout nav tabs)
  useEffect(() => {
    setData(initialData);
    setStatus(spStatus);
    setErrorType(spType);
    setSeverity(spSev);
    setEnvironment(spEnv);
    setToolSlug(spTool);
    setSearch(spSearch);
    setPage(spPage);
  }, [initialData, spStatus, spType, spSev, spEnv, spTool, spSearch, spPage]);

  // Handle filter changes & data refetching
  const fetchFilteredData = (overrideParams?: Partial<GetErrorLogsParams>) => {
    startTransition(async () => {
      const params: GetErrorLogsParams = {
        page: overrideParams?.page ?? page,
        limit: overrideParams?.limit ?? limit,
        search: overrideParams?.search ?? search,
        errorType: overrideParams?.errorType ?? errorType,
        severity: overrideParams?.severity ?? severity,
        status: overrideParams?.status ?? status,
        environment: overrideParams?.environment ?? environment,
        toolSlug: overrideParams?.toolSlug ?? toolSlug,
        sortBy: overrideParams?.sortBy ?? sortBy,
        sortOrder: overrideParams?.sortOrder ?? sortOrder,
      };

      try {
        const res = await getErrorLogsAction(params);
        setData(res);

        // Update URL query without full page reload
        const queryParams = new URLSearchParams();
        if (params.page && params.page > 1) queryParams.set("page", String(params.page));
        if (params.search) queryParams.set("search", params.search);
        if (params.errorType && params.errorType !== "ALL") queryParams.set("errorType", params.errorType);
        if (params.severity && params.severity !== "ALL") queryParams.set("severity", params.severity);
        if (params.status && params.status !== "ALL") queryParams.set("status", params.status);
        if (params.environment && params.environment !== "ALL") queryParams.set("environment", params.environment);
        if (params.toolSlug && params.toolSlug !== "ALL") queryParams.set("toolSlug", params.toolSlug);

        const newUrl = `/admin/error-monitoring${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
        router.replace(newUrl, { scroll: false });
      } catch (err) {
        console.error("Failed to refetch error logs:", err);
      }
    });
  };

  // Debounced search handler
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== (searchParams.search || "")) {
        setPage(1);
        fetchFilteredData({ search, page: 1 });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Tab switcher helper
  const handleTabChange = (newStatus: string) => {
    setStatus(newStatus);
    setPage(1);
    fetchFilteredData({ status: newStatus, page: 1 });
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearch("");
    setErrorType("ALL");
    setSeverity("ALL");
    setStatus("ALL");
    setEnvironment("ALL");
    setToolSlug("ALL");
    setPage(1);
    fetchFilteredData({
      search: "",
      errorType: "ALL",
      severity: "ALL",
      status: "ALL",
      environment: "ALL",
      toolSlug: "ALL",
      page: 1,
    });
  };

  // Checkbox select handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(data.items.map((item) => item.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((i) => i !== id));
    }
  };

  // Bulk action execute
  const handleApplyBulkAction = async () => {
    if (!bulkAction || selectedIds.length === 0) return;
    if (bulkAction === "delete" && !confirm(`Are you sure you want to delete ${selectedIds.length} error logs?`)) {
      return;
    }

    setIsBulkLoading(true);
    try {
      const res = await bulkUpdateErrorsAction(selectedIds, bulkAction as any);
      if (res.success) {
        setSelectedIds([]);
        setBulkAction("");
        fetchFilteredData();
      } else {
        alert(res.error || "Failed to execute bulk action");
      }
    } catch (err) {
      alert("An error occurred during bulk operation");
    } finally {
      setIsBulkLoading(false);
    }
  };

  // Severity style helper
  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case "Critical":
        return "bg-red-50 text-red-700 border-red-200";
      case "High":
        return "bg-orange-50 text-orange-700 border-orange-200";
      case "Medium":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Low":
      default:
        return "bg-blue-50 text-blue-700 border-blue-200";
    }
  };

  // Status style helper
  const getStatusBadge = (st: string) => {
    switch (st) {
      case "Open":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "Investigating":
        return "bg-amber-50 text-amber-800 border-amber-200";
      case "Resolved":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Ignored":
      default:
        return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  const activeFilterCount =
    (search ? 1 : 0) +
    (errorType !== "ALL" ? 1 : 0) +
    (severity !== "ALL" ? 1 : 0) +
    (status !== "ALL" ? 1 : 0) +
    (environment !== "ALL" ? 1 : 0) +
    (toolSlug !== "ALL" ? 1 : 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <AlertTriangle className="w-7 h-7 text-orange-600" />
            Error Monitoring & Diagnostics
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Centralized error tracking, stack trace inspection, automated deduplication, and resolution workflows.
          </p>
        </div>

        <button
          onClick={() => fetchFilteredData()}
          disabled={isPending}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-sm transition-colors disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${isPending ? "animate-spin text-orange-600" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Counter Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* All Errors */}
        <button
          onClick={() => handleTabChange("ALL")}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            status.toUpperCase() === "ALL" && severity.toUpperCase() === "ALL"
              ? "bg-slate-100 border-slate-400 ring-2 ring-slate-400/40 shadow-sm"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">All Errors</div>
          <div className="text-xl font-bold mt-1 text-slate-900">{data.counters.all}</div>
        </button>

        {/* Open */}
        <button
          onClick={() => handleTabChange("Open")}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            status.toLowerCase() === "open"
              ? "bg-rose-50 border-rose-400 ring-2 ring-rose-400/40 shadow-sm"
              : "bg-white border-slate-200 hover:border-rose-300"
          }`}
        >
          <div className="text-xs font-semibold uppercase tracking-wider text-rose-600">
            Open
          </div>
          <div className="text-xl font-bold mt-1 text-rose-700">{data.counters.open}</div>
        </button>

        {/* Investigating */}
        <button
          onClick={() => handleTabChange("Investigating")}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            status.toLowerCase() === "investigating"
              ? "bg-amber-50 border-amber-400 ring-2 ring-amber-400/40 shadow-sm"
              : "bg-white border-slate-200 hover:border-amber-300"
          }`}
        >
          <div className="text-xs font-semibold uppercase tracking-wider text-amber-600">Investigating</div>
          <div className="text-xl font-bold mt-1 text-amber-700">{data.counters.investigating}</div>
        </button>

        {/* Resolved */}
        <button
          onClick={() => handleTabChange("Resolved")}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            status.toLowerCase() === "resolved"
              ? "bg-emerald-50 border-emerald-400 ring-2 ring-emerald-400/40 shadow-sm"
              : "bg-white border-slate-200 hover:border-emerald-300"
          }`}
        >
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Resolved</div>
          <div className="text-xl font-bold mt-1 text-emerald-700">{data.counters.resolved}</div>
        </button>

        {/* Ignored */}
        <button
          onClick={() => handleTabChange("Ignored")}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            status.toLowerCase() === "ignored"
              ? "bg-slate-100 border-slate-400 ring-2 ring-slate-400/40 shadow-sm"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Ignored</div>
          <div className="text-xl font-bold mt-1 text-slate-700">{data.counters.ignored}</div>
        </button>

        {/* Critical */}
        <button
          onClick={() => {
            setSeverity("Critical");
            setStatus("ALL");
            fetchFilteredData({ severity: "Critical", status: "ALL", page: 1 });
          }}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            severity.toLowerCase() === "critical"
              ? "bg-red-50 border-red-400 ring-2 ring-red-400/40 shadow-sm"
              : "bg-white border-slate-200 hover:border-red-300"
          }`}
        >
          <div className="text-xs font-semibold uppercase tracking-wider text-red-600">Critical</div>
          <div className="text-xl font-bold mt-1 text-red-700">{data.counters.critical}</div>
        </button>

        {/* High */}
        <button
          onClick={() => {
            setSeverity("High");
            setStatus("ALL");
            fetchFilteredData({ severity: "High", status: "ALL", page: 1 });
          }}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            severity.toLowerCase() === "high"
              ? "bg-orange-50 border-orange-400 ring-2 ring-orange-400/40 shadow-sm"
              : "bg-white border-slate-200 hover:border-orange-300"
          }`}
        >
          <div className="text-xs font-semibold uppercase tracking-wider text-orange-600">High</div>
          <div className="text-xl font-bold mt-1 text-orange-700">{data.counters.high}</div>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search Error ID, code, message, tool, user..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white text-slate-900 placeholder:text-slate-400"
            />
          </div>

          {/* Error Type Filter */}
          <div>
            <select
              value={errorType}
              onChange={(e) => {
                setErrorType(e.target.value);
                setPage(1);
                fetchFilteredData({ errorType: e.target.value, page: 1 });
              }}
              className="w-full py-2 px-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-700"
            >
              <option value="ALL">All Error Types</option>
              <option value="Tool Failure">Tool Failure</option>
              <option value="API Failure">API Failure</option>
              <option value="Server Error">Server Error</option>
              <option value="404 Error">404 Error</option>
              <option value="Upload Failure">Upload Failure</option>
              <option value="AI Failure">AI Failure</option>
              <option value="Payment Failure">Payment Failure</option>
              <option value="Authentication Failure">Auth Failure</option>
              <option value="Database Failure">Database Failure</option>
              <option value="External Service Failure">External Service</option>
            </select>
          </div>

          {/* Severity Filter */}
          <div>
            <select
              value={severity}
              onChange={(e) => {
                setSeverity(e.target.value);
                setPage(1);
                fetchFilteredData({ severity: e.target.value, page: 1 });
              }}
              className="w-full py-2 px-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-700"
            >
              <option value="ALL">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={
                status.toLowerCase() === "all"
                  ? "ALL"
                  : status.toLowerCase() === "open"
                  ? "Open"
                  : status.toLowerCase() === "investigating"
                  ? "Investigating"
                  : status.toLowerCase() === "resolved"
                  ? "Resolved"
                  : status.toLowerCase() === "ignored"
                  ? "Ignored"
                  : status
              }
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
                fetchFilteredData({ status: e.target.value, page: 1 });
              }}
              className="w-full py-2 px-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-700"
            >
              <option value="ALL">All Statuses</option>
              <option value="Open">Open</option>
              <option value="Investigating">Investigating</option>
              <option value="Resolved">Resolved</option>
              <option value="Ignored">Ignored</option>
            </select>
          </div>

          {/* Environment Filter */}
          <div>
            <select
              value={environment}
              onChange={(e) => {
                setEnvironment(e.target.value);
                setPage(1);
                fetchFilteredData({ environment: e.target.value, page: 1 });
              }}
              className="w-full py-2 px-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-700"
            >
              <option value="ALL">All Environments</option>
              <option value="Production">Production</option>
              <option value="Staging">Staging</option>
              <option value="Development">Development</option>
            </select>
          </div>
        </div>

        {/* Action / Reset Bar */}
        {activeFilterCount > 0 && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div className="text-xs text-slate-500">
              Showing filtered results ({data.pagination.totalCount} matching errors)
            </div>
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 text-xs font-medium text-orange-600 hover:text-orange-700"
            >
              <X className="w-3.5 h-3.5" />
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Bulk Action Controls */}
      {selectedIds.length > 0 && (
        <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl flex items-center justify-between gap-4">
          <div className="text-sm font-medium text-orange-900">
            {selectedIds.length} item{selectedIds.length > 1 ? "s" : ""} selected
          </div>
          <div className="flex items-center gap-2">
            <select
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value)}
              className="py-1.5 px-3 text-xs bg-white border border-orange-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">Select Bulk Action...</option>
              <option value="mark_open">Mark as Open</option>
              <option value="mark_investigating">Mark as Investigating</option>
              <option value="mark_resolved">Mark as Resolved</option>
              <option value="mark_ignored">Mark as Ignored</option>
              <option value="delete">Delete Selected</option>
            </select>
            <button
              onClick={handleApplyBulkAction}
              disabled={!bulkAction || isBulkLoading}
              className="px-3 py-1.5 text-xs font-medium bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
            >
              {isBulkLoading ? "Applying..." : "Apply"}
            </button>
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="p-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={data.items.length > 0 && selectedIds.length === data.items.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                  />
                </th>
                <th className="p-4">Error ID</th>
                <th className="p-4">Severity</th>
                <th className="p-4">Type</th>
                <th className="p-4">Tool</th>
                <th className="p-4 min-w-[240px]">Code & Message</th>
                <th className="p-4">User</th>
                <th className="p-4">Env</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Occur.</th>
                <th className="p-4">Timestamp</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.items.length === 0 ? (
                <tr>
                  <td colSpan={12} className="p-8 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <AlertTriangle className="w-8 h-8 text-slate-300" />
                      <div className="font-medium text-slate-700">No error logs found</div>
                      <p className="text-xs text-slate-400 max-w-sm">
                        No application errors match your current search and filter criteria.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                data.items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item.id)}
                        onChange={(e) => handleSelectOne(item.id, e.target.checked)}
                        className="rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                      />
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <Link
                        href={`/admin/error-monitoring/${item.id}`}
                        className="font-mono text-xs font-semibold text-orange-600 hover:text-orange-700 hover:underline"
                      >
                        {item.errorId}
                      </Link>
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getSeverityBadge(
                          item.severity
                        )}`}
                      >
                        {item.severity}
                      </span>
                    </td>
                    <td className="p-4 whitespace-nowrap text-xs font-medium text-slate-700">
                      {item.errorType}
                    </td>
                    <td className="p-4 whitespace-nowrap text-xs">
                      {item.toolSlug ? (
                        <span className="font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                          {item.toolSlug}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="p-4 max-w-xs">
                      {item.errorCode && (
                        <span className="text-[11px] font-mono font-semibold text-slate-500 block mb-0.5">
                          [{item.errorCode}]
                        </span>
                      )}
                      <p className="text-xs font-medium text-slate-900 truncate" title={item.message}>
                        {item.message}
                      </p>
                      {item.endpoint && (
                        <span className="text-[11px] text-slate-400 font-mono truncate block mt-0.5">
                          {item.method || "GET"} {item.endpoint}
                        </span>
                      )}
                    </td>
                    <td className="p-4 whitespace-nowrap text-xs">
                      {item.userEmail ? (
                        <span className="text-slate-800 font-medium" title={item.userEmail}>
                          {item.userEmail}
                        </span>
                      ) : (
                        <span className="text-slate-400">Anonymous</span>
                      )}
                    </td>
                    <td className="p-4 whitespace-nowrap text-xs">
                      <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        {item.environment}
                      </span>
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(
                          item.status
                        )}`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="p-4 whitespace-nowrap text-center text-xs font-semibold text-slate-700">
                      {item.occurrences > 1 ? (
                        <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                          {item.occurrences}x
                        </span>
                      ) : (
                        "1"
                      )}
                    </td>
                    <td className="p-4 whitespace-nowrap text-xs text-slate-500">
                      {new Date(item.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="p-4 whitespace-nowrap text-right text-xs">
                      <Link
                        href={`/admin/error-monitoring/${item.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-orange-50 hover:text-orange-600 rounded-md transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Inspect
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {data.pagination.totalPages > 1 && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <div className="text-xs text-slate-500">
              Page {data.pagination.page} of {data.pagination.totalPages} ({data.pagination.totalCount} total errors)
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const p = page - 1;
                  setPage(p);
                  fetchFilteredData({ page: p });
                }}
                disabled={page <= 1 || isPending}
                className="p-1.5 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg bg-white disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-semibold px-2 text-slate-700">{page}</span>
              <button
                onClick={() => {
                  const p = page + 1;
                  setPage(p);
                  fetchFilteredData({ page: p });
                }}
                disabled={page >= data.pagination.totalPages || isPending}
                className="p-1.5 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg bg-white disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
