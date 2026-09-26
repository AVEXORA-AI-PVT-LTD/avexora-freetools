import { auth } from "@/server/auth";
import { hasPermission } from "@/lib/admin/permissions";
import { redirect } from "next/navigation";
import { RoleFormClient } from "../RoleFormClient";

export default async function NewRolePage() {
  const session = await auth();

  if (!session || !hasPermission(session.user?.role, "roles.manage")) {
    redirect("/admin/roles");
  }

  return <RoleFormClient />;
}
