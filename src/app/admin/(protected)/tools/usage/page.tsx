import { requireAdminAuth } from "@/server/admin-auth";
import Link from "next/link";
import { getAdminToolsData } from "@/server/admin-tools";

export const metadata = {
  title: "Tool Usage | Avex Tools Admin",
};

export default async function ToolUsagePage() {
  await requireAdminAuth("analytics.view");

  const tools = await getAdminToolsData();
  const sortedByUsage = [...tools].sort((a, b) => b.usage - a.usage);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tool Usage Report</h1>
          <p className="text-sm text-slate-500">View execution metrics for all your tools.</p>
        </div>
        <Link
          href="/admin/tools"
          className="inline-flex items-center justify-center rounded-md bg-white border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
        >
          Back to Tools
        </Link>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tool Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Category</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Total Uses</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {sortedByUsage.map((tool) => (
                <tr key={tool.slug}>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm font-medium text-slate-900">{tool.name}</div>
                    <div className="text-sm text-slate-500">{tool.slug}</div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                    {tool.category}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-right text-slate-900">
                    {tool.usage.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
