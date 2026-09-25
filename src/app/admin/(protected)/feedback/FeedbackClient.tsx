"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  MessageSquare, 
  Search, 
  Filter, 
  CheckSquare, 
  Square, 
  Trash2, 
  UserCheck, 
  Tag, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  ShieldAlert, 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw, 
  ExternalLink, 
  MoreHorizontal,
  User,
  Wrench,
  Sparkles,
  Inbox,
  AlertTriangle
} from "lucide-react";
import { 
  getFeedbackSubmissionsAction, 
  bulkUpdateFeedbackAction, 
  updateFeedbackStatusAction, 
  updateFeedbackPriorityAction, 
  assignFeedbackAction, 
  deleteFeedbackAction 
} from "./feedback-actions";

export function FeedbackClient() {
  const [items, setItems] = useState<any[]>([]);
  const [counts, setCounts] = useState<any>({
    all: 0,
    new: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0,
    spam: 0,
    urgent: 0,
    unassigned: 0,
  });
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [assignedFilter, setAssignedFilter] = useState("all");
  const [toolFilter, setToolFilter] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Selection & Bulk Actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkActioning, setBulkActioning] = useState(false);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const res = await getFeedbackSubmissionsAction({
        page,
        limit: 15,
        search,
        type: typeFilter,
        status: statusFilter,
        priority: priorityFilter,
        assignedAdminId: assignedFilter,
        toolSlug: toolFilter,
        sortBy,
        sortOrder,
      });

      setItems(res.items);
      setTotal(res.total);
      setPages(res.pages);
      setCounts(res.counts);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSubmissions();
    }, 300);
    return () => clearTimeout(timer);
  }, [page, search, typeFilter, statusFilter, priorityFilter, assignedFilter, toolFilter, sortBy, sortOrder]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(items.map((i) => i.id));
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

  const handleClearFilters = () => {
    setSearch("");
    setTypeFilter("all");
    setStatusFilter("all");
    setPriorityFilter("all");
    setAssignedFilter("all");
    setToolFilter("all");
    setPage(1);
  };

  const handleBulkAction = async (
    action: "status" | "priority" | "assign" | "spam" | "delete",
    val?: any
  ) => {
    if (selectedIds.length === 0) return;
    if (action === "delete" && !confirm(`Are you sure you want to permanently delete ${selectedIds.length} submission(s)?`)) {
      return;
    }

    try {
      setBulkActioning(true);
      await bulkUpdateFeedbackAction(selectedIds, action, val);
      setSelectedIds([]);
      await fetchSubmissions();
    } catch (err: any) {
      alert(err.message || "Bulk action failed.");
    } finally {
      setBulkActioning(false);
    }
  };

  const handleDeleteOne = async (id: string) => {
    if (!confirm("Are you sure you want to delete this submission?")) return;
    try {
      await deleteFeedbackAction(id);
      fetchSubmissions();
    } catch (err: any) {
      alert(err.message || "Failed to delete submission.");
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "Bug Report":
        return <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">Bug Report</span>;
      case "Feature Request":
        return <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">Feature Request</span>;
      case "Tool Feedback":
        return <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Tool Feedback</span>;
      case "Review":
        return <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">Review</span>;
      default:
        return <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">Contact</span>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "Urgent":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <AlertTriangle className="h-3 w-3 text-rose-600" />
            Urgent
          </span>
        );
      case "High":
        return <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200">High</span>;
      case "Medium":
        return <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">Medium</span>;
      default:
        return <span className="px-2.5 py-1 rounded-md text-xs text-slate-600 bg-slate-100 border border-slate-200">Low</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "New":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            New
          </span>
        );
      case "In Progress":
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">In Progress</span>;
      case "Resolved":
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">Resolved</span>;
      case "Closed":
        return <span className="px-2.5 py-1 rounded-full text-xs text-slate-600 bg-slate-100 border border-slate-200">Closed</span>;
      case "Spam":
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">Spam</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs text-slate-600 bg-slate-100">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-orange-600" />
            Contact & Feedback Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Review user inquiries, bug reports, tool feedback, and feature requests.
          </p>
        </div>

        <button
          onClick={fetchSubmissions}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-orange-600" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* KPI & Status Filter Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <button
          onClick={() => { setStatusFilter("all"); setPage(1); }}
          className={`flex flex-col justify-between rounded-xl border p-4 text-left transition-all ${
            statusFilter === "all"
              ? "border-orange-500 bg-orange-50/50 shadow-sm"
              : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <span className="text-xs font-semibold text-slate-500">All Submissions</span>
          <span className="mt-2 text-2xl font-bold text-slate-900">{counts.all}</span>
        </button>

        <button
          onClick={() => { setStatusFilter("New"); setPage(1); }}
          className={`flex flex-col justify-between rounded-xl border p-4 text-left transition-all ${
            statusFilter === "New"
              ? "border-emerald-500 bg-emerald-50/60 shadow-sm"
              : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">New / Unread</span>
            {counts.new > 0 && (
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            )}
          </div>
          <span className="mt-2 text-2xl font-bold text-emerald-700">{counts.new}</span>
        </button>

        <button
          onClick={() => { setStatusFilter("In Progress"); setPage(1); }}
          className={`flex flex-col justify-between rounded-xl border p-4 text-left transition-all ${
            statusFilter === "In Progress"
              ? "border-blue-500 bg-blue-50/60 shadow-sm"
              : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <span className="text-xs font-semibold text-slate-500">In Progress</span>
          <span className="mt-2 text-2xl font-bold text-blue-700">{counts.inProgress}</span>
        </button>

        <button
          onClick={() => { setStatusFilter("Resolved"); setPage(1); }}
          className={`flex flex-col justify-between rounded-xl border p-4 text-left transition-all ${
            statusFilter === "Resolved"
              ? "border-green-500 bg-green-50/60 shadow-sm"
              : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <span className="text-xs font-semibold text-slate-500">Resolved</span>
          <span className="mt-2 text-2xl font-bold text-green-700">{counts.resolved}</span>
        </button>

        <button
          onClick={() => { setPriorityFilter("Urgent"); setPage(1); }}
          className={`flex flex-col justify-between rounded-xl border p-4 text-left transition-all ${
            priorityFilter === "Urgent"
              ? "border-rose-500 bg-rose-50/60 shadow-sm"
              : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <span className="text-xs font-semibold text-rose-700">Urgent Tickets</span>
          <span className="mt-2 text-2xl font-bold text-rose-700">{counts.urgent}</span>
        </button>

        <button
          onClick={() => { setStatusFilter("Spam"); setPage(1); }}
          className={`flex flex-col justify-between rounded-xl border p-4 text-left transition-all ${
            statusFilter === "Spam"
              ? "border-slate-400 bg-slate-100 shadow-sm"
              : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <span className="text-xs font-semibold text-slate-500">Spam</span>
          <span className="mt-2 text-2xl font-bold text-slate-700">{counts.spam}</span>
        </button>
      </div>

      {/* Toolbar: Search & Filters */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by ref # (FB-10231), name, email, subject, message, or tool slug..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-4 py-2 text-sm text-slate-900 focus:border-orange-500 focus:outline-none"
            />
          </div>

          {/* Filters Group */}
          <div className="flex flex-wrap gap-2 items-center">
            {/* Type */}
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-orange-500 focus:outline-none"
            >
              <option value="all">All Types</option>
              <option value="Contact">Contact</option>
              <option value="Bug Report">Bug Report</option>
              <option value="Feature Request">Feature Request</option>
              <option value="Tool Feedback">Tool Feedback</option>
              <option value="Review">Review</option>
            </select>

            {/* Status */}
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-orange-500 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="New">New</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
              <option value="Spam">Spam</option>
            </select>

            {/* Priority */}
            <select
              value={priorityFilter}
              onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-orange-500 focus:outline-none"
            >
              <option value="all">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>

            {/* Assigned */}
            <select
              value={assignedFilter}
              onChange={(e) => { setAssignedFilter(e.target.value); setPage(1); }}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-orange-500 focus:outline-none"
            >
              <option value="all">All Assignments</option>
              <option value="unassigned">Unassigned Only</option>
            </select>

            {(search || typeFilter !== "all" || statusFilter !== "all" || priorityFilter !== "all" || assignedFilter !== "all") && (
              <button
                onClick={handleClearFilters}
                className="text-xs text-orange-600 font-semibold underline px-2 py-1"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Bulk Action Controls */}
        {selectedIds.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg bg-orange-50 border border-orange-200 p-2.5">
            <span className="text-xs font-bold text-orange-900 px-2">
              {selectedIds.length} Selected
            </span>

            <button
              onClick={() => handleBulkAction("status", "In Progress")}
              disabled={bulkActioning}
              className="rounded bg-white px-2.5 py-1 text-xs font-semibold text-blue-700 border border-blue-200 hover:bg-blue-50"
            >
              Mark In Progress
            </button>

            <button
              onClick={() => handleBulkAction("status", "Resolved")}
              disabled={bulkActioning}
              className="rounded bg-white px-2.5 py-1 text-xs font-semibold text-green-700 border border-green-200 hover:bg-green-50"
            >
              Mark Resolved
            </button>

            <button
              onClick={() => handleBulkAction("priority", "Urgent")}
              disabled={bulkActioning}
              className="rounded bg-white px-2.5 py-1 text-xs font-semibold text-rose-700 border border-rose-200 hover:bg-rose-50"
            >
              Set Urgent
            </button>

            <button
              onClick={() => handleBulkAction("spam")}
              disabled={bulkActioning}
              className="rounded bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 border border-slate-300 hover:bg-slate-100"
            >
              Mark Spam
            </button>

            <button
              onClick={() => handleBulkAction("delete")}
              disabled={bulkActioning}
              className="rounded bg-white px-2.5 py-1 text-xs font-semibold text-rose-700 border border-rose-300 hover:bg-rose-100"
            >
              Delete Selected
            </button>
          </div>
        )}
      </div>

      {/* Main Data Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3.5 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={items.length > 0 && selectedIds.length === items.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-orange-600"
                  />
                </th>
                <th className="px-4 py-3.5">Ref # & Type</th>
                <th className="px-6 py-3.5">Subject & Message</th>
                <th className="px-6 py-3.5">Submitter Context</th>
                <th className="px-4 py-3.5">Priority</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Assigned Admin</th>
                <th className="px-4 py-3.5">Date</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex justify-center items-center gap-2">
                      <RefreshCw className="h-5 w-5 animate-spin text-orange-600" />
                      <span>Loading submissions...</span>
                    </div>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Inbox className="h-8 w-8 text-slate-300" />
                      <span className="font-semibold text-slate-700">No submissions found.</span>
                      <span className="text-xs text-slate-400">Try broadening your search or filter parameters.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr
                    key={item.id}
                    className={`transition-colors hover:bg-slate-50/80 ${
                      item.priority === "Urgent" && item.status !== "Resolved" ? "bg-rose-50/30" : ""
                    }`}
                  >
                    <td className="px-4 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item.id)}
                        onChange={(e) => handleSelectOne(item.id, e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-orange-600"
                      />
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span className="font-mono text-xs font-bold text-slate-900">
                          {item.referenceId}
                        </span>
                        <div>{getTypeBadge(item.type)}</div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-col max-w-xs sm:max-w-md">
                        <Link
                          href={`/admin/feedback/${item.id}`}
                          className="font-bold text-slate-900 hover:text-orange-600 line-clamp-1"
                        >
                          {item.subject}
                        </Link>
                        <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                          {item.message}
                        </p>
                        {item.toolSlug && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-orange-600 font-semibold mt-1">
                            <Wrench className="h-3 w-3" />
                            {item.toolSlug}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-slate-400" />
                          {item.name}
                        </span>
                        <span className="text-xs text-slate-500">{item.email}</span>
                        {item.userId && (
                          <span className="mt-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded w-max">
                            Registered User
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap">
                      {getPriorityBadge(item.priority)}
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap">
                      {getStatusBadge(item.status)}
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap text-xs">
                      {item.assignedAdminName ? (
                        <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-1 rounded">
                          {item.assignedAdminName}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap text-xs text-slate-500">
                      {new Date(item.createdAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/feedback/${item.id}`}
                          className="rounded bg-orange-50 px-2.5 py-1.5 text-xs font-semibold text-orange-700 border border-orange-200 hover:bg-orange-100"
                        >
                          View Detail
                        </Link>
                        <button
                          onClick={() => handleDeleteOne(item.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-slate-200 bg-slate-50/50 px-6 py-3.5 text-xs text-slate-500">
          <div>
            Showing <span className="font-bold text-slate-800">{items.length}</span> of{" "}
            <span className="font-bold text-slate-800">{total}</span> submissions
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2.5 py-1 font-semibold text-slate-700 disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Previous</span>
            </button>

            <span className="font-semibold text-slate-800">
              Page {page} of {pages}
            </span>

            <button
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              disabled={page >= pages}
              className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2.5 py-1 font-semibold text-slate-700 disabled:opacity-40"
            >
              <span>Next</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
