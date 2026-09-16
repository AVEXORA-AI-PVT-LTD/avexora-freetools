"use client";

import { useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DateRange } from "@/server/analytics";
import { useRouter, useSearchParams } from "next/navigation";

export function AnalyticsDashboard({
  summary,
  topTools,
  catUsage,
  timeline,
  authAnon
}: any) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentRange = (searchParams.get("range") || "30d") as DateRange;

  const handleRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRange = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", newRange);
    router.push(`/admin/analytics?${params.toString()}`);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Analytics & Activity Monitoring</h1>
        
        <div className="flex items-center gap-4">
          <select 
            value={currentRange}
            onChange={handleRangeChange}
            className="rounded-md border-slate-300 py-1.5 pl-3 pr-8 text-sm focus:border-orange-500 focus:ring-orange-500"
          >
            <option value="today">Today</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="year">This Year</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Tool Uses" value={summary.totalUses.toLocaleString()} />
        <StatCard title="Active Tools" value={summary.activeToolsCount.toLocaleString()} />
        <StatCard title="Active Users" value={summary.activeUsersCount.toLocaleString()} />
        <StatCard title="Most Used Tool" value={summary.mostUsedToolName} />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-6 text-lg font-semibold text-slate-900">Tool Usage Over Time</h2>
        <div className="h-[300px] w-full">
          {timeline.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeline} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorUses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(val) => {
                    const d = new Date(val);
                    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                  }}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickMargin={10}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickMargin={10}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  labelFormatter={(val) => new Date(val as string | number).toLocaleDateString()}
                />
                <Area type="monotone" dataKey="uses" stroke="#f97316" strokeWidth={2} fillOpacity={1} fill="url(#colorUses)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-slate-500">
              No usage data available for this period.
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Top Tools</h2>
          {topTools.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="border-b border-slate-200 text-xs font-semibold uppercase text-slate-900">
                  <tr>
                    <th className="py-3 pr-4">Tool</th>
                    <th className="py-3 pr-4">Category</th>
                    <th className="py-3 text-right">Uses</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {topTools.map((t: any, i: number) => (
                    <tr key={t.slug}>
                      <td className="py-3 pr-4 font-medium text-slate-900">
                        {i + 1}. {t.name}
                      </td>
                      <td className="py-3 pr-4">{t.category}</td>
                      <td className="py-3 text-right font-medium text-slate-900">{t.uses.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-slate-500">No tools used in this period.</p>
          )}
        </div>

        <div className="space-y-8">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Category Usage</h2>
            {catUsage.length > 0 ? (
              <div className="space-y-4">
                {catUsage.map((c: any) => (
                  <div key={c.slug} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">{c.name}</span>
                    <span className="text-sm font-semibold text-slate-900">{c.count.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No categories used in this period.</p>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Usage Type</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">Authenticated Usage</span>
                <span className="text-sm font-semibold text-slate-900">{authAnon.authenticated.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">Anonymous Usage</span>
                <span className="text-sm font-semibold text-slate-900">{authAnon.anonymous.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-sm font-medium text-slate-500">{title}</h3>
      <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
