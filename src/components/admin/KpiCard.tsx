import Link from "next/link";
import { MetricOutput } from "@/server/admin/dashboard-stats";
import { ArrowDownIcon, ArrowUpIcon, MinusIcon } from "lucide-react";

interface KpiCardProps {
  title: string;
  metric: MetricOutput;
  href: string;
  formatter?: (val: number) => string;
}

export function KpiCard({ title, metric, href, formatter = (val) => val.toLocaleString() }: KpiCardProps) {
  const isPositive = metric.changePercent !== null && metric.changePercent > 0;
  const isNegative = metric.changePercent !== null && metric.changePercent < 0;
  const isNeutral = metric.changePercent === 0 || metric.changePercent === null;

  return (
    <div className="p-5 bg-white rounded-2xl shadow-sm border border-zinc-200 flex flex-col justify-between hover:border-orange-200 transition-colors group">
      <div>
        <h3 className="text-zinc-500 text-sm font-medium">{title}</h3>
        <p className="text-3xl font-bold mt-2 text-zinc-900 tracking-tight">
          {formatter(metric.value)}
        </p>
      </div>

      <div className="mt-4 flex flex-col gap-1">
        <div className="flex items-center text-sm">
          {isPositive && (
            <span className="flex items-center text-emerald-600 font-medium bg-emerald-50 px-1.5 py-0.5 rounded-md">
              <ArrowUpIcon className="w-3 h-3 mr-1" strokeWidth={3} />
              {metric.changePercent?.toFixed(1)}%
            </span>
          )}
          {isNegative && (
            <span className="flex items-center text-rose-600 font-medium bg-rose-50 px-1.5 py-0.5 rounded-md">
              <ArrowDownIcon className="w-3 h-3 mr-1" strokeWidth={3} />
              {Math.abs(metric.changePercent!).toFixed(1)}%
            </span>
          )}
          {isNeutral && (
            <span className="flex items-center text-zinc-500 font-medium bg-zinc-100 px-1.5 py-0.5 rounded-md">
              <MinusIcon className="w-3 h-3 mr-1" strokeWidth={3} />
              0%
            </span>
          )}
          <span className="text-zinc-400 ml-2 text-xs">vs previous</span>
        </div>
        
        <Link href={href} className="text-xs font-semibold text-orange-600 opacity-0 group-hover:opacity-100 transition-opacity mt-1 flex items-center">
          View Details <span className="ml-1">→</span>
        </Link>
      </div>
    </div>
  );
}
