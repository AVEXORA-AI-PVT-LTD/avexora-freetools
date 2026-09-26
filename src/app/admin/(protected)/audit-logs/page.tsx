import { requireAdminAuth } from "@/server/admin-auth";
import { getAuditLogsAction } from "./audit-actions";
import { AuditLogsClient } from "./AuditLogsClient";

export const metadata = {
  title: "Audit Logs | Avex Tools Admin",
  description: "View and filter security, administrative, tool, and user audit logs.",
};

export default async function AuditLogsPage() {
  await requireAdminAuth("audit.view");

  const initialData = await getAuditLogsAction({
    page: 1,
    limit: 20,
    sortOrder: "desc",
  });

  return <AuditLogsClient initialData={initialData} />;
}
