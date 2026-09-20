"use server";
import { requireAdminAuth } from "@/server/admin-auth";
import { prisma } from "@/server/db";
import { revalidateTag } from "next/cache";

export async function createRedirect(data: { source: string, destination: string, statusCode: number, reason?: string }) {
  const user = await requireAdminAuth("seo.edit");
  if (!data.source.startsWith("/")) throw new Error("Source must start with /");
  if (data.source === data.destination) throw new Error("Cannot redirect to self");
  
  const existing = await prisma.redirect.findUnique({ where: { source: data.source } });
  if (existing) throw new Error("A redirect for this source already exists.");

  const created = await prisma.redirect.create({
    data: {
      ...data,
      createdBy: user.id
    }
  });

  revalidateTag('seo-redirects', 'max');
  return created;
}

export async function toggleRedirect(id: string, active: boolean) {
  await requireAdminAuth("seo.edit");
  const updated = await prisma.redirect.update({
    where: { id },
    data: { active }
  });
  revalidateTag('seo-redirects', 'max');
  return updated;
}

export async function deleteRedirect(id: string) {
  await requireAdminAuth("seo.edit");
  await prisma.redirect.delete({ where: { id } });
  revalidateTag('seo-redirects', 'max');
  return { success: true };
}
