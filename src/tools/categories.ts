import type { CategoryDef, CategorySlug } from "../types/tools";

export const EBOS_URL =
  process.env.NEXT_PUBLIC_EBOS_URL ?? "https://ebos.avexora.in";

export const SITE_URL = "https://avextools.avexora.in";
export const SITE_NAME = "Avexora Tools";

export const categories: CategoryDef[] = [
  {
    slug: "finance-calculators",
    name: "Finance Calculators",
    shortName: "Finance",
    description:
      "Free calculators for GST, EMI, investments, tax, margins and every number your business runs on.",
    ebosModule: "Finance",
    ebosPath: "/modules/finance",
    ctaHeadline: "Run your entire business finance on EBOS",
    ctaBody:
      "Accounting, GST filing, cash-flow tracking and financial reports — automated in the EBOS Finance module.",
  },
  {
    slug: "invoicing-billing",
    name: "Invoicing & Billing Tools",
    shortName: "Invoicing",
    description:
      "Generate GST invoices, quotations, purchase orders, receipts and payment reminders in seconds.",
    ebosModule: "Billing",
    ebosPath: "/modules/billing",
    ctaHeadline: "Stop making invoices by hand",
    ctaBody:
      "EBOS Billing creates, sends and tracks GST invoices automatically — with payment reminders built in.",
  },
  {
    slug: "hr-payroll",
    name: "HR & Payroll Tools",
    shortName: "HR & Payroll",
    description:
      "Salary, PF, gratuity and HRA calculators plus payslip and HR letter generators for Indian businesses.",
    ebosModule: "HR & Payroll",
    ebosPath: "/modules/hr-payroll",
    ctaHeadline: "Payroll that runs itself",
    ctaBody:
      "EBOS HR & Payroll handles salaries, compliance, leave and letters for your whole team automatically.",
  },
  {
    slug: "marketing-seo",
    name: "Marketing & SEO Tools",
    shortName: "Marketing",
    description:
      "Meta tags, UTM links, SERP previews, ad-spend calculators and more for marketers and founders.",
    ebosModule: "Marketing",
    ebosPath: "/modules/marketing",
    ctaHeadline: "Turn marketing into a system",
    ctaBody:
      "Campaigns, leads and analytics in one place with the EBOS Marketing module.",
  },
  {
    slug: "ai-writers",
    name: "AI Writing Tools",
    shortName: "AI Writers",
    description:
      "Free AI generators for blog outlines, product descriptions, ad copy, emails and social posts.",
    ebosModule: "Marketing",
    ebosPath: "/modules/marketing#ai",
    ctaHeadline: "AI-powered marketing at scale",
    ctaBody:
      "The EBOS Marketing module writes, schedules and tracks your content with AI built in.",
  },
  {
    slug: "pdf-tools",
    name: "PDF Tools",
    shortName: "PDF",
    description:
      "Merge, split, watermark and edit PDFs right in your browser — files never leave your device.",
    ebosModule: "Documents",
    ebosPath: "/modules/documents",
    ctaHeadline: "Your documents, organised",
    ctaBody:
      "EBOS Documents stores, shares and e-signs your business paperwork securely in one place.",
  },
  {
    slug: "image-tools",
    name: "Image Tools",
    shortName: "Images",
    description:
      "Compress, resize, crop and convert images instantly in your browser — no upload needed.",
    ebosModule: "Documents",
    ebosPath: "/modules/documents",
    ctaHeadline: "Every business file in one place",
    ctaBody:
      "EBOS Documents manages your images, brand assets and paperwork with team access controls.",
  },
  {
    slug: "text-data-tools",
    name: "Text & Data Tools",
    shortName: "Text & Data",
    description:
      "Word counters, converters, formatters and data utilities that save you an hour a day.",
    ebosModule: "Productivity",
    ebosPath: "/modules/productivity",
    ctaHeadline: "Work faster with EBOS",
    ctaBody:
      "Tasks, notes and team productivity tools built into the EBOS Productivity module.",
  },
  {
    slug: "business-legal",
    name: "Business & Legal Generators",
    shortName: "Legal",
    description:
      "Generate NDAs, policies, agreements and contracts from ready-made templates in minutes.",
    ebosModule: "Compliance",
    ebosPath: "/modules/compliance",
    ctaHeadline: "Stay compliant without a legal team",
    ctaBody:
      "EBOS Compliance tracks your filings, contracts and statutory deadlines automatically.",
  },
  {
    slug: "developer-web",
    name: "Developer & Web Utilities",
    shortName: "Dev & Web",
    description:
      "QR codes, encoders, converters, regex testing and everyday utilities for builders.",
    ebosModule: "Website",
    ebosPath: "/modules/website",
    ctaHeadline: "Launch your business website with EBOS",
    ctaBody:
      "The EBOS Website module gives you a fast business site with forms, SEO and analytics included.",
  },
];

const bySlug = new Map(categories.map((c) => [c.slug, c]));

export function getCategory(slug: string): CategoryDef | undefined {
  return bySlug.get(slug as CategorySlug);
}

/** EBOS module CTA URL for a tool, with UTM attribution per spec §2. */
export function ebosCtaUrl(category: CategoryDef, toolSlug: string): string {
  const [path, hash] = category.ebosPath.split("#");
  const qs = `?utm_source=avextools&utm_medium=cta&utm_campaign=${toolSlug}`;
  return `${EBOS_URL}${path}${qs}${hash ? `#${hash}` : ""}`;
}
