import type { MetadataRoute } from "next";
import { SITE_URL } from "@/tools/categories";
import { getEffectiveCategories } from "@/server/categories";
import { getEffectiveTools } from "@/server/tools";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, tools] = await Promise.all([
    getEffectiveCategories(),
    getEffectiveTools()
  ]);

  const now = new Date();

  // Static routes
  const routes = [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 1,
    },
    // Brand Studio marketing surface — the paid tier's SEO entry points.
    {
      url: `${SITE_URL}/studio`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/studio/pricing`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/privacy-policy`,
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/terms`,
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/refund-policy`,
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    },
  ];

  // Category pages
  const catRoutes = categories.map((cat) => ({
    url: `${SITE_URL}/${cat.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  // Tool pages
  const toolRoutes = tools.map((tool) => ({
    url: `${SITE_URL}/${tool.category}/${tool.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [...routes, ...catRoutes, ...toolRoutes];
}
