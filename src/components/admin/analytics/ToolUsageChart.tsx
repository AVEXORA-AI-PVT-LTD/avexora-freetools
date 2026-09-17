"use client";

import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { TimeSeriesDataPoint } from "@/server/admin/analytics-service";

interface ToolUsageChartProps {
  data: TimeSeriesDataPoint[];
}

export function ToolUsageChart({ data }: ToolUsageChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-zinc-500 bg-zinc-50 rounded-xl border border-zinc-100">
        No tool usage data available for this period.
      </div>
    );
  }

  return (
    <div className="h-[350px] w-full relative">
      <div className="absolute inset-0">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorExecutions" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorFailures" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
          <XAxis 
            dataKey="date" 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#71717a' }}
            dy={10}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#71717a' }}
            dx={-10}
          />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: '1px solid #e4e4e7', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            cursor={{ stroke: '#f97316', strokeWidth: 1, strokeDasharray: '4 4' }}
          />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          <Area 
            type="monotone" 
            name="Executions"
            dataKey="executions" 
            stroke="#f97316" 
            strokeWidth={2}
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
          />
        </AreaChart>
      </ResponsiveContainer>
      </div>
    </div>
  );
}
