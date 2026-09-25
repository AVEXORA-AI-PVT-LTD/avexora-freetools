export type SystemRole = "super_admin" | "admin" | "content_manager" | "support" | "finance" | "user";

export type LegacyRole = "superadmin" | "editor";
export type RoleSlug = SystemRole | LegacyRole | string;
export type Role = RoleSlug;

export const ROLE_HIERARCHY: Record<string, number> = {
  super_admin: 100,
  superadmin: 100,
  admin: 50,
  content_manager: 30,
  editor: 30,
  support: 20,
  finance: 20,
  user: 0,
};

export interface PermissionDefinition {
  key: string;
  name: string;
  description: string;
  category: PermissionCategory;
}

export type PermissionCategory =
  | "Dashboard"
  | "Tools"
  | "Categories"
  | "Content"
  | "SEO"
  | "Users"
  | "Subscriptions"
  | "Payments"
  | "Ads"
  | "Media"
  | "Feedback"
  | "Errors"
  | "Administrators"
  | "Roles"
  | "Audit Logs"
  | "Settings"
  | "Backup"
  | "Reports";

export const PERMISSION_REGISTRY: PermissionDefinition[] = [
  // Dashboard
  { key: "dashboard.view", name: "View Dashboard", description: "Access main admin overview & KPIs", category: "Dashboard" },

  // Tools
  { key: "tools.view", name: "View Tools", description: "View tools directory and tool configurations", category: "Tools" },
  { key: "tools.create", name: "Create Tools", description: "Add new tools to system", category: "Tools" },
  { key: "tools.edit", name: "Edit Tools", description: "Update tool metadata and settings", category: "Tools" },
  { key: "tools.delete", name: "Delete Tools", description: "Remove tools from registry", category: "Tools" },
  { key: "tools.publish", name: "Publish Tools", description: "Publish or unpublish tools", category: "Tools" },
  { key: "tools.manage_settings", name: "Manage Tool Runtime Settings", description: "Configure tool runtime execution parameters", category: "Tools" },

  // Categories
  { key: "categories.view", name: "View Categories", description: "View category structures", category: "Categories" },
  { key: "categories.create", name: "Create Categories", description: "Add new tool categories", category: "Categories" },
  { key: "categories.edit", name: "Edit Categories", description: "Update category details", category: "Categories" },
  { key: "categories.delete", name: "Delete Categories", description: "Remove tool categories", category: "Categories" },

  // Content
  { key: "content.view", name: "View Content", description: "Access Pages, Blog, FAQs, and Guides", category: "Content" },
  { key: "content.create", name: "Create Content", description: "Draft new content items", category: "Content" },
  { key: "content.edit", name: "Edit Content", description: "Modify existing content items", category: "Content" },
  { key: "content.publish", name: "Publish Content", description: "Publish or unpublish content items", category: "Content" },
  { key: "content.delete", name: "Delete Content", description: "Remove content items", category: "Content" },

  // SEO
  { key: "seo.view", name: "View SEO Config", description: "View global meta tags, sitemaps, and robots", category: "SEO" },
  { key: "seo.edit", name: "Manage SEO", description: "Update meta tags, canonicals, and redirects", category: "SEO" },

  // Users
  { key: "users.view", name: "View Users", description: "View registered users and activity logs", category: "Users" },
  { key: "users.edit", name: "Edit Users", description: "Update user profile and account details", category: "Users" },
  { key: "users.block", name: "Block / Suspend Users", description: "Block or unblock user accounts", category: "Users" },
  { key: "users.delete", name: "Delete Users", description: "Hard delete user records", category: "Users" },

  // Subscriptions
  { key: "subscriptions.view", name: "View Subscriptions", description: "Access subscription dashboard and plans", category: "Subscriptions" },
  { key: "subscriptions.manage", name: "Manage Subscriptions", description: "Modify user plans, trials, and limits", category: "Subscriptions" },

  // Payments
  { key: "payments.view", name: "View Transactions", description: "Access payment histories and revenue reports", category: "Payments" },
  { key: "payments.refund", name: "Process Refunds", description: "Issue full or partial payment refunds", category: "Payments" },

  // Ads
  { key: "ads.view", name: "View Ad Placements", description: "Inspect ad slots and campaign performance", category: "Ads" },
  { key: "ads.manage", name: "Manage Ads & Promos", description: "Create, edit, and toggle ad units", category: "Ads" },

  // Media
  { key: "media.view", name: "View Media Library", description: "Browse central media assets and folders", category: "Media" },
  { key: "media.upload", name: "Upload Media Assets", description: "Upload images, icons, and documents", category: "Media" },
  { key: "media.delete", name: "Delete Media Assets", description: "Remove assets from storage", category: "Media" },

  // Feedback
  { key: "feedback.view", name: "View Submissions", description: "View contact form & feedback tickets", category: "Feedback" },
  { key: "feedback.manage", name: "Manage Tickets", description: "Assign, update status, and add internal notes", category: "Feedback" },

  // Errors
  { key: "errors.view", name: "View Error Diagnostics", description: "Inspect error logs, stack traces, and request IDs", category: "Errors" },
  { key: "errors.manage", name: "Manage Errors", description: "Assign, update status, and resolve errors", category: "Errors" },

  // Administrators
  { key: "admins.view", name: "View Administrators", description: "View admin list and assigned roles", category: "Administrators" },
  { key: "admins.create", name: "Provision Admins", description: "Invite or create new admin accounts", category: "Administrators" },
  { key: "admins.update", name: "Manage Admins", description: "Assign roles, toggle status, and revoke sessions", category: "Administrators" },
  { key: "admins.delete", name: "Delete Admins", description: "Remove administrator privileges", category: "Administrators" },

  // Roles
  { key: "roles.view", name: "View Roles", description: "Inspect system and custom RBAC roles", category: "Roles" },
  { key: "roles.manage", name: "Manage Roles & Permissions", description: "Create, edit, duplicate, and delete custom roles", category: "Roles" },

  // Audit Logs
  { key: "audit.view", name: "View Audit Logs", description: "Inspect complete security and administrative action logs", category: "Audit Logs" },

  // Settings
  { key: "settings.view", name: "View System Settings", description: "View general settings and configurations", category: "Settings" },
  { key: "settings.manage", name: "Manage System Settings", description: "Update system secrets, APIs, and security rules", category: "Settings" },

  // Backup
  { key: "backup.view", name: "View Maintenance & Backups", description: "Inspect system health and backup logs", category: "Backup" },
  { key: "backup.create", name: "Create Backups", description: "Generate new database & asset snapshots", category: "Backup" },
  { key: "backup.restore", name: "Restore Backups", description: "Execute system database restores", category: "Backup" },

  // Reports
  { key: "reports.view", name: "View Reports Dashboard", description: "Access reports dashboard and view history", category: "Reports" },
  { key: "reports.create", name: "Generate Reports", description: "Configure and generate report exports", category: "Reports" },
  { key: "reports.download", name: "Download Reports", description: "Download generated CSV, XLSX, and PDF reports", category: "Reports" },
  { key: "reports.delete", name: "Delete Reports", description: "Delete or expire report files and job history", category: "Reports" },
  { key: "reports.tools", name: "Tool Usage Reports", description: "Generate and view tool performance reports", category: "Reports" },
  { key: "reports.users", name: "User Activity Reports", description: "Generate and view user activity reports", category: "Reports" },
  { key: "reports.revenue", name: "Revenue Reports", description: "Generate and view financial revenue reports", category: "Reports" },
  { key: "reports.subscriptions", name: "Subscription Reports", description: "Generate and view subscription reports", category: "Reports" },
  { key: "reports.analytics", name: "Website Traffic Reports", description: "Generate and view website traffic reports", category: "Reports" },
  { key: "reports.seo", name: "SEO Health Reports", description: "Generate and view SEO metadata reports", category: "Reports" },
  { key: "reports.errors", name: "Error Diagnostic Reports", description: "Generate and view error diagnostic reports", category: "Reports" },
  { key: "reports.feedback", name: "Feedback Reports", description: "Generate and view user feedback reports", category: "Reports" },
];

