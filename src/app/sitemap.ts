import type { MetadataRoute } from "next";
import { categories, SITE_URL } from "@/tools/categories";
import { allTools } from "@/tools/registry";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    // Brand Studio marketing surface — the paid tier's SEO entry points.
    { url: `${SITE_URL}/studio`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/studio/pricing`, changeFrequency: "monthly", priority: 0.6 },
    ...categories.map((c) => ({
      url: `${SITE_URL}/${c.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...allTools.map((t) => ({
      url: `${SITE_URL}/${t.category}/${t.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
