import { isDatabaseConfigured, prisma } from "@/server/db";
import { allTools } from "@/tools/registry";
import type { CategorySlug } from "@/types/tools";
import type { Prisma } from "@prisma/client";

export type AdminTool = {
  name: string;
  slug: string;
  category: CategorySlug;
  type: string;
  status: boolean;
  featured: boolean;
  pricing: string;
  usage: number;
  views: number;
  priority: number;
  displayOrder: number;
  updatedAt: Date;
  updatedBy: string | null;
  seoDescription: string;
  currentVersion: string;
  isDynamic: boolean;
};

export async function getAdminToolsData(): Promise<AdminTool[]> {
  const [toolConfigs, dynamicTools, usageCounts] = await Promise.all([
    prisma.toolConfig.findMany().catch(() => []),
    prisma.dynamicTool.findMany().catch(() => []),
    prisma.toolUsage.groupBy({
      by: ['toolSlug'],
      _count: { toolSlug: true },
    }).catch(() => [])
  ]);

  const configMap = new Map(toolConfigs.map((c) => [c.toolSlug, c]));
  const usageMap = new Map(usageCounts.map((u) => [u.toolSlug, u._count.toolSlug]));

  const dynamicToolConfigs = dynamicTools.map((dt) => ({
    name: dt.name,
    slug: dt.slug,
    category: dt.categorySlug as CategorySlug,
    type: dt.type,
    seoDescription: `A ${dt.type} tool for ${dt.name}.`,
    isDynamic: true,
  }));

  const mergedTools = [
    ...allTools.map(t => ({
      name: t.name,
      slug: t.slug,
      category: t.category,
      type: t.kind,
      seoDescription: t.seoDescription || "",
      isDynamic: false,
    })),
    ...dynamicToolConfigs
  ];

  const fallbackDate = new Date(); // Or maybe get the earliest from DB

  return mergedTools.map((tool) => {
    const override = configMap.get(tool.slug);
    const usage = usageMap.get(tool.slug) || 0;

    return {
      ...tool,
      status: override ? override.status : true,
      featured: override?.featured ?? false,
      pricing: override?.pricing ?? "Free",
      priority: override?.priority ?? 999,
      displayOrder: override?.displayOrder ?? 0,
      views: override?.views ?? 0,
      usage,
      updatedAt: override?.updatedAt ?? fallbackDate,
      updatedBy: override?.updatedBy ?? null,
      currentVersion: override?.currentVersion || "1.0.0",
    };
  });
}


import { INITIAL_TOOL_FORM_DATA, type ToolFormData } from "@/types/admin-tool-form";

// Shapes of the JSON blobs written to ToolConfig by saveToolData (editor-actions.ts).
type StoredToolContent = Partial<
  Pick<
    ToolFormData,
    | "pageHeading"
    | "introduction"
    | "howToUse"
    | "steps"
    | "examples"
    | "faqs"
    | "relatedTools"
    | "disclaimer"
    | "formula"
  >
>;

type StoredRuntimeConfig = Partial<
  Pick<
    ToolFormData,
    | "loginRequired"
    | "dailyLimit"
    | "monthlyLimit"
    | "rateLimit"
    | "fileUploadEnabled"
    | "maxUploadSizeMB"
    | "allowedMimeTypes"
    | "allowedExtensions"
    | "apiRequired"
    | "maintenanceMode"
  >
>;

type StoredTechnicalConfig = Partial<
  Pick<
    ToolFormData,
    | "route"
    | "internalServiceId"
    | "apiEndpointId"
    | "version"
    | "executionTimeoutMs"
    | "maxConcurrentJobs"
    | "featureFlags"
  >
>;

type StoredPublishingConfig = Partial<Pick<ToolFormData, "publishDate" | "unpublishDate">>;

interface StoredSeoMetadata {
  title?: string;
  description?: string;
  focusKeyword?: string;
  secondaryKeywords?: string[];
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  schemaType?: string;
  index?: boolean;
}

