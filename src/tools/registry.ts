import type { CategorySlug, ToolConfig } from "../types/tools";
import { tools as financeCalculators } from "./configs/finance-calculators";
import { tools as invoicingBilling } from "./configs/invoicing-billing";
import { tools as hrPayroll } from "./configs/hr-payroll";
import { tools as marketingSeo } from "./configs/marketing-seo";
import { tools as aiWriters } from "./configs/ai-writers";
import { tools as pdfTools } from "./configs/pdf-tools";
import { tools as imageTools } from "./configs/image-tools";
import { tools as textDataTools } from "./configs/text-data-tools";
import { tools as businessLegal } from "./configs/business-legal";
import { tools as developerWeb } from "./configs/developer-web";

export const toolsByCategory: Record<CategorySlug, ToolConfig[]> = {
  "finance-calculators": financeCalculators,
  "invoicing-billing": invoicingBilling,
  "hr-payroll": hrPayroll,
  "marketing-seo": marketingSeo,
  "ai-writers": aiWriters,
  "pdf-tools": pdfTools,
  "image-tools": imageTools,
  "text-data-tools": textDataTools,
  "business-legal": businessLegal,
  "developer-web": developerWeb,
};

export const allTools: ToolConfig[] = Object.values(toolsByCategory).flat();

const bySlug = new Map(allTools.map((t) => [t.slug, t]));

export function getTool(slug: string): ToolConfig | undefined {
  return bySlug.get(slug);
}
