"use client";

import { AlertCircle } from "lucide-react";

export function WebsiteTrafficChart() {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200 flex flex-col items-center justify-center min-h-[300px]">
      <div className="bg-orange-50 p-3 rounded-full mb-4">
        <AlertCircle className="w-8 h-8 text-orange-600" />
      </div>
      <h3 className="text-lg font-semibold text-zinc-900 mb-2">Website Traffic Analytics Unavailable</h3>
      <p className="text-zinc-500 text-center max-w-sm text-sm">
        The required analytics tracking infrastructure for Visitors, Sessions, and Page Views is not currently integrated into the database.
      </p>
      <div className="mt-6 text-xs text-zinc-400 border border-zinc-200 bg-zinc-50 px-4 py-2 rounded-md">
        Missing Dependencies: <code className="text-zinc-600">Visitor</code>, <code className="text-zinc-600">PageView</code> models.
      </div>
    </div>
  );
}
