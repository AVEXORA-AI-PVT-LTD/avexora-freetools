import { requireAdminAuth } from "@/server/admin-auth";
import { prisma } from "@/server/db";
import { ReindexManagementClient } from "./ReindexManagementClient";

export const metadata = {
  title: "Database Re-index — Avex Tools Admin",
  description: "Verify and rebuild database collection indexes.",
};

export default async function ReindexPage() {
  await requireAdminAuth("maintenance.reindex");

  const [tools, categories, users, content, auditLogs, errorLogs] = await Promise.all([
    prisma.toolConfig.count(),
    prisma.categoryConfig.count(),
    prisma.user.count(),
    prisma.contentItem.count(),
    prisma.auditLog.count(),
    prisma.errorLog.count(),
  ]);

  const initialCounts = {
    tools,
    categories,
    users,
    content,
    auditLogs,
    errorLogs,
  };

  return <ReindexManagementClient initialCounts={initialCounts} />;
}
