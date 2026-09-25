"use server";

import { prisma } from "@/server/db";
import { requirePermission } from "@/server/permissions";
import { SYSTEM_ROLES, PERMISSION_REGISTRY, normalizeRoleSlug } from "@/lib/admin/permissions";
import { logAdminAction } from "@/server/audit";
import { revalidatePath } from "next/cache";

export interface RoleDataInput {
  name: string;
  slug?: string;
  description?: string;
  permissions: string[];
}

/**
 * Generates a clean URL slug from name string.
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/**
 * Fetch all system roles and database custom roles with assigned user counts.
 */
/**
 * Fetch all system roles and database custom roles with assigned user counts.
 */
export async function getRolesAction() {
  await requirePermission("roles.view");

  // Fetch custom and overridden roles from database
  const dbRoles = await prisma.role.findMany({
    orderBy: { createdAt: "desc" },
  });

  const dbRolesBySlug = new Map(dbRoles.map((r) => [r.slug, r]));

  // Fetch all users to compute real-time role usage counts
  const users = await prisma.user.findMany({
    select: { id: true, role: true, customRoles: true },
  });

  // Compute counts per role slug
  const userCountsByRole: Record<string, number> = {};
  users.forEach((u) => {
    const primary = normalizeRoleSlug(u.role);
    userCountsByRole[primary] = (userCountsByRole[primary] || 0) + 1;

    (u.customRoles || []).forEach((cr) => {
      const normalizedCr = normalizeRoleSlug(cr);
      if (normalizedCr !== primary) {
        userCountsByRole[normalizedCr] = (userCountsByRole[normalizedCr] || 0) + 1;
      }
    });
  });

  // Format system roles (overlaying DB customizations if present)
  const systemRolesList = Object.values(SYSTEM_ROLES).map((sys) => {
    const dbOverride = dbRolesBySlug.get(sys.slug);
    const perms = dbOverride ? dbOverride.permissions : sys.permissions;
    return {
      id: dbOverride ? dbOverride.id : sys.slug,
      name: sys.name,
      slug: sys.slug,
      description: dbOverride?.description || sys.description,
      isSystemRole: true,
      isCustomized: !!dbOverride,
      status: true,
      permissions: perms,
      permissionCount: perms.includes("*") ? PERMISSION_REGISTRY.length : perms.length,
      userCount: userCountsByRole[sys.slug] || 0,
      updatedAt: dbOverride ? dbOverride.updatedAt.toISOString() : new Date().toISOString(),
    };
  });

  // Format custom database roles (excluding pure system role overrides from the custom tab)
  const systemSlugs = new Set<string>(Object.values(SYSTEM_ROLES).map((s) => s.slug));
  const customRolesList = dbRoles
    .filter((role) => !systemSlugs.has(role.slug))
    .map((role) => ({
      id: role.id,
      name: role.name,
      slug: role.slug,
      description: role.description || "",
      isSystemRole: role.isSystemRole,
      status: role.status,
      permissions: role.permissions,
      permissionCount: role.permissions.includes("*") ? PERMISSION_REGISTRY.length : role.permissions.length,
      userCount: userCountsByRole[role.slug] || 0,
      updatedAt: role.updatedAt.toISOString(),
    }));

  return {
    systemRoles: systemRolesList,
    customRoles: customRolesList,
    totalPermissionsCount: PERMISSION_REGISTRY.length,
  };
}

function isValidObjectId(str: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(str);
}

/**
 * Fetch detailed role information by ID or slug.
 */
export async function getRoleByIdAction(idOrSlug: string) {
  await requirePermission("roles.view");

  const normalized = normalizeRoleSlug(idOrSlug);

  const whereClauses: any[] = [{ slug: normalized }, { slug: idOrSlug }];
  if (isValidObjectId(idOrSlug)) {
    whereClauses.push({ id: idOrSlug });
  }

  // Check DB custom or overridden role first
  const dbRole = await prisma.role.findFirst({
    where: { OR: whereClauses },
  });

  if (dbRole) {
    return {
      id: dbRole.id,
      name: dbRole.name,
      slug: dbRole.slug,
      description: dbRole.description || "",
      isSystemRole: dbRole.isSystemRole || SYSTEM_ROLES[dbRole.slug] !== undefined,
      status: dbRole.status,
      permissions: dbRole.permissions,
    };
  }

  // Fallback to predefined system role
  if (SYSTEM_ROLES[normalized]) {
    const sys = SYSTEM_ROLES[normalized];
    return {
      id: sys.slug,
      name: sys.name,
      slug: sys.slug,
      description: sys.description,
      isSystemRole: true,
      status: true,
      permissions: sys.permissions.includes("*") ? PERMISSION_REGISTRY.map((p) => p.key) : sys.permissions,
    };
  }

  return null;
}

/**
 * Create a new custom role.
 */
