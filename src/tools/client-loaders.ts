import type { CategorySlug, ToolConfig } from "./types";

/**
 * Per-category dynamic imports so a tool page's client bundle only ships its
 * own category's configs/compute code, not all 120 tools.
 */
export const categoryLoaders: Record<
  CategorySlug,
  () => Promise<{ tools: ToolConfig[] }>
> = {
  "finance-calculators": () => import("./configs/finance-calculators"),
  "invoicing-billing": () => import("./configs/invoicing-billing"),
  "hr-payroll": () => import("./configs/hr-payroll"),
  "marketing-seo": () => import("./configs/marketing-seo"),
  "ai-writers": () => import("./configs/ai-writers"),
  "pdf-tools": () => import("./configs/pdf-tools"),
  "image-tools": () => import("./configs/image-tools"),
  "text-data-tools": () => import("./configs/text-data-tools"),
  "business-legal": () => import("./configs/business-legal"),
  "developer-web": () => import("./configs/developer-web"),
};
