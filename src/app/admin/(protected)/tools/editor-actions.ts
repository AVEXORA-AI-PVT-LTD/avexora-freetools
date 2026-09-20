"use server";

import { requireAdminAuth } from "@/server/admin-auth";
import { prisma } from "@/server/db";
import { revalidatePath } from "next/cache";
import { allTools } from "@/tools/registry";
import { hasPermission } from "@/lib/admin/permissions";
import type { ToolFormData } from "@/types/admin-tool-form";
import { z } from "zod";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must be lowercase and URL-safe"),
  category: z.string().min(1, "Category is required"),
  currentVersion: z.string().regex(/^\d+\.\d+\.\d+$/, "Version must be in format MAJOR.MINOR.PATCH (e.g. 1.0.0)").optional(),
  // Add more strict validation here... We will trust the types for now and do basic validation.
});

export async function saveToolData(data: ToolFormData) {
  const user = await requireAdminAuth();
  
  if (!hasPermission(user.role, "tools.create") && !hasPermission(user.role, "tools.edit")) {
    throw new Error("Unauthorized");
  }
  
  formSchema.parse(data);

  // Pack the data into JSON fields
  const content = {
    pageHeading: data.pageHeading,
    introduction: data.introduction,
    howToUse: data.howToUse,
    steps: data.steps,
    examples: data.examples,
    faqs: data.faqs,
    relatedTools: data.relatedTools,
    disclaimer: data.disclaimer,
    formula: data.formula,
  };

  const runtimeConfig = {
    loginRequired: data.loginRequired,
    dailyLimit: data.dailyLimit,
    monthlyLimit: data.monthlyLimit,
    rateLimit: data.rateLimit,
    fileUploadEnabled: data.fileUploadEnabled,
    maxUploadSizeMB: data.maxUploadSizeMB,
    allowedMimeTypes: data.allowedMimeTypes,
    allowedExtensions: data.allowedExtensions,
    apiRequired: data.apiRequired,
    maintenanceMode: data.maintenanceMode,
  };

  const technicalConfig = {
    route: data.route,
    internalServiceId: data.internalServiceId,
    apiEndpointId: data.apiEndpointId,
    version: data.version,
    executionTimeoutMs: data.executionTimeoutMs,
    maxConcurrentJobs: data.maxConcurrentJobs,
    featureFlags: data.featureFlags,
  };

  const publishingConfig = {
    publishDate: data.publishDate,
    unpublishDate: data.unpublishDate,
  };

  const seoMetadata = {
    title: data.seoTitle,
    description: data.metaDescription,
    focusKeyword: data.focusKeyword,
    secondaryKeywords: data.secondaryKeywords,
    canonicalUrl: data.canonicalUrl,
    ogTitle: data.ogTitle,
    ogDescription: data.ogDescription,
    ogImage: data.ogImage,
    schemaType: data.schemaType,
    index: data.index,
  };

  // Check if static tool
  const isStatic = allTools.some((t) => t.slug === data.slug);
  
  if (!isStatic) {
    // Upsert DynamicTool
    await prisma.dynamicTool.upsert({
      where: { slug: data.slug },
      create: {
        name: data.name,
        slug: data.slug,
        type: data.type,
        icon: data.icon,
        categorySlug: data.category,
      },
      update: {
        name: data.name,
        type: data.type,
        icon: data.icon,
        categorySlug: data.category,
      }
    });
  }

  // Upsert ToolConfig
  const isActive = data.status === "Published";

  if (data.saveAsNewVersion && data.currentVersion) {
    const existingRevision = await prisma.toolRevision.findFirst({
      where: { toolSlug: data.slug, version: data.currentVersion }
    });
    if (existingRevision) {
      throw new Error(`Version ${data.currentVersion} already exists for this tool. Please increment the version number.`);
    }
  }

  
  const toolConfig = await prisma.toolConfig.upsert({
    where: { toolSlug: data.slug },
    create: {
      toolSlug: data.slug,
      categorySlug: data.category,
      status: isActive,
      featured: data.featured,
      pricing: data.pricing,
      nameOverride: data.name,
      description: data.description,
      subCategory: data.subCategory,
      tags: data.tags,
      icon: data.icon,
      thumbnail: data.thumbnail,
      homepageVisible: data.homepageVisible,
      currentVersion: data.currentVersion || "1.0.0",
      content: content as any,
      runtimeConfig: runtimeConfig as any,
      technicalConfig: technicalConfig as any,
      publishingConfig: publishingConfig as any,
      seoMetadata,
      updatedBy: user.id,
    },
    update: {
      categorySlug: data.category,
      status: isActive,
      featured: data.featured,
      pricing: data.pricing,
      nameOverride: data.name,
      description: data.description,
      subCategory: data.subCategory,
      tags: data.tags,
      icon: data.icon,
      thumbnail: data.thumbnail,
      homepageVisible: data.homepageVisible,
      currentVersion: data.currentVersion || "1.0.0",
      content: content as any,
      runtimeConfig: runtimeConfig as any,
      technicalConfig: technicalConfig as any,
      publishingConfig: publishingConfig as any,
      seoMetadata,
      updatedBy: user.id,
    }
  });

  if (data.saveAsNewVersion) {
    await prisma.toolRevision.create({
      data: {
        toolSlug: data.slug,
        version: data.currentVersion || "1.0.0",
        changelog: data.changelog || "Manual update",
        revisionType: isActive ? "Published" : "Manual",
        isPublished: isActive,
        createdBy: user.id,
        snapshot: {
          categorySlug: data.category,
          status: isActive,
          featured: data.featured,
          pricing: data.pricing,
          nameOverride: data.name,
          description: data.description,
          subCategory: data.subCategory,
          tags: data.tags,
          icon: data.icon,
          thumbnail: data.thumbnail,
          homepageVisible: data.homepageVisible,
          content,
          runtimeConfig,
          technicalConfig,
          publishingConfig,
          seoMetadata,
        } as any
      }
    });
  }

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      actorRole: user.role || "unknown",
      action: "TOOL_SAVED",
      targetType: "TOOL",
      targetId: data.slug,
      metadata: { status: data.status, name: data.name }
    }
  });

  revalidatePath("/");
  revalidatePath("/admin/tools");
  revalidatePath(`/${data.category}/${data.slug}`);
  
  return { success: true, slug: data.slug };
}