export async function createRoleAction(input: RoleDataInput) {
  const { user } = await requirePermission("roles.manage");

  if (!input.name || !input.name.trim()) {
    return { success: false, error: "Role name is required." };
  }

  const slug = input.slug && input.slug.trim() ? slugify(input.slug) : slugify(input.name);

  if (!slug) {
    return { success: false, error: "Invalid role slug." };
  }

  // Check reserved system role slugs
  if (SYSTEM_ROLES[slug]) {
    return { success: false, error: `The role slug "${slug}" is reserved for system roles.` };
  }

  // Check duplicate slug in DB
  const existing = await prisma.role.findUnique({ where: { slug } });
  if (existing) {
    return { success: false, error: `A role with slug "${slug}" already exists.` };
  }

  // Validate permission keys
  const validKeys = new Set(PERMISSION_REGISTRY.map((p) => p.key));
  validKeys.add("*");
  const filteredPermissions = input.permissions.filter((p) => validKeys.has(p));

  const role = await prisma.role.create({
    data: {
      name: input.name.trim(),
      slug,
      description: input.description?.trim() || null,
      permissions: filteredPermissions,
      isSystemRole: false,
      status: true,
      createdBy: user.id,
    },
  });

  await logAdminAction({
    action: "ROLE_CREATED",
    targetType: "ROLE",
    targetId: role.id,
    metadata: {
      roleName: role.name,
      slug: role.slug,
      permissionCount: role.permissions.length,
    },
  });

  revalidatePath("/admin/roles");
  return { success: true, roleId: role.id };
}

/**
 * Update an existing role (custom or system role override).
 */
export async function updateRoleAction(idOrSlug: string, input: RoleDataInput) {
  const { user } = await requirePermission("roles.manage");

  const normalized = normalizeRoleSlug(idOrSlug);

  if (normalized === "super_admin" || idOrSlug === "super_admin") {
    return { success: false, error: "Super Admin permissions are fixed to wildcard (*)." };
  }

  // Validate permission keys
  const validKeys = new Set(PERMISSION_REGISTRY.map((p) => p.key));
  validKeys.add("*");
  const filteredPermissions = input.permissions.filter((p) => validKeys.has(p));

  const whereClauses: any[] = [{ slug: normalized }, { slug: idOrSlug }];
  if (isValidObjectId(idOrSlug)) {
    whereClauses.push({ id: idOrSlug });
  }

  // Find by ID or slug in DB
  let dbRole = await prisma.role.findFirst({
    where: { OR: whereClauses },
  });

  if (dbRole) {
    await prisma.role.update({
      where: { id: dbRole.id },
      data: {
        name: input.name.trim(),
        description: input.description?.trim() || null,
        permissions: filteredPermissions,
        updatedAt: new Date(),
      },
    });
  } else if (SYSTEM_ROLES[normalized]) {
    // Upsert system role override into DB
    const sys = SYSTEM_ROLES[normalized];
    dbRole = await prisma.role.create({
      data: {
        name: sys.name,
        slug: sys.slug,
        description: input.description?.trim() || sys.description,
        permissions: filteredPermissions,
        isSystemRole: true,
        status: true,
        createdBy: user.id,
      },
    });
  } else {
    return { success: false, error: "Role not found." };
  }

  await logAdminAction({
    action: "ROLE_UPDATED",
    targetType: "ROLE",
    targetId: dbRole.id,
    metadata: {
      roleName: input.name.trim(),
      permissionCount: filteredPermissions.length,
    },
  });

  revalidatePath("/admin/roles");
  revalidatePath(`/admin/roles/${idOrSlug}`);
  revalidatePath(`/admin/roles/${dbRole.id}`);
  return { success: true };
}

/**
 * Duplicate a role.
 */
export async function duplicateRoleAction(idOrSlug: string) {
  const { user } = await requirePermission("roles.manage");

  const source = await getRoleByIdAction(idOrSlug);
  if (!source) {
    return { success: false, error: "Source role not found." };
  }

  const newName = `Copy of ${source.name}`;
  let baseSlug = slugify(newName);
  let finalSlug = baseSlug;
  let counter = 1;

  while ((await prisma.role.findUnique({ where: { slug: finalSlug } })) || SYSTEM_ROLES[finalSlug]) {
    finalSlug = `${baseSlug}_${counter}`;
    counter++;
  }

  const role = await prisma.role.create({
    data: {
      name: newName,
      slug: finalSlug,
      description: `Duplicated from ${source.name}`,
      permissions: source.permissions,
      isSystemRole: false,
      status: true,
      createdBy: user.id,
    },
  });

  await logAdminAction({
    action: "ROLE_CREATED",
    targetType: "ROLE",
    targetId: role.id,
    metadata: {
      action: "ROLE_DUPLICATED",
      sourceSlug: source.slug,
      newSlug: role.slug,
    },
  });

  revalidatePath("/admin/roles");
  return { success: true, roleId: role.id };
}

/**
 * Delete a custom role.
 */
export async function deleteRoleAction(id: string) {
  await requirePermission("roles.manage");

  const whereClauses: any[] = [{ slug: id }];
  if (isValidObjectId(id)) {
    whereClauses.push({ id });
  }

  const existing = await prisma.role.findFirst({
    where: { OR: whereClauses },
  });

  if (!existing) {
    return { success: false, error: "Role not found." };
  }

  if (existing.isSystemRole) {
    return { success: false, error: "System roles cannot be deleted." };
  }

  // Check if any user is currently assigned to this custom role
  const usersWithRole = await prisma.user.count({
    where: {
      OR: [{ role: existing.slug }, { customRoles: { has: existing.slug } }],
    },
  });

  if (usersWithRole > 0) {
    return {
      success: false,
      error: `Cannot delete role "${existing.name}". It is currently assigned to ${usersWithRole} user(s). Please reassign users before deleting.`,
    };
  }

  await prisma.role.delete({ where: { id: existing.id } });

  await logAdminAction({
    action: "ROLE_DELETED",
    targetType: "ROLE",
    targetId: existing.id,
    metadata: {
      roleName: existing.name,
      slug: existing.slug,
    },
  });

  revalidatePath("/admin/roles");
  return { success: true };
}
