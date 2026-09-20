"use server";

import { requireAdminAuth } from "@/server/admin-auth";
import { prisma } from "@/server/db";
import { revalidatePath } from "next/cache";
import { hasPermission } from "@/lib/admin/permissions";
import { HomepageSection, SectionKey } from "@/server/homepage-service";

export async function saveHomepageSection(section: HomepageSection) {
  const user = await requireAdminAuth();
  if (!hasPermission(user.role, "homepage.edit")) throw new Error("Unauthorized");

  const upsertData = {
    sectionKey: section.sectionKey,
    enabled: section.enabled,
    sortOrder: section.sortOrder,
    heading: section.heading,
    description: section.description,
    config: section.config,
    updatedBy: user.id
  };

  await prisma.homepageConfig.upsert({
    where: { sectionKey: section.sectionKey },
    create: { ...upsertData, createdBy: user.id },
    update: upsertData
  });

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      actorRole: user.role || "unknown",
      action: "HOMEPAGE_UPDATED",
      targetType: "HOMEPAGE",
      targetId: section.sectionKey
    }
  });

  revalidatePath("/");
  return { success: true };
}

export async function reorderHomepageSections(orderedKeys: SectionKey[]) {
  const user = await requireAdminAuth();
  if (!hasPermission(user.role, "homepage.reorder")) throw new Error("Unauthorized");

  const ops = orderedKeys.map((key, idx) => 
    prisma.homepageConfig.upsert({
      where: { sectionKey: key },
      create: {
        sectionKey: key,
        sortOrder: idx,
        createdBy: user.id
      },
      update: {
        sortOrder: idx,
        updatedBy: user.id
      }
    })
  );

  await prisma.$transaction(ops);

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      actorRole: user.role || "unknown",
      action: "HOMEPAGE_SECTION_REORDERED",
      targetType: "HOMEPAGE",
      targetId: "all"
    }
  });

  revalidatePath("/");
  return { success: true };
}
