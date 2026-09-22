"use client";

import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { TimeSeriesDataPoint } from "@/server/admin/analytics-service";
import { AlertCircle } from 'lucide-react';

interface RevenueChartProps {
  data: TimeSeriesDataPoint[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <div className="flex flex-col h-[400px]">
      <div className="bg-orange-50 border border-orange-200 text-orange-800 px-4 py-3 rounded-lg mb-6 flex gap-3 text-sm items-start">
        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
        <p>
          <strong>Partial Data Available:</strong> The financial <code>Payment</code> and <code>Transaction</code> models are not yet implemented in the database schema. 
          Currently displaying <span className="font-semibold">New Subscriptions</span> over time as a proxy for revenue activity. Gross Revenue and Net Revenue calculations are unavailable.
        </p>
      </div>
      
      {(!data || data.length === 0) ? (
        <div className="flex-1 flex items-center justify-center text-zinc-500 bg-zinc-50 rounded-xl border border-zinc-100">
          No subscription data available for this period.
        </div>
      ) : (
        <div className="flex-1 w-full relative min-h-[250px]">
          <div className="absolute inset-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
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
                allowDecimals={false}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: '1px solid #e4e4e7', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                cursor={{ fill: '#f4f4f5' }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Bar 
                name="New Subscriptions"
                dataKey="newSubscriptions" 
                fill="#10b981" 
                radius={[4, 4, 0, 0]} 
                maxBarSize={50}
              />
            </BarChart>
          </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
