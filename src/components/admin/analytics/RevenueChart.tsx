"use client";

import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { TimeSeriesDataPoint } from "@/server/admin/analytics-service";

interface RevenueChartProps {
  data: TimeSeriesDataPoint[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  const totalSubscriptions = data ? data.reduce((acc, d) => acc + (Number(d.subscriptions) || Number(d.newSubscriptions) || 0), 0) : 0;
  const totalRevenue = data ? data.reduce((acc, d) => acc + (Number(d.revenue) || 0), 0) : 0;

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-zinc-500 bg-zinc-50 rounded-xl border border-zinc-100">
        No subscription revenue data available for this period.
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-zinc-100 pb-4">
        <div>
          <h3 className="text-lg font-bold text-zinc-900">Revenue & Paid Subscriptions</h3>
          <p className="text-xs text-zinc-500">Gross revenue volume and paid subscription conversions over time.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-xl text-center min-w-[100px]">
            <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Gross Revenue</div>
            <div className="text-lg font-extrabold text-emerald-700">₹{totalRevenue.toLocaleString()}</div>
          </div>
          <div className="px-4 py-2 bg-amber-50 border border-amber-100 rounded-xl text-center min-w-[100px]">
            <div className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Subscriptions</div>
            <div className="text-lg font-extrabold text-amber-700">{totalSubscriptions.toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div className="h-[320px] w-full relative pt-2">
        <div className="absolute inset-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
            >
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
                cursor={{ fill: '#f4f4f5' }}
              />
              <Legend wrapperStyle={{ paddingTop: '15px' }} />
              <Bar 
                name="New Subscriptions"
                dataKey="subscriptions" 
                fill="#10b981" 
                radius={[6, 6, 0, 0]} 
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
