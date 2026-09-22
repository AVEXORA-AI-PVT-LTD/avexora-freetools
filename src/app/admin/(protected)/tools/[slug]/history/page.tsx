import { requireAdminAuth } from "@/server/admin-auth";
import { prisma } from "@/server/db";
import { redirect } from "next/navigation";
import { RevisionHistoryClient } from "./RevisionHistoryClient";

export const metadata = {
  title: "Revision History | Avex Tools Admin",
};

export default async function RevisionHistoryPage({ params }: { params: { slug: string } }) {
  await requireAdminAuth("tools.version.read");

  const toolConfig = await prisma.toolConfig.findUnique({
    where: { toolSlug: params.slug },
  });

  if (!toolConfig) {
    redirect("/admin/tools");
  }

  const revisions = await prisma.toolRevision.findMany({
    where: { toolSlug: params.slug },
    orderBy: { createdAt: "desc" },

  });

  // Fetch users for display
  const userIds = [...new Set(revisions.map(r => r.createdBy).filter(Boolean) as string[])];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true }
  });
  
  const userMap = new Map(users.map(u => [u.id, u.name || u.email]));

  const mappedRevisions = revisions.map(r => ({
    id: r.id,
    version: r.version,
    changelog: r.changelog,
    revisionType: r.revisionType,
    isPublished: r.isPublished,
    createdAt: r.createdAt.toISOString(),
    createdByName: r.createdBy ? userMap.get(r.createdBy) || "Unknown" : "System",
    snapshot: r.snapshot,
  }));

  return (
    <RevisionHistoryClient 
      toolName={toolConfig.nameOverride || params.slug}
      toolSlug={params.slug}
      currentVersion={toolConfig.currentVersion}
      revisions={mappedRevisions} 
    />
  );
}
