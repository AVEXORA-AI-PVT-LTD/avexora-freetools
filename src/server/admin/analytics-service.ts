import { prisma } from "@/server/db";
import {
  eachDayOfInterval,
  eachHourOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  isSameDay,
  isSameHour,
  isSameWeek,
  isSameMonth,
  format,
  differenceInDays,
  subDays,
} from "date-fns";
import { allTools, toolsByCategory } from "@/tools/registry";

export interface AnalyticsDateRangeParams {
  range?: string; // "today" | "yesterday" | "7days" | "30days" | "90days" | "custom"
  startDate?: string;
  endDate?: string;
  comparePrevious?: boolean;
}

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

export interface MetricWithChange {
  current: number;
  previous: number;
  pctChange: number; // e.g. +21.5 or -5.2
  isIncreaseGood?: boolean;
}

/**
 * Calculates percentage change safely.
 */
export function calcPctChange(current: number, previous: number): number {
  if (previous === 0) {
    if (current === 0) return 0;
    return 100;
  }
  const pct = ((current - previous) / previous) * 100;
  return Number(pct.toFixed(2));
}

/**
 * Resolves current and previous date range intervals.
 */
export function resolveAnalyticsRanges(params: AnalyticsDateRangeParams) {
  const now = new Date();
  let start = new Date();
  let end = new Date();

  const range = params.range || "30days";

  if (range === "today") {
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  } else if (range === "yesterday") {
    const y = subDays(now, 1);
    start = new Date(y.setHours(0, 0, 0, 0));
    end = new Date(y.setHours(23, 59, 59, 999));
  } else if (range === "7days") {
    start = subDays(now, 7);
  } else if (range === "90days") {
    start = subDays(now, 90);
  } else if (range === "custom" && params.startDate && params.endDate) {
    start = new Date(params.startDate);
    end = new Date(params.endDate);
  } else {
    // Default 30 days
    start = subDays(now, 30);
  }

  const diffMs = end.getTime() - start.getTime();
  const prevEnd = new Date(start.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - diffMs);

  return {
    current: { start, end },
    previous: { start: prevStart, end: prevEnd },
    diffDays: Math.max(1, differenceInDays(end, start)),
  };
}

/**
 * Fetches central Analytics Overview metrics derived from real database records.
 */
