import type { ResultItem, ResultTable } from "@/types/tools";

export function ResultsPanel({
  results,
  tables,
}: {
  results: ResultItem[];
  tables?: ResultTable[];
}) {
  return (
    <div className="space-y-4">
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
      {tables?.map((t, i) => (
        <table
          key={i}
          className="w-full overflow-hidden rounded-lg border border-slate-200 text-left text-sm"
        >
          {t.title && (
            <caption className="bg-slate-100 px-4 py-2 text-left text-sm font-semibold text-slate-700">
              {t.title}
            </caption>
          )}
          <thead className="bg-slate-100 text-slate-600">
            <tr>
              {t.headers.map((h) => (
                <th key={h} scope="col" className="px-4 py-2 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white text-slate-700">
            {t.rows.map((row, ri) => (
              <tr key={ri} className="border-t border-slate-100">
                {row.map((cell, ci) => (
                  <td key={ci} className="px-4 py-2">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ))}
    </div>
  );
}
