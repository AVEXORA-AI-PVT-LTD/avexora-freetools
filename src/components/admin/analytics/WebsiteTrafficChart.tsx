"use client";

import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { TimeSeriesDataPoint } from "@/server/admin/analytics-service";

interface WebsiteTrafficChartProps {
  data: TimeSeriesDataPoint[];
}

export function WebsiteTrafficChart({ data }: WebsiteTrafficChartProps) {
  const totalVisitors = data ? data.reduce((acc, d) => acc + (Number(d.visitors) || 0), 0) : 0;
  const totalPageviews = data ? data.reduce((acc, d) => acc + (Number(d.pageviews) || 0), 0) : 0;

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-zinc-500 bg-zinc-50 rounded-xl border border-zinc-100">
        No website traffic data available for this period.
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-zinc-100 pb-4">
        <div>
          <h3 className="text-lg font-bold text-zinc-900">Website Traffic</h3>
          <p className="text-xs text-zinc-500">Page impressions and unique visitor counts over time.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-center">
            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Total Visitors</div>
            <div className="text-sm font-extrabold text-zinc-900">{totalVisitors.toLocaleString()}</div>
          </div>
          <div className="px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-xl text-center">
            <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Page Views</div>
            <div className="text-sm font-extrabold text-indigo-700">{totalPageviews.toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div className="h-[320px] w-full relative pt-2">
        <div className="absolute inset-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorPageviews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
              <XAxis 
                dataKey="date" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#71717a' }}
                dy={10}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#71717a' }}
                allowDecimals={false}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: '1px solid #e4e4e7', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '4 4' }}
              />
              <Legend wrapperStyle={{ paddingTop: '15px' }} />
              <Area 
                type="monotone" 
                name="Page Views"
                dataKey="pageviews" 
                stroke="#6366f1" 
                strokeWidth={2.5}
                fillOpacity={1} 
                fill="url(#colorPageviews)" 
                activeDot={{ r: 6, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }}
              />
              <Area 
                type="monotone" 
                name="Visitors"
                dataKey="visitors" 
                stroke="#3b82f6" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorVisitors)" 
                activeDot={{ r: 5, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
