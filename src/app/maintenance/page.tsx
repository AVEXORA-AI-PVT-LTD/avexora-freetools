import React from "react";
import Link from "next/link";
import { Wrench, Clock, ShieldCheck, ArrowLeft } from "lucide-react";
import { getMaintenanceModeStatus } from "@/server/admin/maintenance-service";

export const metadata = {
  title: "Under Maintenance — Avex Tools",
  description: "Avex Tools is currently undergoing scheduled maintenance.",
};

export default async function MaintenancePage() {
  const maintenance = await getMaintenanceModeStatus();

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100 flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-zinc-800/80 border border-zinc-700/80 rounded-2xl p-8 shadow-2xl backdrop-blur-md">
        {/* Brand Icon */}
        <div className="inline-flex p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-400 mb-6">
          <Wrench className="h-10 w-10 animate-pulse" />
        </div>

        {/* Brand Title */}
        <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
          AVEX TOOLS
        </h1>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-orange-500/15 text-orange-300 border border-orange-500/30 mb-6">
          <ShieldCheck className="h-3.5 w-3.5" />
          Scheduled Maintenance
        </div>

        {/* Maintenance Message */}
        <p className="text-sm text-zinc-300 leading-relaxed mb-6">
          {maintenance.message ||
            "Avex Tools is currently undergoing scheduled maintenance and system optimization. Please check back shortly."}
        </p>

        {/* Estimated Duration */}
        {maintenance.estimatedDuration && (
          <div className="flex items-center justify-center gap-2 text-xs font-medium text-zinc-400 bg-zinc-900/60 p-3 rounded-xl border border-zinc-700/60 mb-6">
            <Clock className="h-4 w-4 text-orange-400" />
            <span>Estimated Duration: {maintenance.estimatedDuration}</span>
          </div>
        )}

        {/* Admin Link */}
        <div className="pt-4 border-t border-zinc-700/60 flex items-center justify-between text-xs text-zinc-400">
          <span>Admin Access Available</span>
          <Link
            href="/admin"
            className="text-orange-400 hover:text-orange-300 font-semibold inline-flex items-center gap-1 hover:underline"
          >
            <span>Admin Portal</span>
            <ArrowLeft className="h-3.5 w-3.5 rotate-180" />
          </Link>
        </div>
      </div>

      <p className="mt-8 text-xs text-zinc-400">
        &copy; {new Date().getFullYear()} Avex Tools. All rights reserved.
      </p>
    </div>
  );
}
