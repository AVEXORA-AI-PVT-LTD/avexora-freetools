import type { Metadata } from "next";
import type { CategoryDef, ToolConfig } from "../types/tools";
import { SITE_NAME, SITE_URL } from "@/tools/categories";

export function canonicalUrl(tool: Pick<ToolConfig, "category" | "slug">): string {
  return `${SITE_URL}/${tool.category}/${tool.slug}`;
}

export function categoryUrl(cat: Pick<CategoryDef, "slug">): string {
  return `${SITE_URL}/${cat.slug}`;
}

/** Absolute URL of the dynamically rendered OG image for a title/subtitle. */
export function ogImageUrl(title: string, subtitle: string): string {
  return `${SITE_URL}/og-image?title=${encodeURIComponent(title)}&subtitle=${encodeURIComponent(subtitle)}`;
}

export function toolMetadata(tool: ToolConfig, cat: CategoryDef): Metadata {
  const url = canonicalUrl(tool);
  const title = tool.name;
  const description = tool.seoDescription;
  const images = [ogImageUrl(tool.name, cat.name)];
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: `${title} | ${SITE_NAME}`,
      description,
      url,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${SITE_NAME}`,
      description,
      images,
    },
  };
}

export function categoryMetadata(cat: CategoryDef): Metadata {
  const url = categoryUrl(cat);
  const title = cat.name;
  const images = [ogImageUrl(cat.name, "Avex Tools")];
  return {
    title,
    description: cat.description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: `${title} | ${SITE_NAME}`,
      description: cat.description,
      url,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${SITE_NAME}`,
      description: cat.description,
      images,
    },
  };
}

export function toolJsonLd(tool: ToolConfig, cat: CategoryDef): object[] {
  const url = canonicalUrl(tool);
  const nodes: object[] = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: tool.name,
      description: tool.seoDescription,
      url,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: tool.faq.map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: { "@type": "Answer", text: f.answer },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Avex Tools", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: cat.name, item: categoryUrl(cat) },
        { "@type": "ListItem", position: 3, name: tool.name, item: url },
      ],
    },
  ];
  if (tool.steps && tool.steps.length > 0) {
    nodes.push({
      "@context": "https://schema.org",
      "@type": "HowTo",
      name: tool.name,
      description: tool.seoDescription,
      step: tool.steps.map((step, i) => ({
        "@type": "HowToStep",
        position: i + 1,
        name: step,
        text: step,
      })),
    });
  }
  return nodes;
}

export function categoryJsonLd(cat: CategoryDef): object[] {
  return [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Avex Tools", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: cat.name, item: categoryUrl(cat) },
      ],
    },
  ];
}