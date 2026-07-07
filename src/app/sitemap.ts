import type { MetadataRoute } from "next";
import { categories, SITE_URL } from "@/tools/categories";
import { allTools } from "@/tools/registry";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
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
