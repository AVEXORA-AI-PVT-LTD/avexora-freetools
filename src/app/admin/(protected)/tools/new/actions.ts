"use server";

import { prisma } from "@/server/db";
import { requireAdminAuth } from "@/server/admin-auth";
import { hasPermission } from "@/lib/admin/permissions";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { DynamicToolSchema, RESERVED_SLUGS } from "@/lib/admin/dynamic-tools";
import { allTools } from "@/tools/registry";
import { getAllCategoriesWithConfig } from "@/server/categories";

export async function createDynamicTool(prevState: any, formData: FormData) {
  try {
    const user = await requireAdminAuth();
    if (!hasPermission(user.role, "tools.create")) {
      return { error: "You do not have permission to create tools." };
    }

    const rawData = {
      name: formData.get("name")?.toString() || "",
      slug: formData.get("slug")?.toString() || "",
      categorySlug: formData.get("categorySlug")?.toString() || "",
      type: formData.get("type")?.toString() || "",
      icon: formData.get("icon")?.toString() || undefined,
    };

    const parseResult = DynamicToolSchema.safeParse(rawData);
    if (!parseResult.success) {
      return { error: parseResult.error.errors[0].message, fields: rawData };
    }
    const validated = parseResult.data;

    // Normalize slug
    const normalizedSlug = validated.slug.toLowerCase().replace(/[^a-z0-9-]/g, "");

    if (RESERVED_SLUGS.includes(normalizedSlug)) {
      return { error: `The slug "${normalizedSlug}" is reserved and cannot be used.`, fields: rawData };
    }

    // Verify uniqueness against static registry
    if (allTools.some(t => t.slug === normalizedSlug)) {
      return { error: "This slug is already used by a built-in tool.", fields: rawData };
    }

    // Verify category exists
    const categories = await getAllCategoriesWithConfig();
    if (!categories.some(c => c.slug === validated.categorySlug)) {
      return { error: "Selected category does not exist.", fields: rawData };
    }

    // Check DynamicTool DB uniqueness (avoid relying solely on DB error)
    const existing = await prisma.dynamicTool.findUnique({ where: { slug: normalizedSlug } });
    if (existing) {
      return { error: "This slug is already used by another dynamic tool.", fields: rawData };
    }

    // Get max displayOrder for the category
    const existingToolConfigs = await prisma.toolConfig.findMany({
      where: { categorySlug: validated.categorySlug },
      orderBy: { displayOrder: "desc" },
      take: 1,
    });
    const nextOrder = existingToolConfigs.length > 0 ? existingToolConfigs[0].displayOrder + 1 : 0;

    // Transaction: Create DynamicTool and ToolConfig
    await prisma.$transaction([
      prisma.dynamicTool.create({
        data: {
          name: validated.name.trim(),
          slug: normalizedSlug,
          categorySlug: validated.categorySlug,
          type: validated.type,
          icon: validated.icon,
        },
      }),
      prisma.toolConfig.create({
        data: {
          toolSlug: normalizedSlug,
          categorySlug: validated.categorySlug,
          status: true,
          priority: 999,
          displayOrder: nextOrder,
        },
      }),
    ]);

    revalidatePath("/");
    revalidatePath("/admin/tools");
    revalidatePath(`/${validated.categorySlug}`);
    revalidatePath("/(public)", "layout");

  } catch (error: any) {
    console.error("[createDynamicTool Error]:", error);
    return { error: error.message || "An unexpected error occurred." };
  }

  // Redirect outside try-catch to avoid NEXT_REDIRECT error caught by catch block
  redirect("/admin/tools");
}
