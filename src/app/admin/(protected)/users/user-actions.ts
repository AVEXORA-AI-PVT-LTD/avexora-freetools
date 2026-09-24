"use server";
import { requireAdminAuth } from "@/server/admin-auth";
import { prisma } from "@/server/db";
import { revalidateTag } from "next/cache";
import type { Prisma } from "@prisma/client";

export async function updateUserStatus(userId: string, status: "ACTIVE" | "DISABLED" | "BLOCKED", reason?: string) {
  const admin = await requireAdminAuth("users.edit"); // Need strict permissions
  
  if (admin.id === userId) {
    throw new Error("You cannot change your own account status.");
  }

  const updateData: Prisma.UserUpdateInput = { status };
  const now = new Date();
  
  if (status === "DISABLED") updateData.disabledAt = now;
  if (status === "BLOCKED") updateData.blockedAt = now;
  if (status === "ACTIVE") {
    updateData.disabledAt = null;
    updateData.blockedAt = null;
    updateData.lockedUntil = null;
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: updateData
  });

  await prisma.auditLog.create({
    data: {
      actorId: admin.id,
      actorRole: admin.role || "unknown",
      action: `USER_${status}`,
      targetType: "USER",
      targetId: userId,
      metadata: { reason }
    }
  });

  revalidateTag(`user-${userId}`, 'max');
  revalidateTag('admin-users', 'max');
  return user;
}

export async function bulkUpdateUserStatus(userIds: string[], status: "ACTIVE" | "DISABLED" | "BLOCKED") {
  const admin = await requireAdminAuth("users.edit");
  
  const safeIds = userIds.filter(id => id !== admin.id);
  if (safeIds.length === 0) throw new Error("Cannot modify selected users.");

  const updateData: Prisma.UserUpdateManyMutationInput = { status };
  const now = new Date();
  if (status === "DISABLED") updateData.disabledAt = now;
  if (status === "BLOCKED") updateData.blockedAt = now;
  if (status === "ACTIVE") {
    updateData.disabledAt = null;
    updateData.blockedAt = null;
    updateData.lockedUntil = null;
  }

  await prisma.user.updateMany({
    where: { id: { in: safeIds } },
    data: updateData
  });

  await prisma.auditLog.create({
    data: {
      actorId: admin.id,
      actorRole: admin.role || "unknown",
      action: `USER_BULK_${status}`,
      targetType: "USER",
      targetId: "bulk",
      metadata: { count: safeIds.length }
    }
  });

  revalidateTag('admin-users', 'max');
  return { success: true, count: safeIds.length };
}

export async function updateUserRole(userId: string, role: string) {
  const admin = await requireAdminAuth("users.manage_roles");
  
  if (admin.id === userId) {
    throw new Error("You cannot change your own role.");
  }
  if (admin.role !== "superadmin" && role === "superadmin") {
    throw new Error("Only superadmins can promote users to superadmin.");
  }
  
  // Prevent removing last superadmin
  if (role !== "superadmin") {
    const target = await prisma.user.findUnique({ where: { id: userId } });
    if (target?.role === "superadmin") {
      const superAdminCount = await prisma.user.count({ where: { role: "superadmin", status: "ACTIVE" } });
      if (superAdminCount <= 1) {
        throw new Error("Cannot demote the last active superadmin.");
      }
    }
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { role }
  });

  await prisma.auditLog.create({
    data: {
      actorId: admin.id,
      actorRole: admin.role || "unknown",
      action: "USER_ROLE_CHANGED",
      targetType: "USER",
      targetId: userId,
      metadata: { newRole: role }
    }
  });

  revalidateTag(`user-${userId}`, 'max');
  revalidateTag('admin-users', 'max');
  return user;
}

export async function deleteUser(userId: string) {
  const admin = await requireAdminAuth("users.delete");
  
  if (admin.id === userId) {
    throw new Error("You cannot delete your own account.");
  }

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (target?.role === "superadmin") {
    throw new Error("Cannot delete a superadmin. Demote them first.");
  }

  // Soft deletion to respect data-retention (as per constraints)
  await prisma.user.update({
    where: { id: userId },
    data: { status: "DELETED", deletedAt: new Date() }
  });

  await prisma.auditLog.create({
    data: {
      actorId: admin.id,
      actorRole: admin.role || "unknown",
      action: "USER_DELETED",
      targetType: "USER",
      targetId: userId,
      metadata: { type: "SOFT_DELETE" }
    }
  });

  revalidateTag(`user-${userId}`, 'max');
  revalidateTag('admin-users', 'max');
  return { success: true };
}

export async function revokeUserSessions(userId: string) {
  const admin = await requireAdminAuth("users.revoke_sessions");
  
  await prisma.session.deleteMany({
    where: { userId }
  });

  await prisma.auditLog.create({
    data: {
      actorId: admin.id,
      actorRole: admin.role || "unknown",
      action: "USER_SESSIONS_REVOKED",
      targetType: "USER",
      targetId: userId
    }
  });

  return { success: true };
}


export async function changeUserPlan(userId: string, newPlan: string) {
  const admin = await requireAdminAuth("users.change_plan");
  
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { subscription: true } });
  if (!user) throw new Error("User not found");

  if (newPlan === "free") {
    // Downgrade to free => delete subscription
    if (user.subscription) {
      await prisma.subscription.delete({ where: { userId } });
    }
  } else {
    // Upsert subscription
    await prisma.subscription.upsert({
      where: { userId },
      update: { plan: newPlan, status: "active" },
      create: { userId, plan: newPlan, status: "active", cycle: "monthly" }
    });
  }

  await prisma.auditLog.create({
    data: {
      actorId: admin.id,
      actorRole: admin.role || "unknown",
      action: "USER_PLAN_CHANGED",
      targetType: "USER",
      targetId: userId,
      metadata: { newPlan }
    }
  });

  revalidateTag(`user-${userId}`, 'max');
  revalidateTag('admin-users', 'max');
  return { success: true };
}
