"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/server/db";
import { requireAdminAuth } from "@/server/admin-auth";
import { z } from "zod";
import { NavLocation } from "@/server/navigation";

const safeHref = (href: string) => {
  const h = href.trim();
  const lower = h.toLowerCase();
  if (lower.startsWith("javascript:")) return false;
  if (lower.startsWith("data:")) return false;
  if (lower.startsWith("vbscript:")) return false;
  if (lower.startsWith("file:")) return false;
  if (lower.startsWith("//")) return false; // protocol relative
  return true;
};

const navigationSchema = z.object({
  id: z.string().optional(),
  label: z.string().min(1, "Label is required").max(60, "Label is too long"),
  href: z.string().min(1, "URL is required").refine(safeHref, "Unsafe URL detected"),
  location: z.enum(["HEADER", "FOOTER"]),
  type: z.enum(["INTERNAL", "EXTERNAL", "CUSTOM"]),
  openInNewTab: z.boolean().default(false),
});

export async function createNavigationLink(data: z.infer<typeof navigationSchema>) {
  await requireAdminAuth("navigation.edit");

  const validated = navigationSchema.parse(data);

  // find max display order
  const max = await prisma.navigationLink.findFirst({
    where: { location: validated.location },
    orderBy: { displayOrder: "desc" },
  });
  const newOrder = max ? max.displayOrder + 1 : 0;

  await prisma.navigationLink.create({
    data: {
      label: validated.label,
      href: validated.href,
      location: validated.location,
      type: validated.type,
      openInNewTab: validated.openInNewTab,
      displayOrder: newOrder,
    },
  });

  revalidatePath("/", "layout");
}

export async function updateNavigationLink(id: string, data: z.infer<typeof navigationSchema>) {
  await requireAdminAuth("navigation.edit");
  const validated = navigationSchema.parse(data);

  await prisma.navigationLink.update({
    where: { id },
    data: {
      label: validated.label,
      href: validated.href,
      location: validated.location,
      type: validated.type,
      openInNewTab: validated.openInNewTab,
    },
  });

  revalidatePath("/", "layout");
}

export async function toggleNavigationLink(id: string, status: boolean) {
  await requireAdminAuth("navigation.edit");

  await prisma.navigationLink.update({
    where: { id },
    data: { status },
  });

  revalidatePath("/", "layout");
}

export async function deleteNavigationLink(id: string) {
  await requireAdminAuth("navigation.edit");

  await prisma.navigationLink.delete({
    where: { id },
  });

  revalidatePath("/", "layout");
}

export async function reorderNavigationLinks(orderedIds: string[], location: string) {
  await requireAdminAuth("navigation.edit");

  // Bulk update inside a transaction
  const updates = orderedIds.map((id, index) =>
    prisma.navigationLink.update({
      where: { id },
      data: { displayOrder: index },
    })
  );

  await prisma.$transaction(updates);
  revalidatePath("/", "layout");
}
