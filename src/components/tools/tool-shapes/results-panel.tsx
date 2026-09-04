import type { ResultItem } from "@/types/tools";

export function ResultsPanel({ results }: { results: ResultItem[] }) {
  return (
    <dl className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-slate-50">
      {results.map((r) => (
        <div key={r.label} className="flex items-baseline justify-between gap-4 px-4 py-2.5">
          <dt className={`text-sm ${r.emphasis ? "font-semibold text-slate-900" : "text-slate-600"}`}>
            {r.label}
          </dt>
          <dd
            className={
              r.emphasis
                ? "text-lg font-bold text-indigo-700"
                : "text-sm font-medium text-slate-900"
            }
          >
            {r.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
