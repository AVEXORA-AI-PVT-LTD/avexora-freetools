import { requireAdminAuth } from "@/server/admin-auth";
import { notFound } from "next/navigation";
import { getSingleToolAnalyticsAction } from "../../analytics-actions";
import Link from "next/link";
import {
  ArrowLeft,
  Wrench,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  CreditCard,
  Users,
  LineChart,
} from "lucide-react";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export const metadata = {
  title: "Tool Drilldown Analytics | Avex Tools Admin",
};

export default async function ToolAnalyticsDrilldownPage({ params }: PageProps) {
  await requireAdminAuth("analytics.view");

  const { slug } = await params;
  const data = await getSingleToolAnalyticsAction(slug, { range: "30days" });

  if (!data) {
    notFound();
  }

  const { tool, stats } = data;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div>
        <Link
          href="/admin/analytics"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Analytics Overview
        </Link>
      </div>

      {/* Tool Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span>{tool.category}</span>
            <span>•</span>
            <span>{tool.slug}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1 flex items-center gap-2">
            <Wrench className="w-7 h-7 text-orange-600" />
            {tool.name} — Analytics Drilldown
          </h1>
        </div>

        <Link
          href={`/admin/tools/${tool.slug}`}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-sm transition-colors self-start sm:self-auto"
        >
          Edit Tool Config
        </Link>
      </div>

      {/* Performance Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-1">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Views</div>
          <div className="text-2xl font-extrabold text-slate-900">{stats.views.toLocaleString()}</div>
          <p className="text-xs text-slate-400">Page & Tool impressions</p>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-1">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Executions</div>
          <div className="text-2xl font-extrabold text-orange-600">{stats.executions.current.toLocaleString()}</div>
          <p className="text-xs text-slate-400">Previous period: {stats.executions.previous.toLocaleString()}</p>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-1">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Success Rate</div>
          <div className="text-2xl font-extrabold text-emerald-700">{stats.successRate}%</div>
          <p className="text-xs text-slate-400">Failed executions: {stats.failed}</p>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-1">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg Execution Time</div>
          <div className="text-2xl font-extrabold text-slate-900">{stats.avgExecutionTimeMs} ms</div>
          <p className="text-xs text-slate-400">Target latency: &lt;300ms</p>
        </div>
      </div>

      {/* Attribution Conversion Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-6 bg-slate-900 text-white rounded-2xl shadow-sm space-y-2">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4 text-orange-400" /> Signups Generated
          </div>
          <div className="text-3xl font-extrabold text-white">+{stats.signupsAttributed}</div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Users who registered within the 7-day attribution window after using {tool.name}.
          </p>
        </div>

        <div className="p-6 bg-slate-900 text-white rounded-2xl shadow-sm space-y-2">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-400" /> Subscriptions Generated
          </div>
          <div className="text-3xl font-extrabold text-emerald-400">+{stats.subsAttributed}</div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Users who converted to a paid plan after utilizing {tool.name}.
          </p>
        </div>
      </div>
    </div>
  );
}
