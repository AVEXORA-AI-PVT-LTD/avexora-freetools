"use client";

import React, { useState, useTransition } from "react";
import { User, Mail, Phone, Building2, Briefcase, CheckCircle2, AlertCircle, Loader2, Save } from "lucide-react";
import { updateAccountDetails } from "@/server/onboarding-actions";

interface AccountUser {
  name: string | null;
  email: string | null;
  phone: string | null;
  companyName: string | null;
  jobRole: string | null;
}

export function AccountSettingsForm({ user }: { user: AccountUser }) {
  const [isPending, startTransition] = useTransition();
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const initial = user.name
    ? user.name.charAt(0).toUpperCase()
    : user.email
    ? user.email.charAt(0).toUpperCase()
    : "U";

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatusMessage(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        await updateAccountDetails(formData);
        setStatusMessage({ type: "success", text: "Your account profile has been updated successfully." });
      } catch (err: any) {
        setStatusMessage({
          type: "error",
          text: err?.message || "Failed to update account. Please try again.",
        });
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* User Header Card */}
      <div className="rounded-3xl border border-stone-200/90 bg-stone-50/70 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-stone-900 border border-stone-800 text-orange-400 font-bold text-xl flex items-center justify-center shadow-md shrink-0">
            {initial}
          </div>
          <div>
            <h2 className="text-lg font-bold text-stone-900">
              {user.name || "Avexora User"}
            </h2>
            <p className="text-xs text-stone-500 font-mono">
              {user.email}
            </p>
            <div className="mt-1.5 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-700 font-mono text-[10px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                <span>PRO WORKSPACE USER</span>
              </span>
              <span className="text-[11px] text-stone-400">• Verified Account</span>
            </div>
          </div>
        </div>
      </div>

      {/* Status Feedback Banner */}
      {statusMessage && (
        <div
          className={`p-4 rounded-2xl border text-xs sm:text-sm flex items-center gap-3 transition-all ${
            statusMessage.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span className="font-medium">{statusMessage.text}</span>
        </div>
      )}

      {/* Main Settings Form */}
      <div className="bg-white border border-stone-200/90 rounded-3xl shadow-sm p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Email (Readonly) */}
            <div className="sm:col-span-2 space-y-1.5">
              <label htmlFor="email" className="flex items-center gap-1.5 text-xs font-mono font-semibold uppercase tracking-wider text-stone-700">
                <Mail className="w-3.5 h-3.5 text-stone-400" />
                <span>Primary Email Address</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                disabled
                defaultValue={user.email ?? ""}
                className="block w-full rounded-xl border border-stone-200 bg-stone-50/80 py-2.5 px-3.5 text-stone-500 text-xs sm:text-sm font-mono cursor-not-allowed"
              />
              <p className="text-[11px] text-stone-400">
                Primary login email is verified and cannot be changed here.
              </p>
            </div>

            {/* Name */}
            <div className="space-y-1.5">
              <label htmlFor="name" className="flex items-center gap-1.5 text-xs font-mono font-semibold uppercase tracking-wider text-stone-700">
                <User className="w-3.5 h-3.5 text-stone-400" />
                <span>Full Name</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                defaultValue={user.name ?? ""}
                placeholder="Abhinav Alok"
                className="block w-full rounded-xl border border-stone-200 bg-white py-2.5 px-3.5 text-stone-900 text-xs sm:text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 focus:outline-none transition shadow-2xs"
              />
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label htmlFor="phone" className="flex items-center gap-1.5 text-xs font-mono font-semibold uppercase tracking-wider text-stone-700">
                <Phone className="w-3.5 h-3.5 text-stone-400" />
                <span>Phone Number</span>
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                defaultValue={user.phone ?? ""}
                placeholder="+91 98765 43210"
                className="block w-full rounded-xl border border-stone-200 bg-white py-2.5 px-3.5 text-stone-900 text-xs sm:text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 focus:outline-none transition shadow-2xs"
              />
            </div>

            {/* Company */}
            <div className="space-y-1.5">
              <label htmlFor="companyName" className="flex items-center gap-1.5 text-xs font-mono font-semibold uppercase tracking-wider text-stone-700">
                <Building2 className="w-3.5 h-3.5 text-stone-400" />
                <span>Company / Entity Name</span>
              </label>
              <input
                id="companyName"
                name="companyName"
                type="text"
                defaultValue={user.companyName ?? ""}
                placeholder="Avexora Technologies Pvt Ltd"
                className="block w-full rounded-xl border border-stone-200 bg-white py-2.5 px-3.5 text-stone-900 text-xs sm:text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 focus:outline-none transition shadow-2xs"
              />
            </div>

            {/* Role */}
            <div className="space-y-1.5">
              <label htmlFor="jobRole" className="flex items-center gap-1.5 text-xs font-mono font-semibold uppercase tracking-wider text-stone-700">
                <Briefcase className="w-3.5 h-3.5 text-stone-400" />
                <span>Designation / Role</span>
              </label>
              <input
                id="jobRole"
                name="jobRole"
                type="text"
                defaultValue={user.jobRole ?? ""}
                placeholder="Founder & CEO"
                className="block w-full rounded-xl border border-stone-200 bg-white py-2.5 px-3.5 text-stone-900 text-xs sm:text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 focus:outline-none transition shadow-2xs"
              />
            </div>
          </div>

          <div className="pt-6 border-t border-stone-100 flex items-center justify-between">
            <span className="text-xs text-stone-400 font-mono">
              Auto-syncs across Brand Studio &amp; EBOS
            </span>
            <button
              type="submit"
              disabled={isPending}
              className="btn-orange-glow !text-white px-6 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
