import { auth } from "@/server/auth";
import { hasPermission } from "@/lib/admin/permissions";
import { redirect, notFound } from "next/navigation";
import { getErrorByIdAction } from "../error-actions";
import { ErrorDetailClient } from "./ErrorDetailClient";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ErrorDetailPage({ params }: PageProps) {
  const session = await auth();

  if (!session || !hasPermission(session.user?.role, "errors.view")) {
    redirect("/admin");
  }

  const { id } = await params;
  const data = await getErrorByIdAction(id);

  if (!data) {
    notFound();
  }

  return <ErrorDetailClient data={data} />;
}
