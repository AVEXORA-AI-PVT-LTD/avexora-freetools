"use server";

import { prisma as db } from "@/server/db";
import { auth } from "@/server/auth";
import { headers } from "next/headers";

export async function recordPageViewAction(params: { path: string; referrer?: string }) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    const reqHeaders = await headers();
    const userAgent = reqHeaders.get("user-agent") || "";
    const refererHeader = reqHeaders.get("referer") || params.referrer || "";

    // Derive simple device & browser strings
    const isMobile = /mobile|iphone|android|ipad/i.test(userAgent);
    const isTablet = /ipad|tablet/i.test(userAgent);
    const device = isTablet ? "tablet" : isMobile ? "mobile" : "desktop";

    let browser = "Chrome";
    if (/firefox/i.test(userAgent)) browser = "Firefox";
    else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) browser = "Safari";
    else if (/edg/i.test(userAgent)) browser = "Edge";

    let os = "Windows";
    if (/mac/i.test(userAgent)) os = "macOS";
    else if (/android/i.test(userAgent)) os = "Android";
    else if (/iphone|ipad/i.test(userAgent)) os = "iOS";
    else if (/linux/i.test(userAgent)) os = "Linux";

    let source = "Direct";
    if (refererHeader.includes("google")) source = "Organic Search";
    else if (refererHeader.includes("bing") || refererHeader.includes("yahoo")) source = "Organic Search";
    else if (refererHeader.includes("twitter") || refererHeader.includes("facebook") || refererHeader.includes("linkedin") || refererHeader.includes("t.co")) source = "Social";
    else if (refererHeader && !refererHeader.includes("localhost") && !refererHeader.includes("avexora")) source = "Referral";

    // Deduce tool slug if on a tool path
    const pathParts = params.path.split("/").filter(Boolean);
    const toolSlug = pathParts.length > 0 ? pathParts[pathParts.length - 1] : undefined;

    await db.analyticsEvent.create({
      data: {
        eventType: toolSlug && params.path !== "/" ? "tool_view" : "pageview",
        path: params.path,
        toolSlug,
        userId: userId || null,
        referrer: refererHeader.substring(0, 500),
        source,
        device,
        browser,
        os,
        country: "India",
        success: true,
      },
    });

    return { success: true };
  } catch (err) {
    console.error("Failed to record pageview:", err);
    return { success: false };
  }
}

export async function recordToolUsage(toolSlug: string, executionTimeMs?: number, isSuccess: boolean = true) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    const reqHeaders = await headers();
    const userAgent = reqHeaders.get("user-agent") || "";
    const isMobile = /mobile|iphone|android|ipad/i.test(userAgent);
    const device = isMobile ? "mobile" : "desktop";

    // 1. Record legacy ToolUsage
    await db.toolUsage.create({
      data: {
        toolSlug,
        userId: userId || null,
      },
    });

    // 2. Record detailed AnalyticsEvent
    await db.analyticsEvent.create({
      data: {
        eventType: "tool_execution",
        toolSlug,
        userId: userId || null,
        device,
        browser: "Chrome",
        os: "macOS",
        country: "India",
        success: isSuccess,
        executionTime: executionTimeMs || 200,
      },
    });

    // 3. Increment views/runs in ToolConfig if exists
    await db.toolConfig.updateMany({
      where: { toolSlug },
      data: { views: { increment: 1 } },
    });

    return { success: true };
  } catch (err) {
    console.error("Failed to record tool usage:", err);
    return { success: false };
  }
}
