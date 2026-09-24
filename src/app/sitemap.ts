import type { MetadataRoute } from "next";
import { SITE_URL } from "@/tools/categories";
import { getEffectiveCategories } from "@/server/categories";
import { getEffectiveTools } from "@/server/tools";
import { isDatabaseConfigured, prisma } from "@/server/db";
import { ContentStatus, type Prisma } from "@prisma/client";

function isNoIndex(seoMetadata: Prisma.JsonValue | undefined): boolean {
  if (!seoMetadata || typeof seoMetadata !== "object" || Array.isArray(seoMetadata)) return false;
  return seoMetadata.robotsIndex === false;
}

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

  // Admin overrides (noindex, CMS content, redirects) live in the database.
  // Without one, the sitemap is the static catalog.
  const hasDb = isDatabaseConfigured();
  const [toolConfigs, catConfigs] = hasDb
    ? await Promise.all([
        prisma.toolConfig.findMany({ select: { toolSlug: true, seoMetadata: true } }),
        prisma.categoryConfig.findMany({ select: { slug: true, seoMetadata: true } }),
      ])
    : [[], []];

  // Filter out noindex categories
  const indexableCategories = categories.filter(cat => {
    const config = catConfigs.find(c => c.slug === cat.slug);
    return !isNoIndex(config?.seoMetadata);
  });

  // Filter out noindex tools
  const indexableTools = tools.filter(tool => {
    const config = toolConfigs.find(c => c.toolSlug === tool.slug);
    return !isNoIndex(config?.seoMetadata);
  });

  // Category pages
  const catRoutes = indexableCategories.map((cat) => ({
    url: `${SITE_URL}/${cat.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  // Tool pages
  const toolRoutes = indexableTools.map((tool) => ({
    url: `${SITE_URL}/${tool.category}/${tool.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));


  // Content Items (Blog, Page, Guide, FAQ)
  const publishedContent = hasDb
    ? await prisma.contentItem.findMany({
        where: { status: ContentStatus.PUBLISHED, noIndex: false },
        select: { slug: true, contentType: true, updatedAt: true, publishedAt: true }
      })
    : [];

  const contentRoutes = publishedContent.map((c) => {
    let path = `/${c.slug}`; // Default for PAGE
    if (c.contentType === "BLOG") path = `/blog/${c.slug}`;
    else if (c.contentType === "GUIDE") path = `/guides/${c.slug}`;
    else if (c.contentType === "FAQ") path = `/faq`;
    else if (c.contentType === "DOCUMENTATION") path = `/docs/${c.slug}`;
    else if (["PRIVACY", "TERMS", "DISCLAIMER"].includes(c.contentType)) path = `/legal/${c.slug}`;

    return {
      url: `${SITE_URL}${path}`,
      lastModified: c.updatedAt || c.publishedAt || now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    };
  });

  // Filter out duplicates (like multiple FAQs mapping to /faq)
  const uniqueContentRoutes = Array.from(new Map(contentRoutes.map(item => [item.url, item])).values());

  const allRoutes = [...routes, ...catRoutes, ...toolRoutes, ...uniqueContentRoutes];
  
  // Filter out any routes that are actively redirected
  const activeRedirects = hasDb
    ? await prisma.redirect.findMany({ where: { active: true }, select: { source: true } })
    : [];
  const redirectedPaths = new Set(activeRedirects.map(r => r.source));
  
  return allRoutes.filter(route => {
    const path = route.url.replace(SITE_URL, '');
    return !redirectedPaths.has(path);
  });


}
