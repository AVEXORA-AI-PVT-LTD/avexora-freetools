"use server";

import { prisma } from "@/server/db";
import { requireAdminAuth } from "@/server/admin-auth";
import { isHigherOrEqualRole } from "@/lib/admin/permissions";
import { revalidatePath } from "next/cache";
import { UpdateRoleSchema } from "@/lib/admin/users";

export async function updateUserRole(formData: FormData) {
  try {
    const session = await requireAdminAuth();
    
    // Explicitly check for superadmin level authorization
    // Using isHigherOrEqualRole ensures we strictly check against superadmin level
    if (!isHigherOrEqualRole(session.role, "superadmin")) {
      return { error: "Only Super Admins can change user roles." };
    }

    const rawData = {
      userId: formData.get("userId")?.toString(),
      role: formData.get("role")?.toString(),
    };

    const parseResult = UpdateRoleSchema.safeParse(rawData);
    if (!parseResult.success) {
      return { error: parseResult.error.issues[0].message };
    }

    const { userId, role } = parseResult.data;

    // 1. Prevent self-demotion / self-modification
    if (userId === session.id) {
      return { error: "You cannot change your own role." };
    }

    // 2. Fetch the target user
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!targetUser) {
      return { error: "User not found." };
    }

    // 3. Last SUPER_ADMIN Protection
    if (targetUser.role === "superadmin" && role !== "superadmin") {
      const superAdminCount = await prisma.user.count({
        where: { role: "superadmin" },
      });
      
      if (superAdminCount <= 1) {
        return { error: "Cannot demote the last Super Admin. At least one Super Admin account must remain." };
      }
    }

    // 4. Update role (Mass assignment prevented by explicit data field)
    await prisma.user.update({
      where: { id: userId },
      data: { role },
    });

    revalidatePath("/admin/users");
    
    return { success: true };
  } catch (error) {
    console.error("[updateUserRole Error]:", error);
    return { error: "An unexpected error occurred while updating the role." };
  }
}
