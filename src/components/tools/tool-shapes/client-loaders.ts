import type { CategorySlug, ToolConfig } from "@/types/tools";

/**
 * Per-category dynamic imports so a tool page's client bundle only ships its
 * own category's configs/compute code, not all 120 tools.
 */
export const categoryLoaders: Record<
  CategorySlug,
  () => Promise<{ tools: ToolConfig[] }>
> = {
  "finance-calculators": () => import("@/tools/configs/finance-calculators"),
  "invoicing-billing": () => import("@/tools/configs/invoicing-billing"),
  "hr-payroll": () => import("@/tools/configs/hr-payroll"),
  "marketing-seo": () => import("@/tools/configs/marketing-seo"),
  "ai-writers": () => import("@/tools/configs/ai-writers"),
  "pdf-tools": () => import("@/tools/configs/pdf-tools"),
  "image-tools": () => import("@/tools/configs/image-tools"),
  "text-data-tools": () => import("@/tools/configs/text-data-tools"),
  "business-legal": () => import("@/tools/configs/business-legal"),
  "developer-web": () => import("@/tools/configs/developer-web"),
};
