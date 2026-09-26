import { auth } from "@/server/auth";
import { hasPermission } from "@/lib/admin/permissions";
import { redirect, notFound } from "next/navigation";
import { getRoleByIdAction } from "../roles-actions";
import { RoleFormClient } from "../RoleFormClient";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditRolePage({ params }: PageProps) {
  const session = await auth();

  if (!session || !hasPermission(session.user?.role, "roles.manage")) {
    redirect("/admin/roles");
  }

  const { id } = await params;
  const role = await getRoleByIdAction(id);

  if (!role) {
    notFound();
  }

  return <RoleFormClient initialRole={role} />;
}
