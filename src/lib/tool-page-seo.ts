import type { CategoryDef } from "@/types/tools";
import type { ToolFormData } from "@/types/admin-tool-form";
import { SITE_NAME, SITE_URL } from "@/tools/categories";
import { AVEXORA_ORGANIZATION } from "@/config/avexora-products";

/**
 * What a tool page tells search and answer engines: its title, description,
 * keywords and JSON-LD. The page and the SEO tests both use these, so the
 * tests check what the live page actually emits.
 */

type ToolSeoSource = Pick<
  ToolFormData,
  | "name"
  | "slug"
  | "category"
  | "seoTitle"
  | "metaDescription"
  | "shortDescription"
  | "description"
  | "focusKeyword"
  | "secondaryKeywords"
  | "faqs"
  | "steps"
  | "pricing"
  | "schemaType"
>;

const DESCRIPTION_MAX = 160;

/** The page title without the site name, which the layout template appends. */
export function toolPageTitle(tool: ToolSeoSource): string {
  return tool.seoTitle.trim() || tool.name;
}

/**
 * The meta description: an admin override, else the tool's short SEO
 * description, else the start of its About copy trimmed to a sentence.
 */
export function toolPageDescription(tool: ToolSeoSource): string {
  const explicit = tool.metaDescription.trim() || tool.shortDescription.trim();
  if (explicit) return explicit;
  const about = tool.description.replace(/\s+/g, " ").trim();
  if (about.length <= DESCRIPTION_MAX) return about;
  const cut = about.slice(0, DESCRIPTION_MAX);
  const sentence = cut.lastIndexOf(". ");
  return sentence > 80 ? cut.slice(0, sentence + 1) : `${cut.slice(0, cut.lastIndexOf(" "))}…`;
}

export function toolPageKeywords(tool: ToolSeoSource): string[] {
  return [tool.focusKeyword, ...tool.secondaryKeywords].map((k) => k.trim()).filter(Boolean);
}

export function toolCanonical(tool: Pick<ToolSeoSource, "category" | "slug">): string {
  return `${SITE_URL}/${tool.category}/${tool.slug}`;
}

/** SoftwareApplication, FAQPage, BreadcrumbList and — when the tool has steps — HowTo. */
export function toolPageJsonLd(
  tool: ToolSeoSource,
  cat: Pick<CategoryDef, "slug" | "name">,
  opts: { canonical?: string; description?: string } = {},
): object[] {
  const url = opts.canonical || toolCanonical(tool);
  const description = opts.description || toolPageDescription(tool);
  const faqs = tool.faqs.filter((f) => f.active);
  const nodes: object[] = [
    {
      "@context": "https://schema.org",
      "@type": tool.schemaType || "SoftwareApplication",
      name: tool.name,
      description,
      url,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      keywords: toolPageKeywords(tool).join(", ") || undefined,
      offers: { "@type": "Offer", price: tool.pricing === "Free" ? "0" : "99", priceCurrency: "INR" },
      publisher: AVEXORA_ORGANIZATION,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: SITE_NAME, item: SITE_URL },
        { "@type": "ListItem", position: 2, name: cat.name, item: `${SITE_URL}/${cat.slug}` },
        { "@type": "ListItem", position: 3, name: tool.name, item: url },
      ],
    },
  ];
  if (faqs.length) {
    nodes.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: { "@type": "Answer", text: f.answer },
      })),
    });
  }
  const steps = tool.steps.map((s) => s.trim()).filter(Boolean);
  if (steps.length) {
    nodes.push({
      "@context": "https://schema.org",
      "@type": "HowTo",
      name: `How to use the ${tool.name}`,
      description,
      step: steps.map((text, i) => ({ "@type": "HowToStep", position: i + 1, name: `Step ${i + 1}`, text })),
    });
  }
  return nodes;
}
