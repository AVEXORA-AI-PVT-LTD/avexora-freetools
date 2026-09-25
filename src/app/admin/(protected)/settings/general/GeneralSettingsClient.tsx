"use client";

import React, { useState } from "react";
import Link from "next/link";
import { updateGeneralSettingsAction } from "../settings-actions";
import { Sliders, Save, Loader2, Globe, DollarSign, Clock, Wrench } from "lucide-react";

interface GeneralSettingsProps {
  initialSettings: {
    timezone: string;
    currency: string;
    language: string;
  };
  maintenanceStatus?: any;
}

export function GeneralSettingsClient({ initialSettings, maintenanceStatus }: GeneralSettingsProps) {
  const [timezone, setTimezone] = useState(initialSettings.timezone || "Asia/Kolkata");
  const [currency, setCurrency] = useState(initialSettings.currency || "INR");
  const [language, setLanguage] = useState(initialSettings.language || "English");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const res = await updateGeneralSettingsAction({ timezone, currency, language });
    if (res.success) {
      setMessage({ type: "success", text: "General settings updated successfully!" });
    } else {
      setMessage({ type: "error", text: res.error || "Failed to update general settings" });
    }

    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Sliders className="h-5 w-5 text-orange-600" />
            General Platform Settings
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Configure global timezone defaults, display currency, platform language, and system maintenance status.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-600 text-white font-semibold text-xs hover:bg-orange-700 transition-colors shadow-xs cursor-pointer disabled:opacity-50 self-start sm:self-center"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          <span>Save Changes</span>
        </button>
      </div>

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

      <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
        {/* Timezone */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-orange-600" /> Default IANA Timezone
          </label>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full max-w-md p-2.5 rounded-xl border border-slate-300 bg-white text-xs font-mono text-slate-900 focus:ring-2 focus:ring-orange-500 outline-none"
          >
            <option value="Asia/Kolkata">Asia/Kolkata (IST - UTC+5:30)</option>
            <option value="UTC">UTC (Coordinated Universal Time)</option>
            <option value="America/New_York">America/New_York (EST/EDT)</option>
            <option value="America/Los_Angeles">America/Los_Angeles (PST/PDT)</option>
            <option value="Europe/London">Europe/London (GMT/BST)</option>
            <option value="Europe/Paris">Europe/Paris (CET/CEST)</option>
            <option value="Asia/Tokyo">Asia/Tokyo (JST - UTC+9)</option>
            <option value="Asia/Dubai">Asia/Dubai (GST - UTC+4)</option>
            <option value="Australia/Sydney">Australia/Sydney (AEST)</option>
          </select>
          <p className="text-[11px] text-slate-500 mt-1">Used for admin reporting, publishing schedules, and audit log timestamps.</p>
        </div>

        {/* Currency */}
        <div className="pt-4 border-t border-slate-100">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <DollarSign className="h-4 w-4 text-orange-600" /> Default Platform Currency
          </label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full max-w-md p-2.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-900 focus:ring-2 focus:ring-orange-500 outline-none"
          >
            <option value="INR">INR (₹ - Indian Rupee)</option>
            <option value="USD">USD ($ - US Dollar)</option>
            <option value="EUR">EUR (€ - Euro)</option>
            <option value="GBP">GBP (£ - British Pound)</option>
            <option value="CAD">CAD ($ - Canadian Dollar)</option>
            <option value="AUD">AUD ($ - Australian Dollar)</option>
          </select>
          <p className="text-[11px] text-slate-500 mt-1">Note: Changing the default display currency does not alter historical transaction records.</p>
        </div>

        {/* Language */}
        <div className="pt-4 border-t border-slate-100">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Globe className="h-4 w-4 text-orange-600" /> Default Language
          </label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full max-w-md p-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-orange-500 outline-none"
          >
            <option value="English">English (United States)</option>
          </select>
        </div>

        {/* Maintenance Mode Integration Status */}
        <div className="pt-6 border-t border-slate-100 bg-slate-50 p-4 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wrench className="h-5 w-5 text-orange-600 shrink-0" />
            <div>
              <h4 className="font-bold text-xs text-slate-900">Maintenance Mode Integration</h4>
              <p className="text-[11px] text-slate-600">
                Status: <strong className={maintenanceStatus?.enabled ? "text-rose-600" : "text-emerald-600"}>{maintenanceStatus?.enabled ? "ACTIVE (Site Under Maintenance)" : "INACTIVE (Website Publicly Live)"}</strong>
              </p>
            </div>
          </div>
          <Link
            href="/admin/settings/maintenance/mode"
            className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
          >
            Manage Maintenance
          </Link>
        </div>
      </form>
    </div>
  );
}
