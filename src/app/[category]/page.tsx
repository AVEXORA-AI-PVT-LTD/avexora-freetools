import type { Metadata } from "next";
import { AVEXORA_ORGANIZATION } from "@/config/avexora-products";
import { notFound } from "next/navigation";
import { categories, SITE_NAME, SITE_URL } from "@/tools/categories";
import { getEffectiveCategory, getEffectiveCategories } from "@/server/categories";
import { getEffectiveToolsByCategory } from "@/server/tools";
import type { CategorySlug } from "@/types/tools";
import { resolveCategorySeo } from "@/server/seo-manager";
import { CategoryPageClient } from "@/components/design3/CategoryPageClient";

export const dynamicParams = true;

export function generateStaticParams() {
  return categories.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const cat = await getEffectiveCategory(category);
  if (!cat) return {};

  const defaultTitle = `Free Online ${cat.name}`;
  const defaultCanonical = `${SITE_URL}/${cat.slug}`;

  const fallback = {
    title: defaultTitle,
    description: cat.description,
    canonical: defaultCanonical,
    siteName: SITE_NAME,
    ogImage: `${SITE_URL}/logo.png`,
  };

  return resolveCategorySeo(category, fallback);
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const [cat, toolsByCategoryMap, allEffectiveCategories] = await Promise.all([
    getEffectiveCategory(category),
    getEffectiveToolsByCategory(),
    getEffectiveCategories(),
  ]);

  if (!cat) notFound();
  const tools = toolsByCategoryMap[cat.slug as CategorySlug] || [];
  const canonical = `${SITE_URL}/${cat.slug}`;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: SITE_NAME, item: SITE_URL },
        { "@type": "ListItem", position: 2, name: cat.name, item: canonical },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: cat.name,
      description: cat.description,
      url: canonical,
      publisher: AVEXORA_ORGANIZATION,
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: tools.length,
        itemListElement: tools.map((t, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: t.name,
          url: `${SITE_URL}/${cat.slug}/${t.slug}`,
        })),
      },
    },
  ];

  const serializedTools = tools.map((t) => ({
    slug: t.slug,
    name: t.name,
    tagline: t.tagline ?? "",
    seoDescription: t.seoDescription ?? "",
    category: t.category,
    kind: t.kind,
  }));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CategoryPageClient 
        category={cat} 
        tools={serializedTools} 
        availableCategories={allEffectiveCategories} 
      />
    </>
  );
}
