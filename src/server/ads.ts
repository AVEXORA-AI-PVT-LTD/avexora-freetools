import { prisma } from "@/server/db";

export interface GetAdsOptions {
  device?: "desktop" | "mobile" | "tablet" | "all";
  categorySlug?: string;
  toolSlug?: string;
}

export async function getEligibleAds(placement: string, options: GetAdsOptions = {}) {
  const now = new Date();

  // Query conditions for date validity and active status
  const baseWhere: any = {
    placement,
    active: true,
    OR: [
      { startDate: null },
      { startDate: { lte: now } }
    ],
    AND: [
      {
        OR: [
          { endDate: null },
          { endDate: { gte: now } }
        ]
      }
    ]
  };

  // Device filtering
  if (options.device && options.device !== "all") {
    baseWhere.device = { in: ["all", options.device] };
  }

  // Precedence order:
  // 1. Tool-specific ad (matches toolSlug)
  // 2. Category-specific ad (matches categorySlug)
  // 3. Global ad (no categorySlug, no toolSlug)
  let ads: any[] = [];
  try {
    if (!prisma.adSlot) return [];
    ads = await prisma.adSlot.findMany({
      where: baseWhere,
      orderBy: [
        { priority: "asc" },
        { updatedAt: "desc" }
      ]
    });
  } catch (err) {
    console.error("Failed to fetch ad slots:", err);
    return [];
  }

  if (ads.length === 0) return [];

  // Filter precedence if category/tool provided
  if (options.toolSlug) {
    const toolAds = ads.filter(a => a.toolSlug === options.toolSlug);
    if (toolAds.length > 0) return toolAds;
  }

  if (options.categorySlug) {
    const catAds = ads.filter(a => a.categorySlug === options.categorySlug && !a.toolSlug);
    if (catAds.length > 0) return catAds;
  }

  // Return global ads (where neither categorySlug nor toolSlug is set, or all matching)
  const globalAds = ads.filter(a => !a.categorySlug && !a.toolSlug);
  return globalAds.length > 0 ? globalAds : ads;
}