export type Permission = string;

export interface SystemRoleDefinition {
  slug: SystemRole;
  name: string;
  description: string;
  isSystemRole: boolean;
  permissions: string[];
}

export const SYSTEM_ROLES: Record<string, SystemRoleDefinition> = {
  super_admin: {
    slug: "super_admin",
    name: "Super Admin",
    description: "Unrestricted administrative access to all modules, roles, settings, and security controls.",
    isSystemRole: true,
    permissions: ["*"],
  },
  admin: {
    slug: "admin",
    name: "Admin",
    description: "Operational administrator access for managing tools, content, users, analytics, and diagnostics.",
    isSystemRole: true,
    permissions: [
      "dashboard.view",
      "tools.view", "tools.create", "tools.edit", "tools.delete", "tools.publish", "tools.manage_settings",
      "categories.view", "categories.create", "categories.edit", "categories.delete",
      "content.view", "content.create", "content.edit", "content.publish", "content.delete",
      "seo.view", "seo.edit",
      "users.view", "users.edit", "users.block",
      "media.view", "media.upload", "media.delete",
      "feedback.view", "feedback.manage",
      "errors.view", "errors.manage",
      "audit.view",
      "ads.view", "ads.manage",
      "reports.view", "reports.create", "reports.download", "reports.delete", "reports.tools", "reports.users", "reports.analytics", "reports.seo", "reports.errors", "reports.feedback",
    ],
  },
  content_manager: {
    slug: "content_manager",
    name: "Content Manager",
    description: "Manages Homepage, Pages, Blog, FAQs, Guides, Media, and SEO content.",
    isSystemRole: true,
    permissions: [
      "dashboard.view",
      "content.view", "content.create", "content.edit", "content.publish", "content.delete",
      "seo.view", "seo.edit",
      "media.view", "media.upload",
      "tools.view",
      "categories.view",
      "reports.view", "reports.seo",
    ],
  },
  support: {
    slug: "support",
    name: "Support",
    description: "Handles user support, ticket resolution, user activity, and application diagnostics.",
    isSystemRole: true,
    permissions: [
      "dashboard.view",
      "users.view", "users.edit", "users.block",
      "feedback.view", "feedback.manage",
      "errors.view", "errors.manage",
      "audit.view",
      "reports.view", "reports.feedback", "reports.errors", "reports.users",
    ],
  },
  finance: {
    slug: "finance",
    name: "Finance",
    description: "Access to revenue metrics, subscription management, payment histories, and refunds.",
    isSystemRole: true,
    permissions: [
      "dashboard.view",
      "subscriptions.view", "subscriptions.manage",
      "payments.view", "payments.refund",
      "settings.view",
      "reports.view", "reports.create", "reports.download", "reports.revenue", "reports.subscriptions",
    ],
  },
};

