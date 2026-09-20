export type Role = "user" | "editor" | "admin" | "superadmin";

export const ROLE_HIERARCHY: Record<Role, number> = {
  superadmin: 100,
  admin: 50,
  editor: 20,
  user: 0,
};

export type Permission = 
  | "categories.view"
  | "categories.create"
  | "categories.edit"
  | "categories.delete"
  | "categories.reorder"
  | "categories.merge"
  | "categories.publish"

  | "dashboard.view"
  | "content.view"
  | "content.create"
  | "content.edit"
  | "content.review"
  | "content.publish"
  | "content.schedule"
  | "content.archive"
  | "content.delete"
  | "content.restore"
  | "content.manage_seo"

  | "homepage.view"
  | "homepage.edit"
  | "homepage.publish"
  | "homepage.reorder"
  | "homepage.manage-tools"
  | "homepage.manage-footer"

  | "categories.view"
  | "categories.create"
  | "categories.edit"
  | "categories.delete"
  | "categories.toggle"
  | "tools.view"
  | "tools.create"
  | "tools.edit"
  | "tools.delete"
  | "tools.toggle"
  | "tools.reorder"
  | "tools.version.read"
  | "tools.version.create"
  | "tools.version.compare"
  | "tools.version.restore"
  | "tools.version.publish"
  | "tools.version.delete"
  | "users.view"
  | "users.edit"
  | "users.delete"
  | "users.change_role"

  | "users.manage_roles"
  | "users.revoke_sessions"
  | "users.view_activity"
  | "users.view_usage"
  | "users.view_subscription"
  | "users.change_plan"

  | "roles.view"
  | "roles.manage"
  | "brand_studio.view"
  | "brand_studio.edit"
  | "brand_studio.toggle"
  | "homepage.view"
  | "homepage.edit"
  | "navigation.view"
  | "navigation.edit"
  | "seo.view"
  | "seo.edit"
  | "settings.view"
  | "settings.edit"
  | "analytics.view"
  | "audit_logs.view"
  | "content.view"
  | "content.edit";

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  superadmin: [
    "dashboard.view", "categories.view", "categories.create", "categories.edit", 
    "categories.delete", "categories.toggle", "tools.view", "tools.create", 
    "tools.edit", "tools.delete", "tools.toggle", "tools.reorder", "tools.version.read",
    "tools.version.create", "tools.version.compare", "tools.version.restore",
    "tools.version.publish", "tools.version.delete", "users.view", 
    "users.edit", "users.delete", "users.change_role", "users.manage_roles", "users.revoke_sessions", "users.view_activity", "users.view_usage", "users.view_subscription", "users.change_plan", "roles.view", "roles.manage", 
    "brand_studio.view", "brand_studio.edit", "brand_studio.toggle", "homepage.view", 
    "homepage.edit", "navigation.view", "navigation.edit", "seo.view", "seo.edit", 
    "settings.view", "settings.edit", "analytics.view", "audit_logs.view", "content.view", "content.edit"
  ],
  admin: [
    "dashboard.view", "categories.view", "categories.edit", "categories.toggle", 
    "tools.view", "tools.edit", "tools.toggle", "tools.reorder", "tools.version.read",
    "tools.version.create", "tools.version.compare", "tools.version.restore",
    "users.view", 
    "users.edit", "brand_studio.view", "brand_studio.edit", "homepage.view", 
    "homepage.edit", "navigation.view", "navigation.edit", "seo.view", "seo.edit", 
    "analytics.view", "content.view", "content.edit"
  ],
  editor: [
    "dashboard.view", "categories.view", "categories.edit", "tools.view", 
    "tools.edit", "tools.reorder", "homepage.view", "seo.view", "seo.edit", "content.view", "content.edit"
  ],
  user: []
};

export function hasPermission(userRole: string | null | undefined, permission: Permission): boolean {
  if (!userRole) return false;
  const role = userRole.toLowerCase().replace('_', '') as Role;
  if (!ROLE_PERMISSIONS[role]) return false;
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function isHigherOrEqualRole(actorRole: string | null | undefined, targetRole: string | null | undefined): boolean {
  if (!actorRole) return false;
  const actorLevel = ROLE_HIERARCHY[actorRole.toLowerCase().replace('_', '') as Role] || 0;
  const targetLevel = targetRole ? (ROLE_HIERARCHY[targetRole.toLowerCase().replace('_', '') as Role] || 0) : 0;
  return actorLevel >= targetLevel;
}
