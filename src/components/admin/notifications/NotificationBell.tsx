"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  Check,
  CheckCheck,
  ExternalLink,
  AlertTriangle,
  Info,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import {
  getNotificationsAction,
  getUnreadNotificationCountAction,
  markNotificationReadAction,
  markAllNotificationsReadAction,
} from "@/app/admin/(protected)/notifications/notification-actions";

export function NotificationBell() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Poll unread count on mount & every 30 seconds
  const fetchUnreadCount = async () => {
    try {
      const count = await getUnreadNotificationCountAction();
      setUnreadCount(count);
    } catch {
      // Ignore auth errors silently
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch recent notifications when dropdown opens
  const handleOpenDropdown = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);

    if (nextState) {
      setLoading(true);
      startTransition(async () => {
        const res = await getNotificationsAction({ limit: 6, status: "ALL" });
        setRecentNotifications(res.items);
        setUnreadCount(res.unreadCount);
        setLoading(false);
      });
    }
  };

  // Click single notification
  const handleItemClick = (notif: any) => {
    setIsOpen(false);
    startTransition(async () => {
      if (notif.status === "UNREAD") {
        await markNotificationReadAction(notif.id);
        fetchUnreadCount();
      }
      if (notif.actionUrl) {
        router.push(notif.actionUrl);
      }
    });
  };

  // Mark all read
  const handleMarkAllRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    startTransition(async () => {
      await markAllNotificationsReadAction();
      setUnreadCount(0);
      setRecentNotifications((prev) => prev.map((n) => ({ ...n, status: "READ" })));
    });
  };

  return (
    <div className="relative">
      {/* Bell Trigger Button */}
      <button
        onClick={handleOpenDropdown}
        className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none"
        title="Admin Notifications"
      >
        <Bell className="w-5 h-5 text-slate-700" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-[20px] px-1 text-[11px] font-extrabold text-white bg-orange-600 rounded-full shadow-sm animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden space-y-0">
            {/* Dropdown Header */}
            <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-orange-600" />
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Notifications ({unreadCount} Unread)
                </span>
              </div>

              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  disabled={isPending}
                  className="text-[11px] font-semibold text-orange-600 hover:text-orange-700 hover:underline flex items-center gap-1"
                >
                  <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                </button>
              )}
            </div>

            {/* List Body */}
            <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
              {loading ? (
                <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-orange-600" /> Loading notifications...
                </div>
              ) : recentNotifications.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 space-y-1">
                  <Sparkles className="w-6 h-6 mx-auto text-slate-300" />
                  <div className="font-semibold text-slate-600">No Notifications</div>
                  <p>You're all caught up!</p>
                </div>
              ) : (
                recentNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => handleItemClick(notif)}
                    className={`p-3.5 cursor-pointer transition-colors flex items-start gap-3 hover:bg-slate-50/90 select-none ${
                      notif.status === "UNREAD" ? "bg-orange-50/40 font-medium" : "bg-white"
                    }`}
                  >
                    {/* Severity Icon */}
                    <div className="mt-0.5 shrink-0">
                      {notif.severity === "CRITICAL" || notif.severity === "ERROR" ? (
                        <div className="p-1.5 bg-rose-100 text-rose-700 rounded-lg">
                          <XCircle className="w-4 h-4" />
                        </div>
                      ) : notif.severity === "WARNING" ? (
                        <div className="p-1.5 bg-amber-100 text-amber-800 rounded-lg">
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                      ) : notif.severity === "SUCCESS" ? (
                        <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="p-1.5 bg-slate-100 text-slate-700 rounded-lg">
                          <Info className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-0.5 overflow-hidden">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-slate-900 truncate">{notif.title}</span>
                        {notif.status === "UNREAD" && (
                          <span className="w-2 h-2 rounded-full bg-orange-600 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-tight">{notif.message}</p>
                      <div className="text-[10px] text-slate-400 pt-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(notif.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-center">
              <Link
                href="/admin/notifications"
                onClick={() => setIsOpen(false)}
                className="text-xs font-semibold text-orange-600 hover:text-orange-700 hover:underline inline-flex items-center gap-1"
              >
                View all notifications <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
