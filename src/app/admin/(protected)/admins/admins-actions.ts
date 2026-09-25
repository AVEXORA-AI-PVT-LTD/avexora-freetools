"use server";

import { prisma } from "@/server/db";
import { requirePermission, checkLastSuperAdminProtection, getCustomRolesMap } from "@/server/permissions";
import {
  SYSTEM_ROLES,
  normalizeRoleSlug,
  ROLE_HIERARCHY,
  getEffectivePermissions,
  PERMISSION_REGISTRY,
} from "@/lib/admin/permissions";
import { logAdminAction } from "@/server/audit";
import { revalidatePath } from "next/cache";

export interface GetAdminsParams {
  search?: string;
  roleFilter?: string;
  statusFilter?: string;
  page?: number;
  limit?: number;
}

export async function getAdministratorsAction(params: GetAdminsParams = {}) {
  await requirePermission("admins.view");

  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 20));
  const skip = (page - 1) * limit;

  // Filter users who have non-user roles or custom roles
  const where: any = {
    OR: [
      { role: { in: ["super_admin", "superadmin", "admin", "content_manager", "editor", "support", "finance"] } },
      { customRoles: { isEmpty: false } },
    ],
  };

  if (params.search && params.search.trim()) {
    const query = params.search.trim();
    where.AND = [
      {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
        ],
      },
    ];
  }

  if (params.statusFilter && params.statusFilter !== "ALL") {
    where.status = params.statusFilter;
  }

  if (params.roleFilter && params.roleFilter !== "ALL") {
    const targetSlug = normalizeRoleSlug(params.roleFilter);
    where.OR = [{ role: targetSlug }, { customRoles: { has: targetSlug } }];
  }

  const [items, totalCount] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        customRoles: true,
        status: true,
        lastActiveAt: true,
        createdAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  // Fetch DB custom roles map for permission union calculation
  const customRoleMap = await getCustomRolesMap();

  const formattedItems = items.map((u) => {
    const primarySlug = normalizeRoleSlug(u.role);
    const customSlugs = (u.customRoles || []).map(normalizeRoleSlug);
    const allSlugs = Array.from(new Set([primarySlug, ...customSlugs]));

    const effectivePerms = getEffectivePermissions(allSlugs, customRoleMap);

    return {
      ...u,
      primaryRole: primarySlug,
      customRoles: customSlugs,
      allRoles: allSlugs,
      effectivePermissionCount: effectivePerms.includes("*") ? PERMISSION_REGISTRY.length : effectivePerms.length,
      isSuperAdmin: effectivePerms.includes("*"),
    };
  });

  // Fetch custom database roles for role selection UI
  const dbCustomRoles = await prisma.role.findMany({
    where: { status: true },
    select: { id: true, name: true, slug: true, isSystemRole: true },
  });

  return {
    items: formattedItems,
    pagination: {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
    },
    systemRoles: Object.values(SYSTEM_ROLES).map((s) => ({ slug: s.slug, name: s.name })),
    customRoles: dbCustomRoles.map((r) => ({ slug: r.slug, name: r.name, isSystemRole: r.isSystemRole })),
  };
}

/**
 * Assign primary role and additional custom roles to an admin user.
 */
export async function assignAdminRolesAction(
  targetUserId: string,
  primaryRole: string,
  customRoles: string[] = []
) {
  const { user: actor, roles: actorRoles } = await requirePermission("admins.update");

  if (!targetUserId) {
    return { success: false, error: "Target user ID is required." };
  }

  // Self-modification protection: Cannot edit own role
  if (actor.id === targetUserId) {
    return { success: false, error: "Self-Modification Safeguard: You cannot alter your own admin roles." };
  }

  const normalizedPrimary = normalizeRoleSlug(primaryRole);
  const normalizedCustom = Array.from(new Set(customRoles.map(normalizeRoleSlug).filter((r) => r !== normalizedPrimary)));

  // Privilege Escalation Safeguard
  const actorPrimary = normalizeRoleSlug(actor.role);
  const isActorSuper = actorPrimary === "super_admin" || actorRoles.includes("super_admin");

  const actorLevel = isActorSuper ? 100 : ROLE_HIERARCHY[actorPrimary] || 0;
  const targetNewLevel = Math.max(
    ROLE_HIERARCHY[normalizedPrimary] || 0,
    ...normalizedCustom.map((c) => ROLE_HIERARCHY[c] || 0)
  );

  if (!isActorSuper && targetNewLevel >= actorLevel) {
    await logAdminAction({
      action: "PRIVILEGE_ESCALATION_ATTEMPT",
      targetType: "USER",
      targetId: targetUserId,
      metadata: {
        reason: "Attempted to assign role higher or equal to caller level",
        attemptedPrimary: normalizedPrimary,
        attemptedCustom: normalizedCustom,
      },
    });
    return { success: false, error: "Privilege Escalation Safeguard: You cannot grant roles or privileges equal to or higher than your own level." };
  }

  // Check Last Super Admin Protection
  if (normalizedPrimary !== "super_admin" && !normalizedCustom.includes("super_admin")) {
    try {
      await checkLastSuperAdminProtection(targetUserId);
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  const existing = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, email: true, role: true, customRoles: true },
  });

  if (!existing) {
    return { success: false, error: "User not found." };
  }

  await prisma.user.update({
    where: { id: targetUserId },
    data: {
      role: normalizedPrimary,
      customRoles: normalizedCustom,
    },
  });

  await logAdminAction({
    action: "ADMIN_ROLE_ASSIGNED",
    targetType: "USER",
    targetId: targetUserId,
    metadata: {
      targetEmail: existing.email,
      oldPrimary: existing.role,
      newPrimary: normalizedPrimary,
      newCustomRoles: normalizedCustom,
    },
  });

  revalidatePath("/admin/admins");
  revalidatePath("/admin/users");
  return { success: true };
}

/**
 * Toggle admin status (ACTIVE, DISABLED, BLOCKED).
 */
export async function updateAdminStatusAction(targetUserId: string, status: "ACTIVE" | "DISABLED" | "BLOCKED") {
  const { user: actor } = await requirePermission("admins.update");

  if (actor.id === targetUserId) {
    return { success: false, error: "Self-Modification Safeguard: You cannot change your own account status." };
  }

  if (status !== "ACTIVE") {
    try {
      await checkLastSuperAdminProtection(targetUserId);
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  const existing = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, email: true, status: true },
  });

  if (!existing) {
    return { success: false, error: "User not found." };
  }

  await prisma.user.update({
    where: { id: targetUserId },
    data: {
      status,
      disabledAt: status === "DISABLED" ? new Date() : null,
      blockedAt: status === "BLOCKED" ? new Date() : null,
    },
  });

  await logAdminAction({
    action: "ADMIN_STATUS_CHANGED",
    targetType: "USER",
    targetId: targetUserId,
    metadata: {
      targetEmail: existing.email,
      oldStatus: existing.status,
      newStatus: status,
    },
  });

  revalidatePath("/admin/admins");
  revalidatePath("/admin/users");
  return { success: true };
}
