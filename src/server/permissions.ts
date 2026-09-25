import { auth } from "@/server/auth";
import { prisma } from "@/server/db";
import { hasPermission, normalizeRoleSlug } from "@/lib/admin/permissions";

/**
 * Loads custom role permission mappings from database for dynamic evaluation.
 */
export async function getCustomRolesMap(): Promise<Record<string, string[]>> {
  try {
    const roles = await prisma.role.findMany({
      where: { status: true },
      select: { slug: true, permissions: true },
    });
    return Object.fromEntries(roles.map((r) => [r.slug, r.permissions]));
  } catch (err) {
    console.error("Failed to load custom roles map:", err);
    return {};
  }
}

/**
 * Server-side permission assertion for Server Actions & API routes.
 */
export async function requirePermission(permission: string) {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    throw new Error("Unauthorized: Authentication required");
  }

  // Fetch fresh user role & customRoles from DB to ensure stale session tokens don't bypass RBAC
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, customRoles: true, status: true },
  });

  if (!dbUser || dbUser.status !== "ACTIVE") {
    throw new Error("Forbidden: Account is inactive or blocked");
  }

  const allRoles = Array.from(new Set([dbUser.role, ...(dbUser.customRoles || [])].filter(Boolean))) as string[];
  const customRoleMap = await getCustomRolesMap();

  const allowed = hasPermission(allRoles, permission, customRoleMap);

  if (!allowed) {
    throw new Error(`Forbidden: Missing required permission [${permission}]`);
  }

  return {
    user: dbUser,
    roles: allRoles,
  };
}

/**
 * Server-side assertion requiring Super Admin role.
 */
export async function requireSuperAdmin() {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    throw new Error("Unauthorized: Authentication required");
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, customRoles: true, status: true },
  });

  if (!dbUser || dbUser.status !== "ACTIVE") {
    throw new Error("Forbidden: Account is inactive or blocked");
  }

  const primarySlug = normalizeRoleSlug(dbUser.role);
  const customSlugs = (dbUser.customRoles || []).map(normalizeRoleSlug);

  const isSuperAdmin = primarySlug === "super_admin" || customSlugs.includes("super_admin");

  if (!isSuperAdmin) {
    throw new Error("Forbidden: Super Admin access required");
  }

  return dbUser;
}

/**
 * Prevents demoting, deleting, or disabling the last active Super Admin.
 */
export async function checkLastSuperAdminProtection(targetUserId: string): Promise<void> {
  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, role: true, customRoles: true, status: true },
  });

  if (!targetUser) return;

  const targetPrimary = normalizeRoleSlug(targetUser.role);
  const targetCustom = (targetUser.customRoles || []).map(normalizeRoleSlug);
  const isSuperAdmin = targetPrimary === "super_admin" || targetCustom.includes("super_admin");

  if (!isSuperAdmin) return;

  // Count active super admins in database
  const activeUsers = await prisma.user.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, role: true, customRoles: true },
  });

  const activeSuperAdminCount = activeUsers.filter((u) => {
    const p = normalizeRoleSlug(u.role);
    const c = (u.customRoles || []).map(normalizeRoleSlug);
    return p === "super_admin" || c.includes("super_admin");
  }).length;

  if (activeSuperAdminCount <= 1) {
    throw new Error("Action Blocked: At least one active Super Admin must remain in the system.");
  }
}