export async function getToolFormData(slug: string): Promise<ToolFormData | null> {
  // Without a database, a tool is exactly its static definition.
  const [config, dynamicTool] = isDatabaseConfigured()
    ? await Promise.all([
        prisma.toolConfig.findUnique({ where: { toolSlug: slug } }),
        prisma.dynamicTool.findUnique({ where: { slug } }),
      ])
    : [null, null];

  const staticTool = allTools.find((t) => t.slug === slug);

  if (!staticTool && !dynamicTool) {
    return null;
  }

  const base = INITIAL_TOOL_FORM_DATA;
  
  // Merge static/dynamic base first
  const merged: ToolFormData = {
    ...base,
    status: staticTool ? "Published" : "Draft",
    name: staticTool?.name || dynamicTool?.name || "",
    slug: staticTool?.slug || dynamicTool?.slug || "",
    category: staticTool?.category || dynamicTool?.categorySlug || "",
    type: staticTool?.kind || dynamicTool?.type || "generator",
    icon: dynamicTool?.icon || "",
    shortDescription: staticTool?.seoDescription || "",
    description: staticTool?.about?.join("\n\n") || "",
    introduction: staticTool?.directAnswer || "",
    formula: staticTool?.formula || "",
    examples: staticTool?.example ? [staticTool.example] : [],
    relatedTools: staticTool?.related || [],
    faqs: staticTool?.faq?.map((f, i) => ({
      id: String(i),
      question: f.question,
      answer: f.answer,
      order: i,
      active: true,
    })) || [],
    // Add steps mapping
    steps: staticTool?.steps?.map((s) => typeof s === 'string' ? s : s.title) || [],
    // Search metadata from the static config; admin SEO overrides replace these below.
    seoTitle: staticTool?.seoTitle || "",
    metaDescription: staticTool?.seoDescription || "",
    focusKeyword: staticTool?.keywords?.[0] || "",
    secondaryKeywords: staticTool?.keywords?.slice(1) || [],
  };

  if (config) {
    merged.name = config.nameOverride || merged.name;
    merged.description = config.description || merged.description;
    merged.subCategory = config.subCategory || merged.subCategory;
    merged.tags = config.tags || merged.tags;
    merged.icon = config.icon || merged.icon;
    merged.thumbnail = config.thumbnail || merged.thumbnail;
    merged.category = config.categorySlug || merged.category;
    merged.status = config.status ? "Published" : "Draft";
    merged.currentVersion = config.currentVersion || merged.currentVersion;
    merged.featured = config.featured;
    merged.pricing = (config.pricing as ToolFormData["pricing"]) || merged.pricing;
    merged.homepageVisible = config.homepageVisible;

    if (config.content && typeof config.content === "object") {
      const c = config.content as StoredToolContent;
      merged.pageHeading = c.pageHeading ?? merged.pageHeading;
      merged.introduction = c.introduction ?? merged.introduction;
      merged.howToUse = c.howToUse ?? merged.howToUse;
      merged.steps = c.steps ?? merged.steps;
      merged.examples = c.examples ?? merged.examples;
      merged.faqs = c.faqs ?? merged.faqs;
      merged.relatedTools = c.relatedTools ?? merged.relatedTools;
      merged.disclaimer = c.disclaimer ?? merged.disclaimer;
      merged.formula = c.formula ?? merged.formula;
    }

    if (config.runtimeConfig && typeof config.runtimeConfig === "object") {
      const r = config.runtimeConfig as StoredRuntimeConfig;
      merged.loginRequired = r.loginRequired ?? merged.loginRequired;
      merged.dailyLimit = r.dailyLimit ?? merged.dailyLimit;
      merged.monthlyLimit = r.monthlyLimit ?? merged.monthlyLimit;
      merged.rateLimit = r.rateLimit ?? merged.rateLimit;
      merged.fileUploadEnabled = r.fileUploadEnabled ?? merged.fileUploadEnabled;
      merged.maxUploadSizeMB = r.maxUploadSizeMB ?? merged.maxUploadSizeMB;
      merged.allowedMimeTypes = r.allowedMimeTypes ?? merged.allowedMimeTypes;
      merged.allowedExtensions = r.allowedExtensions ?? merged.allowedExtensions;
      merged.apiRequired = r.apiRequired ?? merged.apiRequired;
      merged.maintenanceMode = r.maintenanceMode ?? merged.maintenanceMode;
    }

    if (config.technicalConfig && typeof config.technicalConfig === "object") {
      const t = config.technicalConfig as StoredTechnicalConfig;
      merged.route = t.route ?? merged.route;
      merged.internalServiceId = t.internalServiceId ?? merged.internalServiceId;
      merged.apiEndpointId = t.apiEndpointId ?? merged.apiEndpointId;
      merged.version = t.version ?? merged.version;
      merged.executionTimeoutMs = t.executionTimeoutMs ?? merged.executionTimeoutMs;
      merged.maxConcurrentJobs = t.maxConcurrentJobs ?? merged.maxConcurrentJobs;
      merged.featureFlags = t.featureFlags ?? merged.featureFlags;
    }

    if (config.seoMetadata && typeof config.seoMetadata === "object") {
      const s = config.seoMetadata as StoredSeoMetadata;
      merged.seoTitle = s.title ?? merged.seoTitle;
      merged.metaDescription = s.description ?? merged.metaDescription;
      merged.focusKeyword = s.focusKeyword ?? merged.focusKeyword;
      merged.secondaryKeywords = s.secondaryKeywords ?? merged.secondaryKeywords;
      merged.canonicalUrl = s.canonicalUrl ?? merged.canonicalUrl;
      merged.ogTitle = s.ogTitle ?? merged.ogTitle;
      merged.ogDescription = s.ogDescription ?? merged.ogDescription;
      merged.ogImage = s.ogImage ?? merged.ogImage;
      merged.schemaType = s.schemaType ?? merged.schemaType;
      merged.index = s.index ?? merged.index;
    }

    if (config.publishingConfig && typeof config.publishingConfig === "object") {
      const p = config.publishingConfig as StoredPublishingConfig;
      merged.publishDate = p.publishDate ?? merged.publishDate;
      merged.unpublishDate = p.unpublishDate ?? merged.unpublishDate;
    }
  }

  return merged;
}
