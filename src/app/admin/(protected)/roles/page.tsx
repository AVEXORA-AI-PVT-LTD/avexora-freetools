import { auth } from "@/server/auth";
import { hasPermission } from "@/lib/admin/permissions";
import { redirect } from "next/navigation";
import { getRolesAction } from "./roles-actions";
import { RolesClient } from "./RolesClient";

export default async function RolesPage() {
  const session = await auth();

  if (!session || !hasPermission(session.user?.role, "roles.view")) {
    redirect("/admin");
  }

  const data = await getRolesAction();

  return <RolesClient initialData={data} />;
}