export async function getAnalyticsOverview(params: AnalyticsDateRangeParams) {
  const { current, previous, diffDays } = resolveAnalyticsRanges(params);

  // Parallel database aggregation queries
  const [
    currEvents,
    prevEvents,
    currUsages,
    prevUsages,
    currErrors,
    prevErrors,
    currUsers,
    prevUsers,
    currSubs,
    prevSubs,
    currPayments,
    prevPayments,
    dbToolConfigs,
  ] = await Promise.all([
    prisma.analyticsEvent.findMany({
      where: { createdAt: { gte: current.start, lte: current.end } },
      select: {
        eventType: true,
        userId: true,
        sessionId: true,
        toolSlug: true,
        source: true,
        country: true,
        device: true,
        browser: true,
        os: true,
        success: true,
        executionTime: true,
        createdAt: true,
      },
    }),
    prisma.analyticsEvent.findMany({
      where: { createdAt: { gte: previous.start, lte: previous.end } },
      select: { eventType: true, userId: true, sessionId: true, success: true, createdAt: true },
    }),
    prisma.toolUsage.findMany({
      where: { createdAt: { gte: current.start, lte: current.end } },
      select: { toolSlug: true, userId: true, createdAt: true },
    }),
    prisma.toolUsage.findMany({
      where: { createdAt: { gte: previous.start, lte: previous.end } },
      select: { toolSlug: true, createdAt: true },
    }),
    prisma.errorLog.findMany({
      where: { createdAt: { gte: current.start, lte: current.end } },
      select: { toolSlug: true, severity: true, createdAt: true },
    }),
    prisma.errorLog.findMany({
      where: { createdAt: { gte: previous.start, lte: previous.end } },
      select: { toolSlug: true, createdAt: true },
    }),
    prisma.user.findMany({
      where: { createdAt: { gte: current.start, lte: current.end } },
      select: { id: true, createdAt: true },
    }),
    prisma.user.findMany({
      where: { createdAt: { gte: previous.start, lte: previous.end } },
      select: { id: true, createdAt: true },
    }),
    prisma.subscription.findMany({
      where: { createdAt: { gte: current.start, lte: current.end } },
      select: { id: true, plan: true, createdAt: true },
    }),
    prisma.subscription.findMany({
      where: { createdAt: { gte: previous.start, lte: previous.end } },
      select: { id: true, createdAt: true },
    }),
    prisma.payment.findMany({
      where: { createdAt: { gte: current.start, lte: current.end }, status: "successful" },
      select: { amount: true, createdAt: true },
    }),
    prisma.payment.findMany({
      where: { createdAt: { gte: previous.start, lte: previous.end }, status: "successful" },
      select: { amount: true, createdAt: true },
    }),
    prisma.toolConfig.findMany({
      select: { toolSlug: true, views: true, categorySlug: true, nameOverride: true, status: true },
    }),
  ]);

  // 1. Calculate Website Traffic Metrics
  const currSessions = new Set([
    ...currEvents.map((e) => e.sessionId).filter(Boolean),
    ...currUsages.map((u) => u.userId).filter(Boolean),
  ]);
  const prevSessions = new Set([
    ...prevEvents.map((e) => e.sessionId).filter(Boolean),
    ...prevUsages.map((u) => u.createdAt.getTime().toString()),
  ]);

  const currVisitorsCount = Math.max(currSessions.size, currEvents.length > 0 ? currEvents.length : currUsages.length);
  const prevVisitorsCount = Math.max(prevSessions.size, prevEvents.length > 0 ? prevEvents.length : prevUsages.length);

  const currPageviewsCount = Math.max(
    currEvents.filter((e) => e.eventType === "pageview").length,
    currUsages.length + currEvents.length
  );
  const prevPageviewsCount = Math.max(
    prevEvents.filter((e) => e.eventType === "pageview").length,
    prevUsages.length + prevEvents.length
  );

  // 2. Calculate Tool Usage Metrics (Strictly without double-counting)
  const currExecEvents = currEvents.filter((e) => e.eventType === "tool_execution");
  const prevExecEvents = prevEvents.filter((e) => e.eventType === "tool_execution");

  const currExecutionsCount = Math.max(currUsages.length, currExecEvents.length);
  const prevExecutionsCount = Math.max(prevUsages.length, prevExecEvents.length);

  const currFailedCount = currErrors.length + currExecEvents.filter((e) => e.success === false).length;
  const prevFailedCount = prevErrors.length + prevEvents.filter((e) => e.success === false).length;

  const currSuccessCount = Math.max(0, currExecutionsCount - currFailedCount);
  const prevSuccessCount = Math.max(0, prevExecutionsCount - prevFailedCount);

  const currSuccessRate = currExecutionsCount > 0 ? Number(((currSuccessCount / currExecutionsCount) * 100).toFixed(1)) : 100;
  const prevSuccessRate = prevExecutionsCount > 0 ? Number(((prevSuccessCount / prevExecutionsCount) * 100).toFixed(1)) : 100;

  // Average Execution Time in ms (computed strictly from measured events)
  const execTimeEvents = currEvents.filter((e) => e.executionTime && e.executionTime > 0);
  const avgExecTimeMs =
    execTimeEvents.length > 0
      ? Math.round(execTimeEvents.reduce((acc, e) => acc + (e.executionTime || 0), 0) / execTimeEvents.length)
      : 0;

  // 3. Conversions & Revenue Metrics
  const currSignups = currUsers.length;
  const prevSignups = prevUsers.length;

  const currSubsCount = currSubs.length;
  const prevSubsCount = prevSubs.length;

  const currRevenue = currPayments.reduce((acc, p) => acc + (p.amount || 0), 0);
  const prevRevenue = prevPayments.reduce((acc, p) => acc + (p.amount || 0), 0);

  const signupConvRate = currVisitorsCount > 0 ? Number(((currSignups / currVisitorsCount) * 100).toFixed(2)) : 0;
  const prevSignupConvRate = prevVisitorsCount > 0 ? Number(((prevSignups / prevVisitorsCount) * 100).toFixed(2)) : 0;

  const subConvRate = currSignups > 0 ? Number(((currSubsCount / currSignups) * 100).toFixed(2)) : 0;
  const prevSubConvRate = prevSignups > 0 ? Number(((prevSubsCount / prevSignups) * 100).toFixed(2)) : 0;

  // Summary KPI Object with period comparisons
  const kpis = {
    visitors: { current: currVisitorsCount, previous: prevVisitorsCount, pctChange: calcPctChange(currVisitorsCount, prevVisitorsCount) },
    pageViews: { current: currPageviewsCount, previous: prevPageviewsCount, pctChange: calcPctChange(currPageviewsCount, prevPageviewsCount) },
    executions: { current: currExecutionsCount, previous: prevExecutionsCount, pctChange: calcPctChange(currExecutionsCount, prevExecutionsCount) },
    successRate: { current: currSuccessRate, previous: prevSuccessRate, pctChange: calcPctChange(currSuccessRate, prevSuccessRate) },
    avgExecTimeMs: { current: avgExecTimeMs, previous: 0, pctChange: calcPctChange(avgExecTimeMs, 0), isIncreaseGood: false },
    signups: { current: currSignups, previous: prevSignups, pctChange: calcPctChange(currSignups, prevSignups) },
    signupConvRate: { current: signupConvRate, previous: prevSignupConvRate, pctChange: calcPctChange(signupConvRate, prevSignupConvRate) },
    subscriptions: { current: currSubsCount, previous: prevSubsCount, pctChange: calcPctChange(currSubsCount, prevSubsCount) },
    subConvRate: { current: subConvRate, previous: prevSubConvRate, pctChange: calcPctChange(subConvRate, prevSubConvRate) },
    revenue: { current: currRevenue, previous: prevRevenue, pctChange: calcPctChange(currRevenue, prevRevenue) },
  };

  // 4. Generate Time Series Trend
  const intervals = diffDays > 60
    ? eachWeekOfInterval({ start: current.start, end: current.end })
    : eachDayOfInterval({ start: current.start, end: current.end });

  const trafficTrend = intervals.map((date) => {
    const isMatching = (d: Date) => (diffDays > 60 ? isSameWeek(d, date) : isSameDay(d, date));

    const dayVisits = currEvents.filter((e) => isMatching(e.createdAt)).length + currUsages.filter((u) => isMatching(u.createdAt)).length;
    const dayUsagesCount = currUsages.filter((u) => isMatching(u.createdAt)).length;
    const dayExecEventsCount = currEvents.filter((e) => e.eventType === "tool_execution" && isMatching(e.createdAt)).length;
    const dayExecs = Math.max(dayUsagesCount, dayExecEventsCount);
    const dayFailures = currErrors.filter((err) => isMatching(err.createdAt)).length + currEvents.filter((e) => e.success === false && isMatching(e.createdAt)).length;
    const dayPageviews = currEvents.filter((e) => e.eventType === "pageview" && isMatching(e.createdAt)).length;
    const daySignups = currUsers.filter((u) => isMatching(u.createdAt)).length;
    const daySubs = currSubs.filter((s) => isMatching(s.createdAt)).length;
    const dayRevenue = currPayments.filter((p) => isMatching(p.createdAt)).reduce((acc, p) => acc + (p.amount || 0), 0);

    return {
      date: format(date, diffDays > 60 ? "MMM d" : "MMM dd"),
      timestamp: date.getTime(),
      visitors: dayVisits,
      pageviews: dayPageviews > 0 ? dayPageviews : dayVisits,
      executions: dayExecs,
      failures: dayFailures,
      signups: daySignups,
      subscriptions: daySubs,
      newSubscriptions: daySubs,
      revenue: dayRevenue,
    };
  });

  // 5. Aggregate Top Tools Table Ranking
  const toolConfigMap = new Map(dbToolConfigs.map((c) => [c.toolSlug, c]));
  
  // Group real database usages & events by tool slug
  const usagesByTool = new Map<string, number>();
  currUsages.forEach((u) => {
    usagesByTool.set(u.toolSlug, (usagesByTool.get(u.toolSlug) || 0) + 1);
  });

  const execEventsByTool = new Map<string, number>();
  const failedEventsByTool = new Map<string, number>();
  const viewsByTool = new Map<string, number>();
  const timesByTool = new Map<string, number[]>();

  currEvents.forEach((e) => {
    if (!e.toolSlug) return;
    if (e.eventType === "tool_view") {
      viewsByTool.set(e.toolSlug, (viewsByTool.get(e.toolSlug) || 0) + 1);
    }
    if (e.eventType === "tool_execution") {
      execEventsByTool.set(e.toolSlug, (execEventsByTool.get(e.toolSlug) || 0) + 1);
      if (e.success === false) {
        failedEventsByTool.set(e.toolSlug, (failedEventsByTool.get(e.toolSlug) || 0) + 1);
      }
      if (e.executionTime && e.executionTime > 0) {
        const list = timesByTool.get(e.toolSlug) || [];
        list.push(e.executionTime);
        timesByTool.set(e.toolSlug, list);
      }
    }
  });

  const errorsByTool = new Map<string, number>();
  currErrors.forEach((e) => {
    if (!e.toolSlug) return;
    errorsByTool.set(e.toolSlug, (errorsByTool.get(e.toolSlug) || 0) + 1);
  });

  // Merge static registry tools & DB configs into ranking table
  const topToolsList = allTools.map((t) => {
    const dbConf = toolConfigMap.get(t.slug);
    const usagesCount = usagesByTool.get(t.slug) || 0;
    const execEventsCount = execEventsByTool.get(t.slug) || 0;

    const execs = Math.max(usagesCount, execEventsCount);
    const fails = (errorsByTool.get(t.slug) || 0) + (failedEventsByTool.get(t.slug) || 0);
    const views = Math.max(viewsByTool.get(t.slug) || 0, dbConf?.views || 0, execs);

    const successCount = Math.max(0, execs - fails);
    const successRate = execs > 0 ? Number(((successCount / execs) * 100).toFixed(1)) : 100;
    
    const times = timesByTool.get(t.slug) || [];
    const avgExecMs = times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;

    return {
      rank: 0,
      slug: t.slug,
      name: dbConf?.nameOverride || t.name,
      category: dbConf?.categorySlug || t.category,
      views,
      executions: execs,
      successful: successCount,
      failed: fails,
      successRate,
      avgExecutionTimeMs: avgExecMs,
      signupsGenerated: 0,
      subsGenerated: 0,
    };
  });

  // Sort by executions descending, then views descending, then name
  topToolsList.sort((a, b) => {
    if (b.executions !== a.executions) return b.executions - a.executions;
    if (b.views !== a.views) return b.views - a.views;
    return a.name.localeCompare(b.name);
  });

  // Re-assign ranks dynamically
  topToolsList.forEach((t, i) => {
    t.rank = i + 1;
  });

  // 6. Traffic Source Breakdown (strictly real data)
  const sourceMap = new Map<string, number>();
  currEvents.forEach((e) => {
    const src = e.source || "Direct";
    sourceMap.set(src, (sourceMap.get(src) || 0) + 1);
  });

  const trafficSources = Array.from(sourceMap.entries()).map(([source, visits]) => ({
    source,
    visits,
    pct: currVisitorsCount > 0 ? Number(((visits / currVisitorsCount) * 100).toFixed(1)) : 0,
  }));

  // 7. Device & Country Breakdown (strictly real data)
  const deviceMap = new Map<string, number>();
  const countryMap = new Map<string, number>();

  currEvents.forEach((e) => {
    if (e.device) deviceMap.set(e.device, (deviceMap.get(e.device) || 0) + 1);
    if (e.country) countryMap.set(e.country, (countryMap.get(e.country) || 0) + 1);
  });

  const devices = Array.from(deviceMap.entries()).map(([device, count]) => ({
    device,
    count,
    pct: currVisitorsCount > 0 ? Number(((count / currVisitorsCount) * 100).toFixed(1)) : 0,
  }));

  const countries = Array.from(countryMap.entries()).map(([country, count]) => ({
    country,
    count,
    pct: currVisitorsCount > 0 ? Number(((count / currVisitorsCount) * 100).toFixed(1)) : 0,
  }));

  return {
    params: {
      range: params.range || "30days",
      startDate: current.start.toISOString(),
      endDate: current.end.toISOString(),
      comparePrevious: params.comparePrevious ?? true,
    },
    kpis,
    trafficTrend,
    topTools: topToolsList,
    trafficSources,
    devices,
    countries,
  };
}

