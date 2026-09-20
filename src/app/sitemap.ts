import type { MetadataRoute } from "next";
import { SITE_URL } from "@/tools/categories";
import { getEffectiveCategories } from "@/server/categories";
import { getEffectiveTools } from "@/server/tools";
import { prisma } from "@/server/db";
import { ContentStatus } from "@prisma/client";

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
  ];

  const toolConfigs = await prisma.toolConfig.findMany({ select: { toolSlug: true, seoMetadata: true }});
  const catConfigs = await prisma.categoryConfig.findMany({ select: { slug: true, seoMetadata: true }});

  // Filter out noindex categories
  const indexableCategories = categories.filter(cat => {
    const config = catConfigs.find(c => c.slug === cat.slug);
    const meta: any = config?.seoMetadata || {};
    return meta.robotsIndex !== false;
  });

  // Filter out noindex tools
  const indexableTools = tools.filter(tool => {
    const config = toolConfigs.find(c => c.toolSlug === tool.slug);
    const meta: any = config?.seoMetadata || {};
    return meta.robotsIndex !== false;
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
  const publishedContent = await prisma.contentItem.findMany({
    where: { status: ContentStatus.PUBLISHED, noIndex: false },
    select: { slug: true, contentType: true, updatedAt: true, publishedAt: true }
  });

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

  return [...routes, ...catRoutes, ...toolRoutes, ...uniqueContentRoutes];

}
