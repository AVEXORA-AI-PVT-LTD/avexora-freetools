import { requireAdminAuth } from "@/server/admin-auth";
import { DateRange } from "@/server/admin/dashboard-stats";
import { getAnalyticsServiceData } from "@/server/admin/analytics-service";
import { Suspense } from "react";
import { DateRangePicker } from "@/components/admin/DateRangePicker";
import { ToolUsageChart } from "@/components/admin/analytics/ToolUsageChart";
import { WebsiteTrafficChart } from "@/components/admin/analytics/WebsiteTrafficChart";
import { RevenueChart } from "@/components/admin/analytics/RevenueChart";
import { TopToolsTable } from "@/components/admin/analytics/TopToolsTable";

export default async function AnalyticsDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  await requireAdminAuth("dashboard.view");
  const params = await searchParams;
  const range = (params.range as DateRange) || "last30days";
  
  const analytics = await getAnalyticsServiceData(range);

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900">Analytics</h1>
          <p className="text-zinc-500 mt-2 text-lg">
            Monitor platform usage, revenue trends, and tool performance.
          </p>
        </div>
        <Suspense fallback={<div className="h-10 w-40 animate-pulse bg-zinc-200 rounded-md" />}><DateRangePicker /></Suspense>
      </div>

      {/* Website Traffic Section */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">Website Traffic</h2>
          <p className="text-zinc-500 text-sm mt-1">Visitor and page view analytics.</p>
        </div>
        <WebsiteTrafficChart />
      </section>

      {/* Tool Usage Section */}
      <section className="space-y-6 pt-6 border-t border-zinc-200">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">Tool Usage</h2>
            <p className="text-zinc-500 text-sm mt-1">Execution volume and failure tracking over time.</p>
          </div>
          <div className="flex gap-4 text-sm">
            <div className="bg-white border border-zinc-200 px-4 py-2 rounded-lg text-center">
              <span className="block text-zinc-500 text-xs font-medium uppercase tracking-wider mb-1">Total Executions</span>
              <span className="font-bold text-zinc-900 text-lg">{analytics.summary.totalExecutions.toLocaleString()}</span>
            </div>
            <div className="bg-white border border-zinc-200 px-4 py-2 rounded-lg text-center">
              <span className="block text-zinc-500 text-xs font-medium uppercase tracking-wider mb-1">Total Failures</span>
              <span className="font-bold text-zinc-900 text-lg">{analytics.summary.totalFailures.toLocaleString()}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
          <ToolUsageChart data={analytics.toolUsageTrend} />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden pt-6">
          <h3 className="px-6 text-lg font-semibold text-zinc-900 mb-6">Top Performing Tools</h3>
          <TopToolsTable tools={analytics.topTools} />
        </div>
      </section>

      {/* Revenue Section */}
      <section className="space-y-6 pt-6 border-t border-zinc-200">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">Revenue & Subscriptions</h2>
          <p className="text-zinc-500 text-sm mt-1">Financial performance and active subscriber growth.</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
          <RevenueChart data={analytics.revenueTrend} />
        </div>
      </section>
    </div>
  );
}
