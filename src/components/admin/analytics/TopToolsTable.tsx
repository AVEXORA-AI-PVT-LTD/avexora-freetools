import { TopToolStats } from "@/server/admin/analytics-service";

export function TopToolsTable({ tools }: { tools: TopToolStats[] }) {
  if (!tools || tools.length === 0) {
    return (
      <div className="py-12 text-center text-zinc-500 bg-zinc-50 rounded-xl border border-zinc-100">
        No tools were executed during this period.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 border-y border-zinc-200">
          <tr>
            <th className="px-6 py-4 font-medium">Tool</th>
            <th className="px-6 py-4 font-medium">Category</th>
            <th className="px-6 py-4 font-medium text-right">Executions</th>
            <th className="px-6 py-4 font-medium text-right">Failures</th>
            <th className="px-6 py-4 font-medium text-right">Success Rate</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200">
          {tools.map((tool) => (
            <tr key={tool.toolSlug} className="hover:bg-zinc-50 transition-colors">
              <td className="px-6 py-4">
                <div className="font-medium text-zinc-900">{tool.toolName}</div>
                <div className="text-xs text-zinc-500 font-mono mt-0.5">{tool.toolSlug}</div>
              </td>
              <td className="px-6 py-4 text-zinc-600">
                <span className="bg-zinc-100 px-2.5 py-1 rounded-md text-xs font-medium">
                  {tool.categoryName}
                </span>
              </td>
              <td className="px-6 py-4 text-right font-semibold text-zinc-900">
                {tool.executions.toLocaleString()}
              </td>
              <td className="px-6 py-4 text-right text-zinc-600">
                {tool.failures > 0 ? (
                  <span className="text-rose-600 font-medium">{tool.failures.toLocaleString()}</span>
                ) : (
                  "0"
                )}
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <span className={`font-medium ${
                    tool.successRate >= 98 ? 'text-emerald-600' : 
                    tool.successRate >= 90 ? 'text-orange-600' : 'text-rose-600'
                  }`}>
                    {tool.successRate.toFixed(1)}%
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
