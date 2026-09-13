import { auth } from "@/server/auth";
import { Permission, hasPermission, ROLE_HIERARCHY, Role } from "@/lib/admin/permissions";
import { redirect } from "next/navigation";

export async function requireAdminAuth(permission?: Permission) {
  const session = await auth();
  
  if (!session || !session.user) {
    redirect("/studio/signin?next=/");
  }

  const rawRole = session.user.role as string | undefined;
  const role = rawRole ? rawRole.toLowerCase().replace('_', '') as Role : undefined;
  
  // Must be at least editor to enter the admin panel
  if (!role || (ROLE_HIERARCHY[role] || 0) < ROLE_HIERARCHY["editor"]) {
    redirect("/admin/unauthorized");
  }

  if (permission && !hasPermission(role, permission)) {
    redirect("/admin/unauthorized");
  }

  return session.user;
}

export async function checkAdminPermission(permission: Permission) {
  const session = await auth();
  if (!session || !session.user) return false;
  return hasPermission(session.user.role, permission);
}
