"use client";
import { useState } from "react";
import Link from "next/link";
import { AlertCircle, AlertTriangle, CheckCircle, ExternalLink } from "lucide-react";

export function ValidationClient({ validations }: { validations: any[] }) {
  const [filter, setFilter] = useState("ALL");

  const filtered = validations.filter(v => filter === "ALL" || v.status === filter);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
        <h3 className="font-semibold text-slate-900">Scan Results</h3>
        <select value={filter} onChange={e => setFilter(e.target.value)} className="border-slate-300 rounded-md py-1.5 px-3 text-sm focus:ring-orange-500">
          <option value="ALL">All Tools</option>
          <option value="ERROR">Errors Only</option>
          <option value="WARNING">Warnings Only</option>
          <option value="PASSED">Passed</option>
        </select>
      </div>

      <div className="divide-y divide-slate-200 max-h-[600px] overflow-y-auto">
        {filtered.map(v => (
          <div key={v.slug} className="p-4 hover:bg-slate-50 flex items-start gap-4">
            <div className="mt-1">
              {v.status === "ERROR" && <AlertCircle className="w-5 h-5 text-red-500" />}
              {v.status === "WARNING" && <AlertTriangle className="w-5 h-5 text-yellow-500" />}
              {v.status === "PASSED" && <CheckCircle className="w-5 h-5 text-green-500" />}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Link href={`/admin/seo/tools/${v.slug}`} className="font-medium text-slate-900 hover:text-orange-600">{v.name}</Link>
                <span className="text-xs text-slate-500">/{v.slug}</span>
                {v.isOverride && <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wider">Custom</span>}
              </div>
              <div className="mt-2 space-y-1">
                {v.errors.map((e: string, i: number) => <div key={i} className="text-sm text-red-600 flex items-center gap-1">• {e}</div>)}
                {v.warnings.map((w: string, i: number) => <div key={i} className="text-sm text-yellow-600 flex items-center gap-1">• {w}</div>)}
                {v.status === "PASSED" && <div className="text-sm text-slate-500">All basic SEO checks passed.</div>}
              </div>
            </div>
            <div>
              <Link href={`/admin/seo/tools/${v.slug}`} className="text-sm font-medium text-blue-600 hover:underline">Fix Issues</Link>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="p-8 text-center text-slate-500">No tools found matching the filter.</div>}
      </div>
    </div>
  );
}
