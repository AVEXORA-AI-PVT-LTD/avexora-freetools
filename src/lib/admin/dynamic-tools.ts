import { z } from "zod";

export const DYNAMIC_TOOL_TYPES = ["calculator", "generator", "file-tool", "ai-writer"] as const;
export type DynamicToolType = typeof DYNAMIC_TOOL_TYPES[number];

export const DYNAMIC_TOOL_ICONS = ["calculator", "file", "document", "percent", "settings", "code"] as const;
export type DynamicToolIcon = typeof DYNAMIC_TOOL_ICONS[number];

export const RESERVED_SLUGS = [
  "admin", "api", "login", "sign-in", "sign-up", "dashboard", 
  "settings", "tools", "favicon", "robots", "sitemap", "llms", 
  "studio", "auth"
];

export const DynamicToolSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name is too long"),
  slug: z.string()
    .trim()
    .min(1, "Slug is required")
    .max(100, "Slug is too long")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  categorySlug: z.string().min(1, "Category is required"),
  type: z.enum(DYNAMIC_TOOL_TYPES),
  icon: z.enum(DYNAMIC_TOOL_ICONS).optional(),
});