// Aliases for legacy role names
const ROLE_ALIASES: Record<string, string> = {
  superadmin: "super_admin",
  editor: "content_manager",
};

/**
 * Normalizes role slug handling aliases (e.g. superadmin -> super_admin).
 */
export function normalizeRoleSlug(roleSlug: string | null | undefined): string {
  if (!roleSlug) return "user";
  const cleaned = roleSlug.trim().toLowerCase();
  return ROLE_ALIASES[cleaned] || cleaned;
}

/**
 * Returns effective permission array for a user's role(s) combining primary role & custom roles.
 */
export function getEffectivePermissions(
  userRole: string | string[] | null | undefined,
  customRolePermissionsMap?: Record<string, string[]>
): string[] {
  if (!userRole) return [];

  const roles = Array.isArray(userRole) ? userRole : [userRole];
  const permissionSet = new Set<string>();

  for (const rawRole of roles) {
    const roleSlug = normalizeRoleSlug(rawRole);

    // Super Admin check
    if (roleSlug === "super_admin") {
      return ["*"];
    }

    // Check custom roles from DB map first (allows customizing system roles in DB)
    if (customRolePermissionsMap && customRolePermissionsMap[roleSlug]) {
      const perms = customRolePermissionsMap[roleSlug];
      if (perms.includes("*")) return ["*"];
      perms.forEach((p) => permissionSet.add(p));
      continue;
    }

    // Fallback to default system roles
    const systemDef = SYSTEM_ROLES[roleSlug];
    if (systemDef) {
      if (systemDef.permissions.includes("*")) return ["*"];
      systemDef.permissions.forEach((p) => permissionSet.add(p));
    }
  }

  return Array.from(permissionSet);
}

/**
 * Checks if user has a specific permission.
 */
export function hasPermission(
  userRole: string | string[] | null | undefined,
  permission: string,
  customRolePermissionsMap?: Record<string, string[]>
): boolean {
  if (!userRole) return false;

  const roles = Array.isArray(userRole) ? userRole : [userRole];

  for (const rawRole of roles) {
    const roleSlug = normalizeRoleSlug(rawRole);
    if (roleSlug === "super_admin") return true;

    // Check DB custom/overridden roles first
    if (customRolePermissionsMap && customRolePermissionsMap[roleSlug]) {
      const perms = customRolePermissionsMap[roleSlug];
      if (perms.includes("*") || perms.includes(permission)) {
        return true;
      }
      continue;
    }

    // Fallback to default system role definitions
    const systemDef = SYSTEM_ROLES[roleSlug];
    if (systemDef) {
      if (systemDef.permissions.includes("*") || systemDef.permissions.includes(permission)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Checks hierarchy levels to prevent privilege escalation.
 */
export function isHigherOrEqualRole(actorRole: string | null | undefined, targetRole: string | null | undefined): boolean {
  if (!actorRole) return false;
  const actorLevel = ROLE_HIERARCHY[normalizeRoleSlug(actorRole)] || 0;
  const targetLevel = targetRole ? (ROLE_HIERARCHY[normalizeRoleSlug(targetRole)] || 0) : 0;
  return actorLevel >= targetLevel;
}
