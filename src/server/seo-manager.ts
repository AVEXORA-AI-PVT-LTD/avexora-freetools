import { z } from "zod";
import { prisma } from "@/server/db";
import { unstable_cache } from "next/cache";

export const SeoMetadataSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  keywords: z.string().optional(),
  canonical: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  robotsIndex: z.boolean().optional(),
  robotsFollow: z.boolean().optional(),
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
  ogImage: z.string().url("Must be a valid image URL").optional().or(z.literal("")),
  ogType: z.string().optional(),
  twitterCard: z.string().optional(),
  twitterTitle: z.string().optional(),
  twitterDescription: z.string().optional(),
  twitterImage: z.string().url("Must be a valid image URL").optional().or(z.literal("")),
});

export type SeoMetadata = z.infer<typeof SeoMetadataSchema>;

/** Page-level defaults used when no tool/category/global override sets a field. */
export interface SeoFallbackMetadata {
  title: string;
  description: string;
  canonical: string;
  siteName: string;
  ogImage: string;
}

export const getToolSeoOverride = unstable_cache(
  async (toolSlug: string): Promise<SeoMetadata | null> => {
    try {
      const tool = await prisma.toolConfig.findUnique({
        where: { toolSlug },
        select: { seoMetadata: true }
      });
      if (!tool || !tool.seoMetadata) return null;
      return tool.seoMetadata as SeoMetadata;
    } catch {
      return null;
    }
  },
  ["tool-seo"],
  { tags: ["seo-tool"] }
);

export const getCategorySeoOverride = unstable_cache(
  async (categorySlug: string): Promise<SeoMetadata | null> => {
    try {
      const cat = await prisma.categoryConfig.findUnique({
        where: { slug: categorySlug },
        select: { seoMetadata: true }
      });
      if (!cat || !cat.seoMetadata) return null;
      return cat.seoMetadata as SeoMetadata;
    } catch {
      return null;
    }
  },
  ["category-seo"],
  { tags: ["seo-category"] }
);

export const getGlobalSeoOverride = unstable_cache(
  async (): Promise<SeoMetadata | null> => {
    try {
      const global = await prisma.contentBlock.findUnique({
        where: { key: "global_seo" }
      });
      if (!global || !global.value) return null;
      return JSON.parse(global.value) as SeoMetadata;
    } catch {
      return null;
    }
  },
  ["global-seo"],
  { tags: ["seo-global"] }
);

export async function resolveToolSeo(
  toolSlug: string,
  categorySlug: string,
  fallbackMetadata: SeoFallbackMetadata
) {
  const toolSeo = await getToolSeoOverride(toolSlug);
  const catSeo = await getCategorySeoOverride(categorySlug);
  const globalSeo = await getGlobalSeoOverride();

  const resolveField = <K extends keyof SeoMetadata>(field: K): SeoMetadata[K] | null => {
    if (toolSeo && toolSeo[field]) return toolSeo[field];
    if (catSeo && catSeo[field]) return catSeo[field];
    if (globalSeo && globalSeo[field]) return globalSeo[field];
    return null;
  };

  const title = resolveField("title") || fallbackMetadata.title;
  const description = resolveField("description") || fallbackMetadata.description;
  const canonical = resolveField("canonical") || fallbackMetadata.canonical;
  
  const robotsIndex = resolveField("robotsIndex") as boolean | null | undefined;
  const robotsFollow = resolveField("robotsFollow") as boolean | null | undefined;
  
  const ogTitle = resolveField("ogTitle") || title;
  const ogDescription = resolveField("ogDescription") || description;
  const ogImage = resolveField("ogImage") || fallbackMetadata.ogImage;
  const ogType = resolveField("ogType") || "website";
  
  const twitterCard = resolveField("twitterCard") || "summary_large_image";
  const twitterTitle = resolveField("twitterTitle") || title;
  const twitterDescription = resolveField("twitterDescription") || description;
  const twitterImage = resolveField("twitterImage") || ogImage;

  return {
    title,
    description,
    alternates: canonical ? { canonical } : undefined,
    robots: {
      index: robotsIndex !== false, // Default to true unless explicitly false
      follow: robotsFollow !== false,
    },
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url: canonical,
      siteName: fallbackMetadata.siteName,
      type: ogType,
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      card: twitterCard,
      title: twitterTitle,
      description: twitterDescription,
      images: twitterImage ? [twitterImage] : undefined,
    },
  };
}

export async function resolveCategorySeo(
  categorySlug: string,
  fallbackMetadata: SeoFallbackMetadata
) {
  const catSeo = await getCategorySeoOverride(categorySlug);
  const globalSeo = await getGlobalSeoOverride();

  const resolveField = <K extends keyof SeoMetadata>(field: K): SeoMetadata[K] | null => {
    if (catSeo && catSeo[field]) return catSeo[field];
    if (globalSeo && globalSeo[field]) return globalSeo[field];
    return null;
  };

  const title = resolveField("title") || fallbackMetadata.title;
  const description = resolveField("description") || fallbackMetadata.description;
  const canonical = resolveField("canonical") || fallbackMetadata.canonical;
  
  const robotsIndex = resolveField("robotsIndex") as boolean | null | undefined;
  const robotsFollow = resolveField("robotsFollow") as boolean | null | undefined;
  
  const ogTitle = resolveField("ogTitle") || title;
  const ogDescription = resolveField("ogDescription") || description;
  const ogImage = resolveField("ogImage") || fallbackMetadata.ogImage;
  const ogType = resolveField("ogType") || "website";
  
  const twitterCard = resolveField("twitterCard") || "summary_large_image";
  const twitterTitle = resolveField("twitterTitle") || title;
  const twitterDescription = resolveField("twitterDescription") || description;
  const twitterImage = resolveField("twitterImage") || ogImage;

  return {
    title,
    description,
    alternates: canonical ? { canonical } : undefined,
    robots: {
      index: robotsIndex !== false,
      follow: robotsFollow !== false,
    },
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url: canonical,
      siteName: fallbackMetadata.siteName,
      type: ogType,
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      card: twitterCard,
      title: twitterTitle,
      description: twitterDescription,
      images: twitterImage ? [twitterImage] : undefined,
    },
  };
}
