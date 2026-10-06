import { categories, SITE_NAME, SITE_URL } from "@/tools/categories";
import { AVEXORA_ORGANIZATION } from "@/config/avexora-products";
import { Design3Page } from "@/components/design3/Design3Page";
import { getHomepageSections } from "@/server/homepage-service";
import { getEffectiveCategories } from "@/server/categories";
import { getEffectiveTools } from "@/server/tools";
import { getEffectiveNavigation } from "@/server/navigation";

const homepageJsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description:
      "Free calculators, generators, PDF & image utilities and AI writing tools for your business.",
  },
  { "@context": "https://schema.org", ...AVEXORA_ORGANIZATION },
];

export default async function HomePage() {
  const [sections, effectiveCategories, effectiveTools, headerNav, footerNav] = await Promise.all([
    getHomepageSections(),
    getEffectiveCategories(),
    getEffectiveTools(),
    getEffectiveNavigation("HEADER"),
    getEffectiveNavigation("FOOTER"),
  ]);

  const staticCatMap = new Map((categories || []).map((c) => [c.slug, c.name]));

  const serializedTools = effectiveTools.map((t) => {
    const cat = effectiveCategories.find((c) => c.slug === t.category);
    const catName = (cat?.name && cat.name !== "Unnamed Category" && cat.name.trim() !== "")
      ? cat.name
      : (staticCatMap.get(t.category as any) || t.category);

    return {
      id: t.slug,
      name: t.name,
      category: t.category,
      categoryName: catName,
      description: t.tagline || t.seoDescription || "",
      popular: (t.priority ?? 999) <= 2,
      isNew: false,
      tags: t.keywords || [],
    };
  });

  const serializedCategories = effectiveCategories.map((c) => {
    const fallbackName = staticCatMap.get(c.slug as any) || c.slug;
    const resolvedName = (c.name && c.name !== "Unnamed Category" && c.name.trim() !== "") 
      ? c.name 
      : fallbackName;

    return {
      id: c.slug,
      name: resolvedName,
      count: effectiveTools.filter((t) => t.category === c.slug).length,
      icon: (c as { icon?: string | null }).icon || "Calculator",
      description: c.description || "",
      color: "from-orange-500 to-amber-600",
    };
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homepageJsonLd) }}
      />
      <Design3Page
        homepageSections={sections}
        effectiveCategories={serializedCategories}
        effectiveTools={serializedTools}
        headerNav={headerNav}
        footerNav={footerNav}
      />
    </>
  );
}
