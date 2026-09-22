import { prisma } from "@/server/db";
import { getDateRange, DateRange } from "@/server/admin/dashboard-stats";
import { 
  eachDayOfInterval, 
  eachWeekOfInterval,
  isSameDay, 
  isSameWeek, 
  format,
  differenceInDays
} from "date-fns";
import { toolsByCategory } from "@/tools/registry";
import { allTools } from "@/tools/registry";

// Types
export interface TimeSeriesDataPoint {
  date: string;
  timestamp: number;
  [key: string]: string | number;
}

export interface TopToolStats {
  toolSlug: string;
  toolName: string;
  categoryName: string;
  executions: number;
  failures: number;
  successRate: number;
}

export interface AnalyticsResponse {
  range: { start: Date; end: Date };
  toolUsageTrend: TimeSeriesDataPoint[];
  topTools: TopToolStats[];
  revenueTrend: TimeSeriesDataPoint[]; // Subscriptions as proxy since payments model missing
  summary: {
    totalExecutions: number;
    totalFailures: number;
  };
  missingDataNotes: string[];
}

export async function getAnalyticsServiceData(rangeType: DateRange): Promise<AnalyticsResponse> {
  const { start, end } = getDateRange(rangeType);
  const diffDays = differenceInDays(end, start);
  const useWeeks = diffDays > 60; // Use weekly grouping for large ranges
  
  // 1. Fetch Raw Data
  const [usages, failures, subscriptions] = await Promise.all([
    prisma.toolUsage.findMany({
      where: { createdAt: { gte: start, lte: end } },
      select: { createdAt: true, toolSlug: true }
    }),
    prisma.auditLog.findMany({
      where: { action: "TOOL_FAILURE", createdAt: { gte: start, lte: end } },
      select: { createdAt: true, targetId: true }
    }),
    prisma.subscription.findMany({
      where: { createdAt: { gte: start, lte: end } },
      select: { createdAt: true, plan: true }
    })
  ]);

  // 2. Generate Time Intervals
  const intervals = useWeeks 
    ? eachWeekOfInterval({ start, end }) 
    : eachDayOfInterval({ start, end });

  // 3. Aggregate Tool Usage Trend
  const toolUsageTrend: TimeSeriesDataPoint[] = intervals.map(date => {
    const isMatchingPeriod = (targetDate: Date) => useWeeks ? isSameWeek(targetDate, date) : isSameDay(targetDate, date);
    
    const dayUsages = usages.filter(u => isMatchingPeriod(u.createdAt)).length;
    const dayFailures = failures.filter(f => isMatchingPeriod(f.createdAt)).length;
    
    return {
      date: format(date, useWeeks ? "MMM d, yyyy" : "MMM dd"),
      timestamp: date.getTime(),
      executions: dayUsages,
      failures: dayFailures,
    };
  });

  // 4. Aggregate Revenue Trend (Proxy via Subscriptions since Payment model is missing)
  const revenueTrend: TimeSeriesDataPoint[] = intervals.map(date => {
    const isMatchingPeriod = (targetDate: Date) => useWeeks ? isSameWeek(targetDate, date) : isSameDay(targetDate, date);
    
    const daySubs = subscriptions.filter(s => isMatchingPeriod(s.createdAt)).length;
    
    return {
      date: format(date, useWeeks ? "MMM d, yyyy" : "MMM dd"),
      timestamp: date.getTime(),
      newSubscriptions: daySubs,
      revenue: 0 // Cannot calculate without real payment/price data
    };
  });

  // 5. Aggregate Top Tools
  const toolStatsMap = new Map<string, { execs: number, fails: number }>();
  usages.forEach(u => {
    const stats = toolStatsMap.get(u.toolSlug) || { execs: 0, fails: 0 };
    stats.execs++;
    toolStatsMap.set(u.toolSlug, stats);
  });
  failures.forEach(f => {
    if (!f.targetId) return;
    const stats = toolStatsMap.get(f.targetId) || { execs: 0, fails: 0 };
    stats.fails++;
    toolStatsMap.set(f.targetId, stats);
  });

  const topTools: TopToolStats[] = Array.from(toolStatsMap.entries())
    .map(([slug, stats]) => {
      // Find tool in static registry to get name and category
      const staticTool = allTools.find(t => t.slug === slug);
      let catName = "Unknown";
      let toolName = slug;
      
      if (staticTool) {
        toolName = staticTool.name;
        // Find category
        for (const [cat, tools] of Object.entries(toolsByCategory)) {
          if (tools.find(t => t.slug === slug)) {
            catName = cat;
            break;
          }
        }
      }

      const totalAttempts = stats.execs; // Assuming failures are part of execs or parallel.
      const successRate = totalAttempts > 0 
        ? ((totalAttempts - stats.fails) / totalAttempts) * 100 
        : 0;

      return {
        toolSlug: slug,
        toolName,
        categoryName: catName,
        executions: stats.execs,
        failures: stats.fails,
        successRate: Math.max(0, successRate)
      };
    })
    .sort((a, b) => b.executions - a.executions)
    .slice(0, 10); // Top 10

  const summary = {
    totalExecutions: usages.length,
    totalFailures: failures.length
  };

  const missingDataNotes = [
    "Website Traffic (Visitors, Page Views, Sessions) tracking model does not exist.",
    "Tool Execution Time duration tracking does not exist in ToolUsage.",
    "Tool Views tracking does not exist in ToolUsage.",
    "Financial Revenue / Payment Transaction tracking model does not exist."
  ];

  return {
    range: { start, end },
    toolUsageTrend,
    topTools,
    revenueTrend,
    summary,
    missingDataNotes
  };
}
