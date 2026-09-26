"use client";

import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { TimeSeriesDataPoint } from "@/server/admin/analytics-service";

interface ToolUsageChartProps {
  data: TimeSeriesDataPoint[];
}

export function ToolUsageChart({ data }: ToolUsageChartProps) {
  const totalExecutions = data ? data.reduce((acc, d) => acc + (Number(d.executions) || 0), 0) : 0;
  const totalFailures = data ? data.reduce((acc, d) => acc + (Number(d.failures) || 0), 0) : 0;

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-zinc-500 bg-zinc-50 rounded-xl border border-zinc-100">
        No tool usage data available for this period.
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-zinc-100 pb-4">
        <div>
          <h3 className="text-lg font-bold text-zinc-900">Tool Usage</h3>
          <p className="text-xs text-zinc-500">Execution volume and failure tracking over time.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-center min-w-[100px]">
            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Total Executions</div>
            <div className="text-lg font-extrabold text-zinc-900">{totalExecutions.toLocaleString()}</div>
          </div>
          <div className="px-4 py-2 bg-rose-50 border border-rose-100 rounded-xl text-center min-w-[100px]">
            <div className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">Total Failures</div>
            <div className="text-lg font-extrabold text-rose-600">{totalFailures.toLocaleString()}</div>
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
                <linearGradient id="colorExecutions" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.35}/>
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorFailures" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.35}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
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
                cursor={{ stroke: '#f97316', strokeWidth: 1, strokeDasharray: '4 4' }}
              />
              <Legend wrapperStyle={{ paddingTop: '15px' }} />
              <Area 
                type="monotone" 
                name="Executions"
                dataKey="executions" 
                stroke="#f97316" 
                strokeWidth={2.5}
                fillOpacity={1} 
                fill="url(#colorExecutions)" 
                activeDot={{ r: 6, fill: '#f97316', stroke: '#fff', strokeWidth: 2 }}
              />
              <Area 
                type="monotone" 
                name="Failures"
                dataKey="failures" 
                stroke="#ef4444" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorFailures)" 
                activeDot={{ r: 5, fill: '#ef4444', stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
