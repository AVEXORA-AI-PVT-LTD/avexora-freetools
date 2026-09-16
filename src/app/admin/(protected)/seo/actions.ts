"use server";

import { requireAdminAuth } from "@/server/admin-auth";
import { prisma } from "@/server/db";
import { SeoMetadataSchema, SeoMetadata } from "@/server/seo-manager";
import { revalidatePath, revalidateTag } from "next/cache";

export async function updateToolSeo(toolSlug: string, categorySlug: string, data: Partial<SeoMetadata>) {
  await requireAdminAuth("seo.edit");

  const validated = SeoMetadataSchema.partial().parse(data);

  await prisma.toolConfig.upsert({
    where: { toolSlug },
    create: {
      toolSlug,
      categorySlug,
      seoMetadata: validated as any,
    },
    update: {
      seoMetadata: validated as any,
    }
  });

    revalidatePath("/", "layout");
}

export async function resetToolSeo(toolSlug: string, categorySlug: string) {
  await requireAdminAuth("seo.edit");

  await prisma.toolConfig.updateMany({
    where: { toolSlug },
    data: { seoMetadata: null as any }
  });

    revalidatePath("/", "layout");
}

export async function updateCategorySeo(categorySlug: string, data: Partial<SeoMetadata>) {
  await requireAdminAuth("seo.edit");

  const validated = SeoMetadataSchema.partial().parse(data);

  await prisma.categoryConfig.upsert({
    where: { slug: categorySlug },
    create: {
      slug: categorySlug,
      seoMetadata: validated as any,
    },
    update: {
      seoMetadata: validated as any,
    }
  });

    revalidatePath("/", "layout");
}

export async function resetCategorySeo(categorySlug: string) {
  await requireAdminAuth("seo.edit");

  await prisma.categoryConfig.update({
    where: { slug: categorySlug },
    data: { seoMetadata: null as any }
  });

    revalidatePath("/", "layout");
}

export async function updateGlobalSeo(data: Partial<SeoMetadata>) {
  await requireAdminAuth("seo.edit");

  const validated = SeoMetadataSchema.partial().parse(data);

  await prisma.contentBlock.upsert({
    where: { key: "global_seo" },
    create: {
      key: "global_seo",
      value: JSON.stringify(validated),
      type: "JSON",
    },
    update: {
      value: JSON.stringify(validated),
    }
  });

    revalidatePath("/", "layout"); // Revalidate everything
}

export async function resetGlobalSeo() {
  await requireAdminAuth("seo.edit");

  await prisma.contentBlock.deleteMany({
    where: { key: "global_seo" },
  });

    revalidatePath("/", "layout");
}
