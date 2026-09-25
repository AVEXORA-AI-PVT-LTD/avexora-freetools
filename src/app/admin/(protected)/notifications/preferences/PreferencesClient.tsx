"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { updateNotificationPreferencesAction, getNotificationPreferencesAction } from "../notification-actions";
import { ArrowLeft, Save, RefreshCw, Settings, ShieldCheck, Mail, Bell } from "lucide-react";

interface Props {
  initialPreferences: Awaited<ReturnType<typeof getNotificationPreferencesAction>>;
}

export function PreferencesClient({ initialPreferences }: Props) {
  const [isPending, startTransition] = useTransition();
  const [preferences, setPreferences] = useState(initialPreferences);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Toggle channel preference for specific event type
  const handleToggle = (eventType: string, channel: "dashboardEnabled" | "emailEnabled") => {
    setPreferences((prev) =>
      prev.map((item) =>
        item.eventType === eventType ? { ...item, [channel]: !item[channel] } : item
      )
    );
  };

  // Global Toggle channel
  const handleToggleAllChannel = (channel: "dashboardEnabled" | "emailEnabled", enabled: boolean) => {
    setPreferences((prev) => prev.map((item) => ({ ...item, [channel]: enabled })));
  };

  // Submit preferences
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      const updates = preferences.map((p) => ({
        eventType: p.eventType,
        dashboardEnabled: p.dashboardEnabled,
        emailEnabled: p.emailEnabled,
      }));

      const res = await updateNotificationPreferencesAction(updates);
      if (res.success) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      } else {
        alert("Failed to save notification preferences.");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto pb-12">
      <div>
        <Link
          href="/admin/notifications"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Notification Center
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Settings className="w-7 h-7 text-orange-600" />
            Notification Preferences
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure delivery channels (Admin Dashboard & Email) for each system notification event type.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          {savedSuccess && (
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4" /> Saved!
            </span>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-sm transition-colors disabled:opacity-50"
          >
            {isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Preferences
          </button>
        </div>
      </div>

      {/* Global Quick Controls */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-semibold text-slate-700">
        <div>Bulk Toggle Notification Delivery Channels:</div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => handleToggleAllChannel("dashboardEnabled", true)}
            className="text-orange-600 hover:underline"
          >
            Enable All Dashboard
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => handleToggleAllChannel("emailEnabled", true)}
            className="text-orange-600 hover:underline"
          >
            Enable All Email
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => handleToggleAllChannel("emailEnabled", false)}
            className="text-slate-500 hover:underline"
          >
            Disable All Email
          </button>
        </div>
      </div>

      {/* Preferences Matrix */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="p-4">Notification Event</th>
                <th className="p-4 text-center">
                  <span className="inline-flex items-center gap-1">
                    <Bell className="w-3.5 h-3.5 text-orange-600" /> Admin Dashboard
                  </span>
                </th>
                <th className="p-4 text-center">
                  <span className="inline-flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-blue-600" /> Email Notifications
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {preferences.map((item) => (
                <tr key={item.eventType} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-slate-900">{item.label}</div>
                    <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
                    <div className="font-mono text-[11px] text-slate-400 mt-1">{item.eventType}</div>
                  </td>

                  <td className="p-4 text-center">
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.dashboardEnabled}
                        onChange={() => handleToggle(item.eventType, "dashboardEnabled")}
                        className="w-4 h-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                      />
                    </label>
                  </td>

                  <td className="p-4 text-center">
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.emailEnabled}
                        onChange={() => handleToggle(item.eventType, "emailEnabled")}
                        className="w-4 h-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                      />
                    </label>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </form>
  );
}