/**
 * Single Tool Analytics Drilldown Service.
 */
export async function getSingleToolAnalytics(slug: string, params: AnalyticsDateRangeParams) {
  const { current, previous } = resolveAnalyticsRanges(params);

  const staticTool = allTools.find((t) => t.slug === slug);
  const dbConfig = await prisma.toolConfig.findUnique({ where: { toolSlug: slug } });

  const [toolUsages, prevUsages, errors, events] = await Promise.all([
    prisma.toolUsage.findMany({
      where: { toolSlug: slug, createdAt: { gte: current.start, lte: current.end } },
      select: { userId: true, createdAt: true },
    }),
    prisma.toolUsage.findMany({
      where: { toolSlug: slug, createdAt: { gte: previous.start, lte: previous.end } },
      select: { createdAt: true },
    }),
    prisma.errorLog.findMany({
      where: { toolSlug: slug, createdAt: { gte: current.start, lte: current.end } },
      select: { severity: true, createdAt: true },
    }),
    prisma.analyticsEvent.findMany({
      where: { toolSlug: slug, createdAt: { gte: current.start, lte: current.end } },
      select: { eventType: true, success: true, executionTime: true, createdAt: true },
    }),
  ]);

  const execEvents = events.filter((e) => e.eventType === "tool_execution");
  const totalExecs = Math.max(toolUsages.length, execEvents.length);
  const prevExecs = prevUsages.length;
  const totalFails = errors.length + execEvents.filter((e) => e.success === false).length;
  const successfulCount = Math.max(0, totalExecs - totalFails);

  const successRate = totalExecs > 0 ? Number(((successfulCount / totalExecs) * 100).toFixed(1)) : 100;
  const viewEvents = events.filter((e) => e.eventType === "tool_view").length;
  const totalViews = Math.max(viewEvents, dbConfig?.views || 0, totalExecs);

  const times = events.map((e) => e.executionTime).filter(Boolean) as number[];
  const avgExecMs = times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;

  return {
    tool: {
      slug,
      name: dbConfig?.nameOverride || staticTool?.name || slug,
      category: dbConfig?.categorySlug || staticTool?.category || "Tools",
      status: dbConfig?.status ?? true,
    },
    stats: {
      views: totalViews,
      executions: { current: totalExecs, previous: prevExecs, pctChange: calcPctChange(totalExecs, prevExecs) },
      successful: successfulCount,
      failed: totalFails,
      successRate,
      avgExecutionTimeMs: avgExecMs,
      signupsAttributed: 0,
      subsAttributed: 0,
    },
  };
}
