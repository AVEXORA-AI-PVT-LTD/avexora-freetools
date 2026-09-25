import { requireAdminAuth } from "@/server/admin-auth";
import { prisma } from "@/server/db";
import { RestoreProtectionClient } from "./RestoreProtectionClient";

export const metadata = {
  title: "Database Restore — Avex Tools Admin",
  description: "Protected database restore wizard with safety backup creation and audit tracking.",
};

export default async function RestorePage() {
  await requireAdminAuth("maintenance.restore");

  const completedBackups = await prisma.backup.findMany({
    where: { status: "Completed" },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return <RestoreProtectionClient backups={completedBackups as any} />;
}
