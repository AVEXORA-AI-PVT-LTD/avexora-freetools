"use client";

import React, { useState } from "react";
import { MaintenanceSubNav } from "@/components/admin/maintenance/MaintenanceSubNav";
import { toggleMaintenanceModeAction } from "../maintenance-actions";
import { Power, ShieldCheck, Loader2, Save } from "lucide-react";

export function MaintenanceModeClient({ initialMode }: { initialMode: any }) {
  const [enabled, setEnabled] = useState<boolean>(Boolean(initialMode?.enabled));
  const [messageText, setMessageText] = useState<string>(
    initialMode?.message || "Avex Tools is currently undergoing scheduled maintenance. Please check back shortly."
  );
  const [duration, setDuration] = useState<string>(initialMode?.estimatedDuration || "30 minutes");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSaveMode = async () => {
    setLoading(true);
    setMessage(null);

    const res = await toggleMaintenanceModeAction(enabled, messageText, duration);
    if (res.success && res.mode) {
      setEnabled(res.mode.enabled);
      setMessage({
        type: "success",
        text: res.mode.enabled
          ? "Maintenance Mode ENABLED. Public traffic is now redirected to /maintenance."
          : "Maintenance Mode DISABLED. Public website is live.",
      });
    } else {
      setMessage({ type: "error", text: res.error || "Failed to update maintenance mode" });
    }

    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Sub Navigation */}
      <MaintenanceSubNav />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Power className="h-6 w-6 text-rose-600" />
            Maintenance Mode Management
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Control platform accessibility. When active, public visitors are redirected to the maintenance page.
          </p>
        </div>

        <button
          onClick={handleSaveMode}
          disabled={loading}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-600 text-white font-semibold text-xs hover:bg-orange-700 transition-colors shadow-xs cursor-pointer disabled:opacity-50 self-start sm:self-center"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          <span>Save Maintenance Settings</span>
        </button>
      </div>

      {/* Feedback Banner */}
      {message && (
        <div
          className={`p-4 rounded-xl text-sm font-medium border ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Admin Bypass Guarantee Box */}
      <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs leading-relaxed flex items-start gap-3">
        <ShieldCheck className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold uppercase tracking-wider block mb-0.5">Admin Session Bypass Guarantee</strong>
          Administrators with active admin portal sessions bypass maintenance mode automatically. You will <strong>NEVER</strong> be locked out of the Admin Panel while maintenance mode is active.
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
        {/* Toggle Switch */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-6">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Maintenance Mode State</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {enabled
                ? "ACTIVE — Public users see /maintenance page"
                : "INACTIVE — Public website is open to all visitors"}
            </p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-rose-600"></div>
          </label>
        </div>

        {/* Visitor Message */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Public Visitor Maintenance Message
          </label>
          <textarea
            rows={3}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            className="w-full p-3 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 focus:ring-2 focus:ring-orange-500 outline-none"
            placeholder="Avex Tools is currently undergoing scheduled maintenance. Please check back shortly."
          />
        </div>

        {/* Estimated Duration */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Estimated Duration
          </label>
          <select
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="w-full max-w-sm p-2.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="15 minutes">15 minutes</option>
            <option value="30 minutes">30 minutes</option>
            <option value="1 hour">1 hour</option>
            <option value="2 hours">2 hours</option>
            <option value="4 hours">4 hours</option>
            <option value="8 hours">8 hours</option>
          </select>
        </div>
      </div>
    </div>
  );
}
