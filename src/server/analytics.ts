import { prisma as db } from "./db";
import { allTools } from "@/tools/registry";
import { categories } from "@/tools/categories";

export type DateRange = "today" | "7d" | "30d" | "90d" | "year" | "all";

export function getDateFilter(range: DateRange) {
  const now = new Date();
  switch (range) {
    case "today":
      return new Date(now.setHours(0, 0, 0, 0));
    case "7d":
      return new Date(now.setDate(now.getDate() - 7));
    case "30d":
      return new Date(now.setDate(now.getDate() - 30));
    case "90d":
      return new Date(now.setDate(now.getDate() - 90));
    case "year":
      return new Date(now.setFullYear(now.getFullYear() - 1));
    case "all":
    default:
      return new Date(0); // Epoch
  }
}

export async function getAnalyticsSummary(range: DateRange) {
  const fromDate = getDateFilter(range);

  const [totalUses, activeUsers, toolsUsedList] = await Promise.all([
    db.toolUsage.count({ where: { createdAt: { gte: fromDate } } }),
    db.toolUsage.groupBy({
      by: ["userId"],
      where: { createdAt: { gte: fromDate }, userId: { not: null } },
      _count: { userId: true },
    }),
    db.toolUsage.groupBy({
      by: ["toolSlug"],
      where: { createdAt: { gte: fromDate } },
      _count: { toolSlug: true },
      orderBy: { _count: { toolSlug: "desc" } },
      take: 1,
    }),
  ]);

  const activeTools = await db.toolUsage.groupBy({
    by: ["toolSlug"],
    where: { createdAt: { gte: fromDate } },
    _count: { toolSlug: true },
  });

  let mostUsedToolName = "None";
  if (toolsUsedList.length > 0) {
    const topSlug = toolsUsedList[0].toolSlug;
    const tool = allTools.find(t => t.slug === topSlug);
    mostUsedToolName = tool ? tool.name : topSlug;
  }

  return {
    totalUses,
    activeToolsCount: activeTools.length,
    activeUsersCount: activeUsers.length,
    mostUsedToolName,
  };
}

export async function getTopTools(range: DateRange, limit = 10) {
  const fromDate = getDateFilter(range);
  
  const totalUses = await db.toolUsage.count({ where: { createdAt: { gte: fromDate } } });
  
  const grouped = await db.toolUsage.groupBy({
    by: ["toolSlug"],
    where: { createdAt: { gte: fromDate } },
    _count: { toolSlug: true },
    orderBy: { _count: { toolSlug: "desc" } },
    take: limit,
  });

  return grouped.map(g => {
    const tool = allTools.find(t => t.slug === g.toolSlug);
    const cat = categories.find(c => c.slug === tool?.category);
    return {
      slug: g.toolSlug,
      name: tool ? tool.name : g.toolSlug,
      category: cat ? cat.name : (tool?.category || "Unknown"),
      uses: g._count.toolSlug,
      percentage: totalUses > 0 ? (g._count.toolSlug / totalUses) * 100 : 0,
    };
  });
}

export async function getCategoryUsage(range: DateRange) {
  const fromDate = getDateFilter(range);
  
  const grouped = await db.toolUsage.groupBy({
    by: ["toolSlug"],
    where: { createdAt: { gte: fromDate } },
    _count: { toolSlug: true },
  });

  const catUsage: Record<string, number> = {};
  for (const g of grouped) {
    const tool = allTools.find(t => t.slug === g.toolSlug);
    const catSlug = tool?.category || "unknown";
    catUsage[catSlug] = (catUsage[catSlug] || 0) + g._count.toolSlug;
  }

  return Object.entries(catUsage)
    .map(([slug, count]) => {
      const cat = categories.find(c => c.slug === slug);
      return {
        slug,
        name: cat ? cat.name : slug,
        count,
      };
    })
    .sort((a, b) => b.count - a.count);
}

export async function getTimelineData(range: DateRange) {
  const fromDate = getDateFilter(range);
  
  // Since MongoDB doesn't easily let Prisma do date truncations in groupBy (without raw queries),
  // and we expect admin panel data to be reasonably sized for a timeline (or we can just fetch and group in memory)
  // Wait, if there are 1,000,000 records, fetching all to memory for timeline is bad.
  // Actually, Prisma does not support date truncation natively yet. We can use a Raw query.
  
  const pipeline = [
    { $match: { createdAt: { $gte: { $dateFromString: { dateString: fromDate.toISOString() } } } } },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ];

  const results = await db.toolUsage.aggregateRaw({
    pipeline
  }) as unknown as any[];
  
  // Parse the raw results
  const formatted = results.map(r => ({
    date: r._id,
    uses: r.count
  }));

  // Fill in missing dates to make the chart look contiguous
  const dateMap = new Map<string, number>();
  formatted.forEach(f => dateMap.set(f.date, f.uses));

  const finalTimeline = [];
  let curr = new Date(fromDate);
  if (range === "all") {
    // If all, start from the first date in the results
    if (formatted.length > 0) {
      curr = new Date(formatted[0].date);
    } else {
      curr = new Date();
    }
  }
  
  const end = new Date();
  while (curr <= end) {
    const dStr = curr.toISOString().split("T")[0];
    finalTimeline.push({
      date: dStr,
      uses: dateMap.get(dStr) || 0
    });
    curr.setDate(curr.getDate() + 1);
  }

  return finalTimeline;
}

export async function getAuthVsAnon(range: DateRange) {
  const fromDate = getDateFilter(range);
  
  const [authCount, anonCount] = await Promise.all([
    db.toolUsage.count({ where: { createdAt: { gte: fromDate }, userId: { not: null } } }),
    db.toolUsage.count({ where: { createdAt: { gte: fromDate }, userId: null } }),
  ]);

  return { authenticated: authCount, anonymous: anonCount };
}
