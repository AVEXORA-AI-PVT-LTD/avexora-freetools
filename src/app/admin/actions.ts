"use server";

import { prisma } from "@/server/db";
import { toolsByCategory } from "@/tools/registry";
import { requireAdminAuth } from "@/server/admin-auth";

export type DashboardStats = {
  totalUsers: number | null;
  adminUsers: number | null;
  totalCategories: number | null;
  activeTools: number | null;
  error?: string;
};

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    await requireAdminAuth("dashboard.view");

    // Fetch user counts in parallel
    const [totalUsers, adminUsers] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          role: { in: ["admin", "superadmin", "editor"] }
        }
      })
    ]);

    // Compute Category and Tool counts from Static Registry
    // Phase 3 Limitation: CategoryConfig and ToolConfig MongoDB overrides are not yet implemented.
    // The current count reflects the static source code registry exactly.
    const totalCategories = Object.keys(toolsByCategory).length;
    
    let activeTools = 0;
    for (const cat of Object.values(toolsByCategory)) {
      activeTools += cat.length;
    }

    return {
      totalUsers,
      adminUsers,
      totalCategories,
      activeTools
    };
  } catch (error) {
    console.error("[DashboardStats Error]:", error);
    return {
      totalUsers: null,
      adminUsers: null,
      totalCategories: null,
      activeTools: null,
      error: "Unable to load dashboard statistics. Please try again."
    };
  }
}
