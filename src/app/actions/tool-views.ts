"use server";

import { prisma as db } from "@/server/db";

export async function incrementToolViews(toolSlug: string, categorySlug: string) {
  try {
    await db.toolConfig.upsert({
      where: { toolSlug },
      create: {
        toolSlug,
        categorySlug,
        views: 1,
      },
      update: {
        views: { increment: 1 },
      },
    });
    return { success: true };
  } catch (err) {
    // Silently fail if database error
    return { success: false };
  }
}
