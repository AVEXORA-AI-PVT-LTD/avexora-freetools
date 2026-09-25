"use client";

import { useState, useEffect } from "react";
import { getRevenueMetricsAction, getRevenueChartsAction } from "./revenue-actions";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function RevenueDashboardClient() {
  const [metrics, setMetrics] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [days, setDays] = useState(30);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      setIsLoading(true);
      try {
        const [data, cData] = await Promise.all([
          getRevenueMetricsAction(days),
          getRevenueChartsAction(days)
        ]);
        setMetrics(data);
        setChartData(cData);
      } catch (err) {
        console.error(err);
      }
      setIsLoading(false);
    };
    fetchMetrics();
  }, [days]);

  if (isLoading || !metrics) {
    return <div className="p-12 text-center text-slate-500">Loading Revenue Data...</div>;
  }

  const kpiClass = "bg-white p-6 rounded-xl border border-slate-200 shadow-sm";

  return (
    <div className="space-y-6">
      
      <div className="flex items-center justify-end">
        <select 
          className="px-4 py-2 border rounded-lg text-sm bg-white"
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
        >
          <option value={7}>Last 7 Days</option>
          <option value={30}>Last 30 Days</option>
          <option value={90}>Last 90 Days</option>
          <option value={365}>Last 12 Months</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className={kpiClass}>
          <h3 className="text-sm font-medium text-slate-500 mb-2">Gross Revenue</h3>
          <div className="text-3xl font-bold text-slate-800">₹{(metrics.gross / 100).toFixed(2)}</div>
          <div className="text-xs text-slate-400 mt-2">Total volume before refunds</div>
        </div>

        <div className={kpiClass}>
          <h3 className="text-sm font-medium text-slate-500 mb-2">Net Revenue</h3>
          <div className="text-3xl font-bold text-green-600">₹{(metrics.net / 100).toFixed(2)}</div>
          <div className="text-xs text-slate-400 mt-2">Gross minus Refunds</div>
        </div>

        <div className={kpiClass}>
          <h3 className="text-sm font-medium text-slate-500 mb-2">Refunds</h3>
          <div className="text-3xl font-bold text-red-500">₹{(metrics.refunds / 100).toFixed(2)}</div>
          <div className="text-xs text-slate-400 mt-2">Total amount refunded</div>
        </div>

        <div className={kpiClass}>
          <h3 className="text-sm font-medium text-slate-500 mb-2" title="Monthly Recurring Revenue">MRR ℹ️</h3>
          <div className="text-3xl font-bold text-blue-600">₹{(metrics.mrr / 100).toFixed(2)}</div>
          <div className="text-xs text-slate-400 mt-2">From active subscriptions</div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-96">
        <h3 className="text-lg font-semibold text-slate-800 mb-6">Revenue Over Time</h3>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={{fontSize: 12}} stroke="#94a3b8" />
            <YAxis tick={{fontSize: 12}} stroke="#94a3b8" />
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
            <Area type="monotone" dataKey="net" stroke="#16a34a" fillOpacity={1} fill="url(#colorNet)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={kpiClass}>
          <h3 className="text-sm font-medium text-slate-500 mb-2">Total Transactions</h3>
          <div className="text-2xl font-bold text-slate-800">{metrics.paymentCount}</div>
        </div>
        <div className={kpiClass}>
          <h3 className="text-sm font-medium text-slate-500 mb-2">Average Order Value</h3>
          <div className="text-2xl font-bold text-slate-800">₹{(metrics.averageTxValue / 100).toFixed(2)}</div>
        </div>
        <div className={kpiClass}>
          <h3 className="text-sm font-medium text-slate-500 mb-2">Tax Recorded</h3>
          <div className="text-2xl font-bold text-slate-800">₹{(metrics.taxes / 100).toFixed(2)}</div>
        </div>
      </div>

    </div>
  );
}
