"use server";

import { prisma as db } from "@/server/db";
import { auth } from "@/server/auth";

export async function recordToolUsage(toolSlug: string) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    
    await db.toolUsage.create({
      data: {
        toolSlug,
        userId: userId || null,
      },
    });

    return { success: true };
  } catch (err) {
    console.error("Failed to record tool usage:", err);
    return { success: false };
  }
}
