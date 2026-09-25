import { requireAdminAuth } from "@/server/admin-auth";
import { prisma } from "@/server/db";
import { BackupHistoryClient } from "./BackupHistoryClient";

export const metadata = {
  title: "Backup History — Avex Tools Admin",
  description: "View and manage database backup snapshots and checksum verification.",
};

export default async function BackupHistoryPage() {
  await requireAdminAuth("maintenance.backup.view");

  const backups = await prisma.backup.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return <BackupHistoryClient initialBackups={backups as any} />;
}
