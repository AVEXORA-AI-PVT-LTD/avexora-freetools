import { NextResponse } from "next/server";
import { prisma as db } from "@/server/db";
import { auth } from "@/server/auth";
import { headers } from "next/headers";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { toolSlug, executionTimeMs, isSuccess = true } = body;

    if (!toolSlug || typeof toolSlug !== "string") {
      return NextResponse.json({ error: "toolSlug required" }, { status: 400 });
    }

    const session = await auth();
    const userId = session?.user?.id;

    const reqHeaders = await headers();
    const userAgent = reqHeaders.get("user-agent") || "";
    const referer = reqHeaders.get("referer") || "";

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
    if (referer.includes("google")) source = "Organic Search";
    else if (referer.includes("bing") || referer.includes("yahoo")) source = "Organic Search";
    else if (referer.includes("twitter") || referer.includes("facebook") || referer.includes("linkedin") || referer.includes("t.co")) source = "Social";
    else if (referer && !referer.includes("localhost") && !referer.includes("avexora")) source = "Referral";

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
        path: referer || `/${toolSlug}`,
        source,
        device,
        browser,
        os,
        country: "India",
        success: isSuccess,
        executionTime: typeof executionTimeMs === "number" ? executionTimeMs : 200,
      },
    });

    // 3. Increment views/runs in ToolConfig if exists
    await db.toolConfig.updateMany({
      where: { toolSlug },
      data: { views: { increment: 1 } },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to track tool usage via API:", err);
    return NextResponse.json({ error: "Failed to record tool usage" }, { status: 500 });
  }
}
