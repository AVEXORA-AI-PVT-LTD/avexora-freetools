import { prisma } from "@/server/db";
import { allTools } from "@/tools/registry";
import { subDays, subMonths, subYears, startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";

export type DateRange = 
  | "today" 
  | "yesterday" 
  | "last7days" 
  | "last30days" 
  | "last90days" 
  | "thisMonth" 
  | "lastMonth" 
  | "thisYear" 
  | "allTime";

export interface DateRangeQuery {
  start: Date;
  end: Date;
  previousStart: Date;
  previousEnd: Date;
}

export function getDateRange(range: DateRange): DateRangeQuery {
  const now = new Date();
  
  if (range === "today") {
    return {
      start: startOfDay(now),
      end: endOfDay(now),
      previousStart: startOfDay(subDays(now, 1)),
      previousEnd: endOfDay(subDays(now, 1)),
    };
  }
  if (range === "yesterday") {
    const yesterday = subDays(now, 1);
    const dayBefore = subDays(now, 2);
    return {
      start: startOfDay(yesterday),
      end: endOfDay(yesterday),
      previousStart: startOfDay(dayBefore),
      previousEnd: endOfDay(dayBefore),
    };
  }
  if (range === "last7days") {
    return {
      start: startOfDay(subDays(now, 7)),
      end: now,
      previousStart: startOfDay(subDays(now, 14)),
      previousEnd: endOfDay(subDays(now, 8)), // 7 days prior
    };
  }
  if (range === "last30days") {
    return {
      start: startOfDay(subDays(now, 30)),
      end: now,
      previousStart: startOfDay(subDays(now, 60)),
      previousEnd: endOfDay(subDays(now, 31)), 
    };
  }
  if (range === "last90days") {
    return {
      start: startOfDay(subDays(now, 90)),
      end: now,
      previousStart: startOfDay(subDays(now, 180)),
      previousEnd: endOfDay(subDays(now, 91)), 
    };
  }
  if (range === "thisMonth") {
    return {
      start: startOfMonth(now),
      end: now,
      previousStart: startOfMonth(subMonths(now, 1)),
      previousEnd: endOfMonth(subMonths(now, 1)),
    };
  }
  if (range === "lastMonth") {
    const lastM = subMonths(now, 1);
    const prevM = subMonths(now, 2);
    return {
      start: startOfMonth(lastM),
      end: endOfMonth(lastM),
      previousStart: startOfMonth(prevM),
      previousEnd: endOfMonth(prevM),
    };
  }
  if (range === "thisYear") {
    return {
      start: startOfYear(now),
      end: now,
      previousStart: startOfYear(subYears(now, 1)),
      previousEnd: endOfYear(subYears(now, 1)),
    };
  }
  
  // allTime
  return {
    start: new Date(0),
    end: now,
    previousStart: new Date(0),
    previousEnd: new Date(0), 
  };
}

export function calcPercentChange(current: number, previous: number): number | null {
  if (previous === 0) {
    if (current === 0) return 0;
    return 100;
  }
  return ((current - previous) / previous) * 100;
}

export interface MetricOutput {
  value: number;
  previousValue: number;
  changePercent: number | null;
}

export async function getDashboardStats(rangeType: DateRange) {
  const { start, end, previousStart, previousEnd } = getDateRange(rangeType);

  const dynamicToolsCount = await prisma.dynamicTool.count();
  const totalToolsValue = allTools.length + dynamicToolsCount;
  
  const inactiveToolConfigs = await prisma.toolConfig.count({
    where: { status: false }
  });
  
  const inactiveToolsValue = inactiveToolConfigs; 
  const activeToolsValue = totalToolsValue - inactiveToolsValue;

  const prevDynamicTools = await prisma.dynamicTool.count({
    where: { createdAt: { lte: previousEnd } }
  });
  const prevTotalTools = allTools.length + prevDynamicTools;

  const absoluteTotalUsers = await prisma.user.count();
  const absolutePrevUsers = await prisma.user.count({ where: { createdAt: { lte: previousEnd } } });

  const activeSubs = await prisma.subscription.count({
    where: { status: "active" }
  });
  const prevActiveSubs = await prisma.subscription.count({
    where: { 
      status: "active",
      createdAt: { lte: previousEnd } 
    }
  });

  const [currentExecs, prevExecs] = await Promise.all([
    prisma.toolUsage.count({ where: { createdAt: { gte: start, lte: end } } }),
    prisma.toolUsage.count({ where: { createdAt: { gte: previousStart, lte: previousEnd } } })
  ]);

  const [currentFailures, prevFailures] = await Promise.all([
    prisma.errorLog.count({ where: { status: { in: ["Open", "Investigating"] } } }),
    prisma.errorLog.count({ where: { status: { in: ["Open", "Investigating"] }, createdAt: { lte: previousEnd } } })
  ]);

  const [currentFeedback, prevFeedback] = await Promise.all([
    prisma.contactSubmission.count({ where: { status: { in: ["NEW", "IN_PROGRESS"] } } }),
    prisma.contactSubmission.count({ where: { status: { in: ["NEW", "IN_PROGRESS"] }, createdAt: { lte: previousEnd } } })
  ]);

  const currentRevenue = 0;
  const prevRevenue = 0;

  const currentVisitorsResult = await prisma.toolUsage.groupBy({
    by: ['userId'],
    where: { createdAt: { gte: start, lte: end }, userId: { not: null } },
  });
  const prevVisitorsResult = await prisma.toolUsage.groupBy({
    by: ['userId'],
    where: { createdAt: { gte: previousStart, lte: previousEnd }, userId: { not: null } },
  });
  
  const currentVisitors = currentVisitorsResult.length;
  const prevVisitors = prevVisitorsResult.length;

  return {
    range: { start, end },
    previousRange: { start: previousStart, end: previousEnd },
    metrics: {
      totalTools: {
        value: totalToolsValue,
        previousValue: prevTotalTools,
        changePercent: calcPercentChange(totalToolsValue, prevTotalTools)
      },
      activeTools: {
        value: activeToolsValue,
        previousValue: prevTotalTools - inactiveToolsValue,
        changePercent: calcPercentChange(activeToolsValue, prevTotalTools - inactiveToolsValue)
      },
      inactiveTools: {
        value: inactiveToolsValue,
        previousValue: inactiveToolsValue,
        changePercent: calcPercentChange(inactiveToolsValue, inactiveToolsValue)
      },
      totalUsers: {
        value: absoluteTotalUsers,
        previousValue: absolutePrevUsers,
        changePercent: calcPercentChange(absoluteTotalUsers, absolutePrevUsers)
      },
      visitors: {
        value: currentVisitors,
        previousValue: prevVisitors,
        changePercent: calcPercentChange(currentVisitors, prevVisitors)
      },
      toolExecutions: {
        value: currentExecs,
        previousValue: prevExecs,
        changePercent: calcPercentChange(currentExecs, prevExecs)
      },
      revenue: {
        value: currentRevenue,
        previousValue: prevRevenue,
        changePercent: calcPercentChange(currentRevenue, prevRevenue)
      },
      activeSubscriptions: {
        value: activeSubs,
        previousValue: prevActiveSubs,
        changePercent: calcPercentChange(activeSubs, prevActiveSubs)
      },
      failedExecutions: {
        value: currentFailures,
        previousValue: prevFailures,
        changePercent: calcPercentChange(currentFailures, prevFailures)
      },
      openFeedback: {
        value: currentFeedback,
        previousValue: prevFeedback,
        changePercent: calcPercentChange(currentFeedback, prevFeedback)
      }
    }
  };
}
