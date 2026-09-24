"use server";

import { requireAdminAuth } from "@/server/admin-auth";
import { prisma } from "@/server/db";
import { SeoMetadataSchema, SeoMetadata } from "@/server/seo-manager";
import { revalidatePath, revalidateTag } from "next/cache";
import type { Prisma } from "@prisma/client";

export async function updateToolSeo(toolSlug: string, categorySlug: string, data: Partial<SeoMetadata>) {
  await requireAdminAuth("seo.edit");

  const validated = SeoMetadataSchema.partial().parse(data);

  // Merge into any existing override so unrelated SEO fields are never wiped.
  const existing = await prisma.toolConfig.findUnique({
    where: { toolSlug },
    select: { seoMetadata: true },
  });
  const merged = { ...((existing?.seoMetadata as object) ?? {}), ...(validated as object) };

  await prisma.toolConfig.upsert({
    where: { toolSlug },
    create: {
      toolSlug,
      categorySlug,
      seoMetadata: merged as Prisma.InputJsonObject,
    },
    update: {
      seoMetadata: merged as Prisma.InputJsonObject,
    }
  });

  revalidateTag("seo-tool", "max");
  revalidatePath("/", "layout");
}

export async function resetToolSeo(toolSlug: string, categorySlug: string) {
  await requireAdminAuth("seo.edit");

  await prisma.toolConfig.updateMany({
    where: { toolSlug },
    data: { seoMetadata: null }
  });

  revalidateTag("seo-tool", "max");
  revalidatePath("/", "layout");
}

export async function updateCategorySeo(categorySlug: string, data: Partial<SeoMetadata>) {
  await requireAdminAuth("seo.edit");

  const validated = SeoMetadataSchema.partial().parse(data);

  const existing = await prisma.categoryConfig.findUnique({
    where: { slug: categorySlug },
    select: { seoMetadata: true },
  });
  const merged = { ...((existing?.seoMetadata as object) ?? {}), ...(validated as object) };

  await prisma.categoryConfig.upsert({
    where: { slug: categorySlug },
    create: {
      slug: categorySlug,
      seoMetadata: merged as Prisma.InputJsonObject,
    },
    update: {
      seoMetadata: merged as Prisma.InputJsonObject,
    }
  });

  revalidateTag("seo-category", "max");
  revalidatePath("/", "layout");
}

export async function resetCategorySeo(categorySlug: string) {
  await requireAdminAuth("seo.edit");

  await prisma.categoryConfig.update({
    where: { slug: categorySlug },
    data: { seoMetadata: null }
  });

  revalidateTag("seo-category", "max");
  revalidatePath("/", "layout");
}

export async function updateGlobalSeo(data: Partial<SeoMetadata>) {
  await requireAdminAuth("seo.edit");

  const validated = SeoMetadataSchema.partial().parse(data);

  const existing = await prisma.contentBlock.findUnique({
    where: { key: "global_seo" },
  });
  const existingParsed = existing?.value ? (JSON.parse(existing.value) as object) : {};
  const merged = { ...existingParsed, ...(validated as object) };

  await prisma.contentBlock.upsert({
    where: { key: "global_seo" },
    create: {
      key: "global_seo",
      value: JSON.stringify(merged),
      type: "JSON",
    },
    update: {
      value: JSON.stringify(merged),
    }
  });

  revalidateTag("seo-global", "max");
  revalidatePath("/", "layout"); // Revalidate everything
}

export async function resetGlobalSeo() {
  await requireAdminAuth("seo.edit");

  await prisma.contentBlock.deleteMany({
    where: { key: "global_seo" },
  });

  revalidateTag("seo-global", "max");
  revalidatePath("/", "layout");
}