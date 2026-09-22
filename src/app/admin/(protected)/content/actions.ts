"use server";

import { requireAdminAuth } from "@/server/admin-auth";
import { prisma } from "@/server/db";
import { z } from "zod";
import { CONTENT_BLOCKS, ContentBlockKey } from "@/server/content";
import { revalidatePath } from "next/cache";

const updateContentBlockSchema = z.object({
  key: z.string().refine((k) => Object.keys(CONTENT_BLOCKS).includes(k), "Invalid content key"),
  value: z.string().max(1000, "Content too long"),
});

export async function updateContentBlock(formData: FormData) {
  const session = await requireAdminAuth("content.edit");

  const key = formData.get("key") as string;
  const value = formData.get("value") as string;

  const parsed = updateContentBlockSchema.safeParse({ key, value });
  if (!parsed.success) {
    return { error: (parsed.error as any).errors[0].message };
  }

  const { key: validKey, value: validValue } = parsed.data;
  const config = CONTENT_BLOCKS[validKey as ContentBlockKey];

  if (validValue.length > config.maxLength) {
    return { error: `Content exceeds maximum length of ${config.maxLength}` };
  }

  // Basic HTML injection protection since we are not using rich-text or markdown.
  if (validValue.includes("<script") || validValue.includes("javascript:")) {
    return { error: "HTML/JS is not permitted." };
  }

  if (config.required && !validValue.trim()) {
    return { error: "This field is required." };
  }

  try {
    await prisma.contentBlock.upsert({
      where: { key: validKey },
      create: {
        key: validKey,
        value: validValue,
        type: config.type,
        status: true,
      },
      update: {
        value: validValue,
        status: true,
      },
    });

    // Revalidation
    if (config.section === "Homepage") {
      revalidatePath("/");
    } else if (config.section === "Footer") {
      // Footer is shared across the entire site, so revalidate root layout path.
      revalidatePath("/", "layout");
    }

    return { success: true };
  } catch (err) {
    console.error("Failed to update content block:", err);
    return { error: "Failed to update content. Please try again." };
  }
}
