"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getNotificationsAction,
  markNotificationReadAction,
  markNotificationUnreadAction,
  markAllNotificationsReadAction,
  archiveNotificationAction,
  deleteNotificationAction,
} from "./notification-actions";
import { NOTIFICATION_EVENT_REGISTRY } from "@/lib/notifications/constants";
import {
  Bell,
  Check,
  CheckCheck,
  Archive,
  Trash2,
  ExternalLink,
  Search,
  Filter,
  RefreshCw,
  Settings,
  AlertTriangle,
  Info,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";

interface Props {
  initialData: Awaited<ReturnType<typeof getNotificationsAction>>;
}

export function NotificationsClient({ initialData }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState(initialData);

  // Filter States
  const [statusTab, setStatusTab] = useState<"ALL" | "UNREAD" | "READ" | "ARCHIVED">("ALL");
  const [eventType, setEventType] = useState("ALL");
  const [severity, setSeverity] = useState("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  // Refetch helper
  const handleFilterChange = (overrides: Record<string, any> = {}) => {
    const newParams = {
      status: overrides.status !== undefined ? overrides.status : statusTab,
      type: overrides.type !== undefined ? overrides.type : eventType,
      severity: overrides.severity !== undefined ? overrides.severity : severity,
      search: overrides.search !== undefined ? overrides.search : search,
      page: overrides.page !== undefined ? overrides.page : page,
      limit: overrides.limit !== undefined ? overrides.limit : limit,
    };

    startTransition(async () => {
      const res = await getNotificationsAction(newParams);
      setData(res);
    });
  };

  // Toggle Read / Unread
  const handleToggleRead = (id: string, isRead: boolean) => {
    startTransition(async () => {
      if (isRead) {
        await markNotificationUnreadAction(id);
      } else {
        await markNotificationReadAction(id);
      }
      handleFilterChange({ page });
    });
  };

  // Mark all read
  const handleMarkAllRead = () => {
    startTransition(async () => {
      await markAllNotificationsReadAction();
      handleFilterChange({ page: 1 });
    });
  };

  // Archive Notification
  const handleArchive = (id: string) => {
    startTransition(async () => {
      await archiveNotificationAction(id);
      handleFilterChange({ page });
    });
  };

  // Delete Notification
  const handleDelete = (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete notification "${title}"?`)) return;

    startTransition(async () => {
      await deleteNotificationAction(id);
      handleFilterChange({ page });
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Bell className="w-7 h-7 text-orange-600" />
            Notification Center
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Centralized admin notifications for payments, security alerts, system errors, user activity, and support.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {data.unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
            >
              <CheckCheck className="w-4 h-4 text-orange-600" />
              Mark All Read ({data.unreadCount})
            </button>
          )}

          <Link
            href="/admin/notifications/preferences"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-sm transition-colors"
          >
            <Settings className="w-4 h-4" />
            Preferences
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        {[
          { key: "ALL", label: `All Notifications` },
          { key: "UNREAD", label: `Unread (${data.unreadCount})` },
          { key: "READ", label: "Read" },
          { key: "ARCHIVED", label: "Archived" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              const newTab = tab.key as any;
              setStatusTab(newTab);
              setPage(1);
              handleFilterChange({ status: newTab, page: 1 });
            }}
            className={`py-3 px-5 text-sm font-semibold border-b-2 transition-colors ${
              statusTab === tab.key
                ? "border-orange-600 text-orange-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search notification title or message..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
                handleFilterChange({ search: e.target.value, page: 1 });
              }}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-900 placeholder:text-slate-400"
            />
          </div>

          {/* Event Type */}
          <div>
            <select
              value={eventType}
              onChange={(e) => {
                setEventType(e.target.value);
                setPage(1);
                handleFilterChange({ type: e.target.value, page: 1 });
              }}
              className="w-full py-2 px-3 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-700"
            >
              <option value="ALL">All Event Types</option>
              {Object.values(NOTIFICATION_EVENT_REGISTRY).map((evt) => (
                <option key={evt.type} value={evt.type}>
                  {evt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Severity */}
          <div>
            <select
              value={severity}
              onChange={(e) => {
                setSeverity(e.target.value);
                setPage(1);
                handleFilterChange({ severity: e.target.value, page: 1 });
              }}
              className="w-full py-2 px-3 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-700"
            >
              <option value="ALL">All Severities</option>
              <option value="INFO">INFO</option>
              <option value="SUCCESS">SUCCESS</option>
              <option value="WARNING">WARNING</option>
              <option value="ERROR">ERROR</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Notification List */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden divide-y divide-slate-100">
        {data.items.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <div className="flex flex-col items-center justify-center space-y-2">
              <Sparkles className="w-8 h-8 text-slate-300" />
              <div className="font-medium text-slate-700">No Notifications</div>
              <p className="text-xs text-slate-400 max-w-sm">
                No notifications match your current tab or filter selection.
              </p>
            </div>
          </div>
        ) : (
          data.items.map((notif) => {
            const isRead = notif.status === "READ";
            return (
              <div
                key={notif.id}
                className={`p-4 transition-colors flex items-start justify-between gap-4 ${
                  notif.status === "UNREAD" ? "bg-orange-50/30" : "bg-white"
                }`}
              >
                <div className="flex items-start gap-3.5">
                  {/* Severity Icon */}
                  <div className="mt-0.5 shrink-0">
                    {notif.severity === "CRITICAL" || notif.severity === "ERROR" ? (
                      <div className="p-2 bg-rose-100 text-rose-700 rounded-xl">
                        <XCircle className="w-5 h-5" />
                      </div>
                    ) : notif.severity === "WARNING" ? (
                      <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                    ) : notif.severity === "SUCCESS" ? (
                      <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                    ) : (
                      <div className="p-2 bg-slate-100 text-slate-700 rounded-xl">
                        <Info className="w-5 h-5" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{notif.title}</span>
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                          notif.severity === "CRITICAL"
                            ? "bg-rose-500 text-white"
                            : notif.severity === "WARNING"
                            ? "bg-amber-500 text-white"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {notif.severity}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">{notif.message}</p>

                    <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1">
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3" />
                        {new Date(notif.createdAt).toLocaleString()}
                      </span>

                      {notif.targetType && (
                        <span>
                          Target: <strong className="text-slate-700">{notif.targetName || notif.targetId}</strong> ({notif.targetType})
                        </span>
                      )}

                      {notif.actionUrl && (
                        <Link
                          href={notif.actionUrl}
                          className="font-semibold text-orange-600 hover:underline flex items-center gap-0.5"
                        >
                          View Resource <ExternalLink className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleToggleRead(notif.id, isRead)}
                    disabled={isPending}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                    title={isRead ? "Mark as Unread" : "Mark as Read"}
                  >
                    {isRead ? <Check className="w-4 h-4 text-emerald-600" /> : <CheckCheck className="w-4 h-4" />}
                  </button>

                  {notif.status !== "ARCHIVED" && (
                    <button
                      onClick={() => handleArchive(notif.id)}
                      disabled={isPending}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Archive Notification"
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(notif.id, notif.title)}
                    disabled={isPending}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Notification"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}

        {/* Pagination Bar */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
          <div>
            Showing {data.pagination.totalCount === 0 ? 0 : (page - 1) * limit + 1}–
            {Math.min(page * limit, data.pagination.totalCount)} of {data.pagination.totalCount} notifications
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
    </div>
  );
}
