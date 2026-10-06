"use client";

import { useState } from "react";
import type { ResultItem, ResultTable } from "@/types/tools";
import { Copy, Check } from "lucide-react";

export function ResultsPanel({
  results,
  tables,
}: {
  results: ResultItem[];
  tables?: ResultTable[];
}) {
  const [copied, setCopied] = useState(false);

  const handleCopySummary = () => {
    const text = results.map((r) => `${r.label}: ${r.value}`).join("\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center justify-between pb-1">
        <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-stone-500">
          Calculated Outcome
        </h4>
        {results.length > 0 && (
          <button
            type="button"
            onClick={handleCopySummary}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-stone-600 hover:text-stone-900 text-xs font-medium transition cursor-pointer shadow-2xs"
            title="Copy all results to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-semibold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-stone-400" />
                <span>Copy Summary</span>
              </>
            )}
          </button>
        )}
      </div>

      <dl className="divide-y divide-stone-100 rounded-2xl border border-stone-200 bg-stone-50/70 overflow-hidden shadow-2xs">
        {results.map((r) => (
          <div key={r.label} className="flex items-baseline justify-between gap-4 px-4 sm:px-5 py-3">
            <dt className={`text-xs sm:text-sm ${r.emphasis ? "font-bold text-stone-900" : "text-stone-600"}`}>
              {r.label}
            </dt>
            <dd
              className={
                r.emphasis
                  ? "text-base sm:text-lg font-black text-orange-600 font-mono"
                  : "text-xs sm:text-sm font-semibold text-stone-900 font-mono"
              }
            >
              {r.value}
            </dd>
          </div>
        ))}
      </dl>

      {tables?.map((t, i) => (
        <div key={i} className="overflow-x-auto rounded-2xl border border-stone-200 shadow-2xs">
          <table className="w-full text-left text-xs sm:text-sm">
            {t.title && (
              <caption className="bg-stone-100 px-4 py-2.5 text-left text-xs font-mono font-bold text-stone-800 uppercase tracking-wider">
                {t.title}
              </caption>
            )}
            <thead className="bg-stone-100/80 text-stone-600 text-xs font-semibold">
              <tr>
                {t.headers.map((h) => (
                  <th key={h} scope="col" className="px-4 py-2.5">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-stone-100 text-stone-700">
              {t.rows.map((row, ri) => (
                <tr key={ri} className="hover:bg-stone-50/50 transition-colors">
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-4 py-2.5">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
