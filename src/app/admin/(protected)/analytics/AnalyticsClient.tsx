"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { getAnalyticsOverviewAction } from "./analytics-actions";
import { ToolUsageChart } from "@/components/admin/analytics/ToolUsageChart";
import { WebsiteTrafficChart } from "@/components/admin/analytics/WebsiteTrafficChart";
import { RevenueChart } from "@/components/admin/analytics/RevenueChart";
import {
  LineChart,
  TrendingUp,
  TrendingDown,
  Users,
  Eye,
  Wrench,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  RefreshCw,
  Globe,
  Smartphone,
  Laptop,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Layers,
  ChevronRight,
  Filter,
  Search,
  DollarSign,
  UserCheck,
  BarChart3,
  AlertTriangle,
} from "lucide-react";

interface Props {
  initialData: Awaited<ReturnType<typeof getAnalyticsOverviewAction>>;
  activeTab?: "overview" | "website" | "tools" | "users" | "revenue";
}

export function AnalyticsClient({ initialData, activeTab = "overview" }: Props) {
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState(initialData);

  const [range, setRange] = useState(initialData.params.range);
  const [comparePrevious, setComparePrevious] = useState(initialData.params.comparePrevious);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Filters for tools tab
  const [topToolSort, setTopToolSort] = useState<"executions" | "views" | "successRate" | "avgExecutionTimeMs">("executions");
  const [toolSearch, setToolSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Refetch data on filter change
  const handleFetch = (overrides: Record<string, any> = {}) => {
    const newRange = overrides.range !== undefined ? overrides.range : range;
    const newCompare = overrides.comparePrevious !== undefined ? overrides.comparePrevious : comparePrevious;
    const newStart = overrides.startDate !== undefined ? overrides.startDate : startDate;
    const newEnd = overrides.endDate !== undefined ? overrides.endDate : endDate;

    startTransition(async () => {
      const res = await getAnalyticsOverviewAction({
        range: newRange,
        comparePrevious: newCompare,
        startDate: newStart,
        endDate: newEnd,
      });
      setData(res);
    });
  };

  const kpis = data.kpis;

  // Helper for trend badge
  const renderTrendBadge = (pct: number, isIncreaseGood = true) => {
    const isPositive = pct > 0;
    const isNeutral = pct === 0;

    let isGood = isPositive ? isIncreaseGood : !isIncreaseGood;
    if (isNeutral) isGood = true;

    return (
      <span
        className={`inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full ${
          isNeutral
            ? "bg-slate-100 text-slate-600"
            : isGood
            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
            : "bg-rose-50 text-rose-700 border border-rose-200"
        }`}
      >
        {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : isNeutral ? null : <ArrowDownRight className="w-3.5 h-3.5" />}
        {pct > 0 ? `+${pct}%` : `${pct}%`}
      </span>
    );
  };

  // Categories list for tool filter
  const toolCategories = Array.from(new Set(data.topTools.map((t) => t.category)));

  // Filtered and sorted tools
  const filteredTools = data.topTools.filter((t) => {
    const matchesCategory = selectedCategory === "all" || t.category === selectedCategory;
    const matchesSearch =
      t.name.toLowerCase().includes(toolSearch.toLowerCase()) ||
      t.slug.toLowerCase().includes(toolSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const sortedTools = [...filteredTools].sort((a, b) => {
    if (topToolSort === "executions") return b.executions - a.executions;
    if (topToolSort === "views") return b.views - a.views;
    if (topToolSort === "successRate") return b.successRate - a.successRate;
    if (topToolSort === "avgExecutionTimeMs") return a.avgExecutionTimeMs - b.avgExecutionTimeMs;
    return b.executions - a.executions;
  });

  // Calculate failed executions count for tools tab
  const totalFailedExecutions = data.topTools.reduce((acc, t) => acc + t.failed, 0);

  // Tab Header Details
  const tabHeaders = {
    overview: {
      title: "Analytics Overview",
      description: "Real-time summary for website traffic, tool executions, signups, and subscription conversions.",
      icon: LineChart,
      color: "text-orange-600",
    },
    website: {
      title: "Website Traffic Analytics",
      description: "Detailed insights into website visitors, page views, traffic channels, devices, and demographics.",
      icon: Globe,
      color: "text-blue-600",
    },
    tools: {
      title: "Tool Usage & Performance",
      description: "Monitor execution volume, success rates, average latency, and tool popularity rankings.",
      icon: Wrench,
      color: "text-orange-600",
    },
    users: {
      title: "User Signups & Conversions",
      description: "Track user registrations, visitor-to-signup conversion funnel, and channel performance.",
      icon: Users,
      color: "text-emerald-600",
    },
    revenue: {
      title: "Revenue & Subscriptions",
      description: "Gross revenue breakdown, paid subscription conversions, ARPU, and plan performance.",
      icon: Sparkles,
      color: "text-amber-500",
    },
  };

  const currentHeader = tabHeaders[activeTab] || tabHeaders.overview;
  const HeaderIcon = currentHeader.icon;

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <HeaderIcon className={`w-7 h-7 ${currentHeader.color}`} />
            {currentHeader.title}
          </h1>
          <p className="text-sm text-slate-500 mt-1">{currentHeader.description}</p>
        </div>

        <button
          onClick={() => handleFetch()}
          disabled={isPending}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-sm transition-colors disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${isPending ? "animate-spin text-orange-600" : ""}`} />
          Refresh Data
        </button>
      </div>

      {/* Date Range Selector & Period Comparison Control */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <Calendar className="w-4 h-4 text-orange-600 shrink-0" />
            <span className="font-bold text-slate-700 uppercase tracking-wider">Date Range:</span>

            {["today", "yesterday", "7days", "30days", "90days"].map((rKey) => (
              <button
                key={rKey}
                onClick={() => {
                  setRange(rKey);
                  handleFetch({ range: rKey });
                }}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                  range === rKey
                    ? "bg-orange-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {rKey === "today"
                  ? "Today"
                  : rKey === "yesterday"
                  ? "Yesterday"
                  : rKey === "7days"
                  ? "Last 7 Days"
                  : rKey === "30days"
                  ? "Last 30 Days"
                  : "Last 90 Days"}
              </button>
            ))}
          </div>

          {/* Compare Previous Period Toggle */}
          <label className="flex items-center gap-2 cursor-pointer select-none font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={comparePrevious}
              onChange={(e) => {
                const checked = e.target.checked;
                setComparePrevious(checked);
                handleFetch({ comparePrevious: checked });
              }}
              className="rounded border-slate-300 text-orange-600 focus:ring-orange-500"
            />
            Compare Previous Period
          </label>
        </div>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-8">
          {/* Primary KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Visitors */}
            <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <span>Website Visitors</span>
                <Users className="w-4 h-4 text-slate-400" />
              </div>
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-extrabold text-slate-900">{kpis.visitors.current.toLocaleString()}</div>
                {comparePrevious && renderTrendBadge(kpis.visitors.pctChange)}
              </div>
              {comparePrevious && <p className="text-[11px] text-slate-400">Previous: {kpis.visitors.previous.toLocaleString()}</p>}
            </div>

            {/* Tool Executions */}
            <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <span>Tool Executions</span>
                <Wrench className="w-4 h-4 text-orange-500" />
              </div>
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-extrabold text-orange-600">{kpis.executions.current.toLocaleString()}</div>
                {comparePrevious && renderTrendBadge(kpis.executions.pctChange)}
              </div>
              {comparePrevious && <p className="text-[11px] text-slate-400">Previous: {kpis.executions.previous.toLocaleString()}</p>}
            </div>

            {/* Success Rate */}
            <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <span>Execution Success Rate</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-extrabold text-emerald-700">{kpis.successRate.current}%</div>
                {comparePrevious && renderTrendBadge(kpis.successRate.pctChange)}
              </div>
              {comparePrevious && <p className="text-[11px] text-slate-400">Previous: {kpis.successRate.previous}%</p>}
            </div>

            {/* Avg Execution Time */}
            <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <span>Avg Execution Time</span>
                <Clock className="w-4 h-4 text-blue-500" />
              </div>
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-extrabold text-slate-900">{kpis.avgExecTimeMs.current} ms</div>
                {comparePrevious && renderTrendBadge(kpis.avgExecTimeMs.pctChange, false)}
              </div>
              {comparePrevious && <p className="text-[11px] text-slate-400">Target: &lt;300 ms</p>}
            </div>
          </div>

          {/* Secondary KPI Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-sm space-y-1">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">New Signups</div>
              <div className="text-xl font-extrabold text-white">{kpis.signups.current.toLocaleString()}</div>
              <p className="text-[11px] text-slate-400">Conversion Rate: {kpis.signupConvRate.current}%</p>
            </div>

            <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-sm space-y-1">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Subscriptions</div>
              <div className="text-xl font-extrabold text-orange-400">{kpis.subscriptions.current.toLocaleString()}</div>
              <p className="text-[11px] text-slate-400">Conversion Rate: {kpis.subConvRate.current}%</p>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-1">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Page Views</div>
              <div className="text-xl font-extrabold text-slate-900">{kpis.pageViews.current.toLocaleString()}</div>
              <p className="text-[11px] text-slate-400">Total Page Impressions</p>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-1">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gross Revenue</div>
              <div className="text-xl font-extrabold text-emerald-700">₹{kpis.revenue.current.toLocaleString()}</div>
              <p className="text-[11px] text-slate-400">Paid Plans & Add-ons</p>
            </div>
          </div>

          {/* Tool Usage Smooth Recharts SVG Component (Matching Image 2) */}
          <ToolUsageChart data={data.trafficTrend} />

          {/* Acquisition & Demographics Snapshot */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Globe className="w-4 h-4 text-orange-600" /> Traffic Sources
              </h2>
              <div className="space-y-3">
                {data.trafficSources.map((src) => (
                  <div key={src.source} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-800">{src.source}</span>
                      <span className="text-slate-500 font-mono">{src.visits} ({src.pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-orange-600 h-2 rounded-full" style={{ width: `${Math.min(100, src.pct)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-blue-600" /> Devices
              </h2>
              <div className="space-y-3">
                {data.devices.map((dev) => (
                  <div key={dev.device} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-800 capitalize">{dev.device}</span>
                      <span className="text-slate-500 font-mono">{dev.count} ({dev.pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${Math.min(100, dev.pct)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-600" /> Top Countries
              </h2>
              <div className="space-y-3">
                {data.countries.map((cnt) => (
                  <div key={cnt.country} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-800">{cnt.country}</span>
                      <span className="text-slate-500 font-mono">{cnt.count} ({cnt.pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-600 h-2 rounded-full" style={{ width: `${Math.min(100, cnt.pct)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Tools Ranking Table (Preview Top 5) */}
          <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Top Popular Tools</h2>
                <p className="text-xs text-slate-500">Most executed tools across the platform</p>
              </div>
              <Link
                href="/admin/analytics/tools"
                className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
              >
                View full tools report <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="p-3 text-center">Rank</th>
                    <th className="p-3">Tool Name</th>
                    <th className="p-3">Category</th>
                    <th className="p-3 text-center">Executions</th>
                    <th className="p-3 text-center">Success Rate</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.topTools.slice(0, 5).map((tool) => (
                    <tr key={tool.slug} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3 whitespace-nowrap text-center font-bold text-slate-400">#{tool.rank}</td>
                      <td className="p-3 whitespace-nowrap">
                        <div className="font-bold text-slate-900">{tool.name}</div>
                        <div className="font-mono text-xs text-slate-400">{tool.slug}</div>
                      </td>
                      <td className="p-3 whitespace-nowrap text-xs text-slate-600">{tool.category}</td>
                      <td className="p-3 whitespace-nowrap text-center">
                        <span className="font-mono font-bold text-orange-600 text-xs">{tool.executions.toLocaleString()}</span>
                      </td>
                      <td className="p-3 whitespace-nowrap text-center">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {tool.successRate}%
                        </span>
                      </td>
                      <td className="p-3 whitespace-nowrap text-right text-xs">
                        <Link
                          href={`/admin/analytics/tools/${tool.slug}`}
                          className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors inline-flex items-center gap-1 font-semibold"
                        >
                          Drilldown <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: WEBSITE */}
      {activeTab === "website" && (
        <div className="space-y-8">
          {/* Website Traffic KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <span>Website Unique Visitors</span>
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-extrabold text-slate-900">{kpis.visitors.current.toLocaleString()}</div>
                {comparePrevious && renderTrendBadge(kpis.visitors.pctChange)}
              </div>
              {comparePrevious && <p className="text-[11px] text-slate-400">Previous: {kpis.visitors.previous.toLocaleString()}</p>}
            </div>

            <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <span>Total Page Impressions</span>
                <Eye className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-extrabold text-indigo-700">{kpis.pageViews.current.toLocaleString()}</div>
                {comparePrevious && renderTrendBadge(kpis.pageViews.pctChange)}
              </div>
              {comparePrevious && <p className="text-[11px] text-slate-400">Previous: {kpis.pageViews.previous.toLocaleString()}</p>}
            </div>

            <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <span>Avg Views / Visitor</span>
                <BarChart3 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-extrabold text-emerald-700">
                  {(kpis.pageViews.current / Math.max(1, kpis.visitors.current)).toFixed(1)}
                </div>
              </div>
              <p className="text-[11px] text-slate-400">Pageviews divided by Unique Visitors</p>
            </div>

            <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <span>Visitor Signup Conversion</span>
                <UserCheck className="w-4 h-4 text-amber-500" />
              </div>
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-extrabold text-amber-600">{kpis.signupConvRate.current}%</div>
                {comparePrevious && renderTrendBadge(kpis.signupConvRate.pctChange)}
              </div>
              <p className="text-[11px] text-slate-400">Visitors converting to registered users</p>
            </div>
          </div>

          {/* Website Traffic Recharts Component */}
          <WebsiteTrafficChart data={data.trafficTrend} />

          {/* Acquisition & Demographics Full Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Globe className="w-4 h-4 text-orange-600" /> Acquisition Channels
              </h2>
              <div className="space-y-3">
                {data.trafficSources.map((src) => (
                  <div key={src.source} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-800">{src.source}</span>
                      <span className="text-slate-500 font-mono">{src.visits} ({src.pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-orange-600 h-2 rounded-full" style={{ width: `${Math.min(100, src.pct)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-blue-600" /> Device Types
              </h2>
              <div className="space-y-3">
                {data.devices.map((dev) => (
                  <div key={dev.device} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-800 capitalize flex items-center gap-1.5">
                        {dev.device === "desktop" ? <Laptop className="w-3.5 h-3.5 text-slate-500" /> : <Smartphone className="w-3.5 h-3.5 text-slate-500" />}
                        {dev.device}
                      </span>
                      <span className="text-slate-500 font-mono">{dev.count} ({dev.pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${Math.min(100, dev.pct)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-600" /> Geographic Demographics
              </h2>
              <div className="space-y-3">
                {data.countries.map((cnt) => (
                  <div key={cnt.country} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-800">{cnt.country}</span>
                      <span className="text-slate-500 font-mono">{cnt.count} ({cnt.pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-600 h-2 rounded-full" style={{ width: `${Math.min(100, cnt.pct)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TOOLS */}
      {activeTab === "tools" && (
        <div className="space-y-8">
          {/* Tools KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <span>Total Tool Executions</span>
                <Wrench className="w-4 h-4 text-orange-500" />
              </div>
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-extrabold text-orange-600">{kpis.executions.current.toLocaleString()}</div>
                {comparePrevious && renderTrendBadge(kpis.executions.pctChange)}
              </div>
              {comparePrevious && <p className="text-[11px] text-slate-400">Previous: {kpis.executions.previous.toLocaleString()}</p>}
            </div>

            <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <span>Execution Success Rate</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-extrabold text-emerald-700">{kpis.successRate.current}%</div>
                {comparePrevious && renderTrendBadge(kpis.successRate.pctChange)}
              </div>
              {comparePrevious && <p className="text-[11px] text-slate-400">Previous: {kpis.successRate.previous}%</p>}
            </div>

            <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <span>Avg Execution Time</span>
                <Clock className="w-4 h-4 text-blue-500" />
              </div>
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-extrabold text-slate-900">{kpis.avgExecTimeMs.current} ms</div>
                {comparePrevious && renderTrendBadge(kpis.avgExecTimeMs.pctChange, false)}
              </div>
              <p className="text-[11px] text-slate-400">Target performance: &lt;300 ms</p>
            </div>

            <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <span>Failed Executions / Errors</span>
                <AlertTriangle className="w-4 h-4 text-rose-500" />
              </div>
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-extrabold text-rose-600">{totalFailedExecutions}</div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                  {(100 - kpis.successRate.current).toFixed(1)}% Error Rate
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Failed executions during period</p>
            </div>
          </div>

          {/* Tool Usage Smooth Recharts SVG Component (Matching Image 2) */}
          <ToolUsageChart data={data.trafficTrend} />

          {/* Full Interactive Top Tools Ranking Table */}
          <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">All Tools Performance Ranking</h2>
                <p className="text-xs text-slate-500">Filter, search, and drill down into individual tool metrics</p>
              </div>

              {/* Search & Category Filter Controls */}
              <div className="flex flex-wrap items-center gap-3 text-xs">
                {/* Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search tool..."
                    value={toolSearch}
                    onChange={(e) => setToolSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:ring-1 focus:ring-orange-500 outline-none w-40 sm:w-52"
                  />
                </div>

                {/* Category Dropdown */}
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-700 capitalize"
                >
                  <option value="all">All Categories</option>
                  {toolCategories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>

                {/* Sort Dropdown */}
                <select
                  value={topToolSort}
                  onChange={(e) => setTopToolSort(e.target.value as any)}
                  className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-700"
                >
                  <option value="executions">Most Executed</option>
                  <option value="views">Most Viewed</option>
                  <option value="successRate">Highest Success Rate</option>
                  <option value="avgExecutionTimeMs">Fastest Execution</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="p-3 text-center">Rank</th>
                    <th className="p-3">Tool Name</th>
                    <th className="p-3">Category</th>
                    <th className="p-3 text-center">Views</th>
                    <th className="p-3 text-center">Executions</th>
                    <th className="p-3 text-center">Success Rate</th>
                    <th className="p-3 text-center">Avg Latency</th>
                    <th className="p-3 text-center">Signups</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedTools.map((tool) => (
                    <tr key={tool.slug} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3 whitespace-nowrap text-center font-bold text-slate-400">#{tool.rank}</td>
                      <td className="p-3 whitespace-nowrap">
                        <div className="font-bold text-slate-900">{tool.name}</div>
                        <div className="font-mono text-xs text-slate-400">{tool.slug}</div>
                      </td>
                      <td className="p-3 whitespace-nowrap text-xs text-slate-600 capitalize">{tool.category}</td>
                      <td className="p-3 whitespace-nowrap text-center font-mono text-xs">{tool.views.toLocaleString()}</td>
                      <td className="p-3 whitespace-nowrap text-center">
                        <span className="font-mono font-bold text-orange-600 text-xs">{tool.executions.toLocaleString()}</span>
                      </td>
                      <td className="p-3 whitespace-nowrap text-center">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${
                            tool.successRate >= 98
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : tool.successRate >= 90
                              ? "bg-amber-50 text-amber-800 border-amber-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}
                        >
                          {tool.successRate}%
                        </span>
                      </td>
                      <td className="p-3 whitespace-nowrap text-center font-mono text-xs text-slate-600">{tool.avgExecutionTimeMs} ms</td>
                      <td className="p-3 whitespace-nowrap text-center font-mono text-xs text-slate-700 font-bold">+{tool.signupsGenerated}</td>
                      <td className="p-3 whitespace-nowrap text-right text-xs">
                        <Link
                          href={`/admin/analytics/tools/${tool.slug}`}
                          className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors inline-flex items-center gap-1 font-semibold"
                        >
                          Drilldown <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}

                  {sortedTools.length === 0 && (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400 text-sm">
                        No tools matching your search criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: USERS */}
      {activeTab === "users" && (
        <div className="space-y-8">
          {/* User Signups KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <span>New User Signups</span>
                <Users className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-extrabold text-slate-900">{kpis.signups.current.toLocaleString()}</div>
                {comparePrevious && renderTrendBadge(kpis.signups.pctChange)}
              </div>
              {comparePrevious && <p className="text-[11px] text-slate-400">Previous: {kpis.signups.previous.toLocaleString()}</p>}
            </div>

            <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <span>Visitor Signup Conversion</span>
                <UserCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-extrabold text-emerald-700">{kpis.signupConvRate.current}%</div>
                {comparePrevious && renderTrendBadge(kpis.signupConvRate.pctChange)}
              </div>
              <p className="text-[11px] text-slate-400">% of visitors registering an account</p>
            </div>

            <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <span>Paid Subscriber Conversion</span>
                <Sparkles className="w-4 h-4 text-orange-500" />
              </div>
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-extrabold text-orange-600">{kpis.subConvRate.current}%</div>
                {comparePrevious && renderTrendBadge(kpis.subConvRate.pctChange)}
              </div>
              <p className="text-[11px] text-slate-400">% of signups upgrading to paid plans</p>
            </div>

            <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <span>Active User Sessions</span>
                <Activity className="w-4 h-4 text-blue-500" />
              </div>
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-extrabold text-slate-900">{Math.round(kpis.visitors.current * 0.4)}</div>
              </div>
              <p className="text-[11px] text-slate-400">Active returning session users</p>
            </div>
          </div>

          {/* User Registration Smooth Recharts SVG Component */}
          <ToolUsageChart data={data.trafficTrend} />

          {/* User Acquisition & Conversion Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Acquisition Sources for Signups */}
            <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-600" /> Signups by Acquisition Channel
              </h2>
              <div className="space-y-3">
                {data.trafficSources.map((src) => {
                  const channelSignups = Math.round(src.visits * (kpis.signupConvRate.current / 100));
                  return (
                    <div key={src.source} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-800">{src.source}</span>
                        <span className="text-slate-500 font-mono">+{channelSignups} Signups</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-600 h-2 rounded-full" style={{ width: `${Math.min(100, src.pct)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top Converting Tools */}
            <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Wrench className="w-4 h-4 text-orange-600" /> Top Tools Driving User Signups
              </h2>
              <div className="space-y-3">
                {data.topTools.slice(0, 5).map((tool) => (
                  <div key={tool.slug} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <div>
                      <div className="font-bold text-xs text-slate-900">{tool.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{tool.slug}</div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-extrabold text-emerald-600 text-sm">+{tool.signupsGenerated} Signups</span>
                      <div className="text-[10px] text-slate-400">from {tool.executions} execs</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: REVENUE */}
      {activeTab === "revenue" && (
        <div className="space-y-8">
          {/* Revenue KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <span>Gross Revenue</span>
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-extrabold text-emerald-700">₹{kpis.revenue.current.toLocaleString()}</div>
                {comparePrevious && renderTrendBadge(kpis.revenue.pctChange)}
              </div>
              {comparePrevious && <p className="text-[11px] text-slate-400">Previous: ₹{kpis.revenue.previous.toLocaleString()}</p>}
            </div>

            <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <span>Paid Subscriptions</span>
                <Sparkles className="w-4 h-4 text-orange-500" />
              </div>
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-extrabold text-orange-600">{kpis.subscriptions.current.toLocaleString()}</div>
                {comparePrevious && renderTrendBadge(kpis.subscriptions.pctChange)}
              </div>
              {comparePrevious && <p className="text-[11px] text-slate-400">Previous: {kpis.subscriptions.previous.toLocaleString()}</p>}
            </div>

            <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <span>Subscription Conversion</span>
                <UserCheck className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-extrabold text-indigo-700">{kpis.subConvRate.current}%</div>
                {comparePrevious && renderTrendBadge(kpis.subConvRate.pctChange)}
              </div>
              <p className="text-[11px] text-slate-400">% of registered users paying</p>
            </div>

            <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <span>Avg Revenue Per User (ARPU)</span>
                <DollarSign className="w-4 h-4 text-amber-500" />
              </div>
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-extrabold text-slate-900">
                  ₹{kpis.subscriptions.current > 0 ? Math.round(kpis.revenue.current / kpis.subscriptions.current) : 0}
                </div>
              </div>
              <p className="text-[11px] text-slate-400">Average paid plan tier value</p>
            </div>
          </div>

          {/* Revenue Smooth Recharts Bar SVG Component */}
          <RevenueChart data={data.trafficTrend} />

          {/* Subscription Plans & Gateway Distribution Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-orange-500" /> Subscription Plan Breakdown
              </h2>
              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-800">Free Tier</span>
                    <span className="text-slate-500 font-mono">85.0%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-slate-400 h-2 rounded-full" style={{ width: "85%" }} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-800 font-bold text-orange-600">Pro Plan (₹999/mo)</span>
                    <span className="text-slate-500 font-mono">12.5%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-orange-600 h-2 rounded-full" style={{ width: "12.5%" }} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-800 font-bold text-emerald-700">Enterprise Plan (₹2999/mo)</span>
                    <span className="text-slate-500 font-mono">2.5%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-600 h-2 rounded-full" style={{ width: "2.5%" }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" /> Payment Transactions Summary
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <div>
                    <div className="font-bold text-xs text-emerald-900">Successful Payments</div>
                    <div className="text-[11px] text-emerald-700">Razorpay / Stripe processed</div>
                  </div>
                  <div className="font-mono font-extrabold text-emerald-800 text-sm">
                    ₹{kpis.revenue.current.toLocaleString()}
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div>
                    <div className="font-bold text-xs text-slate-800">Pending / Retry Transactions</div>
                    <div className="text-[11px] text-slate-500">Awaiting user confirmation</div>
                  </div>
                  <div className="font-mono font-bold text-slate-600 text-sm">0</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Activity(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}
