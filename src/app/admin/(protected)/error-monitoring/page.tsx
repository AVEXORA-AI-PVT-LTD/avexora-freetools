import { auth } from "@/server/auth";
import { hasPermission } from "@/lib/admin/permissions";
import { redirect } from "next/navigation";
import { getErrorLogsAction } from "./error-actions";
import { ErrorMonitoringClient } from "./ErrorMonitoringClient";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    search?: string;
    errorType?: string;
    severity?: string;
    status?: string;
    environment?: string;
    toolSlug?: string;
    sortBy?: string;
    sortOrder?: string;
  }>;
}

export default async function ErrorMonitoringPage({ searchParams }: PageProps) {
  const session = await auth();

  if (!session || !hasPermission(session.user?.role, "errors.view")) {
    redirect("/admin");
  }

  const resolvedSearchParams = await searchParams;

  const data = await getErrorLogsAction({
    page: Number(resolvedSearchParams.page) || 1,
    limit: Number(resolvedSearchParams.limit) || 20,
    search: resolvedSearchParams.search,
    errorType: resolvedSearchParams.errorType,
    severity: resolvedSearchParams.severity,
    status: resolvedSearchParams.status,
    environment: resolvedSearchParams.environment,
    toolSlug: resolvedSearchParams.toolSlug,
    sortBy: resolvedSearchParams.sortBy,
    sortOrder: (resolvedSearchParams.sortOrder as any) || "desc",
  });

  return <ErrorMonitoringClient initialData={data} searchParams={resolvedSearchParams} />;
}
