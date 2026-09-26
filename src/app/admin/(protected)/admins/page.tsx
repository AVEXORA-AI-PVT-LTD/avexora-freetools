import { auth } from "@/server/auth";
import { hasPermission } from "@/lib/admin/permissions";
import { redirect } from "next/navigation";
import { getAdministratorsAction } from "./admins-actions";
import { AdminsClient } from "./AdminsClient";

export default async function AdminsPage() {
  const session = await auth();

  if (!session || !hasPermission(session.user?.role, "admins.view")) {
    redirect("/admin");
  }

  const data = await getAdministratorsAction();

  return <AdminsClient initialData={data} />;
}
