"use server";
import { requireAdminAuth } from "@/server/admin-auth";
import { prisma } from "@/server/db";
import { revalidateTag } from "next/cache";

export async function updateRobotsTxt(content: string) {
  const user = await requireAdminAuth("seo.edit");
  
  await prisma.contentBlock.upsert({
    where: { key: "robots_txt" },
    create: { key: "robots_txt", value: content, type: "TEXT" },
    update: { value: content }
  });

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      actorRole: user.role || "unknown",
      action: "ROBOTS_TXT_UPDATED",
      targetType: "SEO",
      targetId: "robots_txt",
      metadata: { content }
    }
  });
  
  revalidateTag("seo-robots", "max");
}

export async function resetRobotsTxt() {
  const user = await requireAdminAuth("seo.edit");
  await prisma.contentBlock.deleteMany({ where: { key: "robots_txt" } });
  revalidateTag("seo-robots", "max");
}
