import { prisma } from "@/server/db";

export type SectionKey = 
  | "hero" 
  | "brand_studio" 
  | "featured_tools" 
  | "popular_tools" 
  | "new_tools" 
  | "recommended_tools" 
  | "categories" 
  | "footer";

export interface HomepageSection {
  id?: string;
  sectionKey: SectionKey;
  enabled: boolean;
  sortOrder: number;
  heading: string;
  description: string;
  config: any;
}

export const DEFAULT_HOMEPAGE_CONFIG: HomepageSection[] = [
  {
    sectionKey: "hero",
    enabled: true,
    sortOrder: 0,
    heading: "Free Online Tools for Work, Finance & More",
    description: "Avexora Tools provides practical online calculators, generators, utilities and AI writing tools for everyday work.",
    config: {
      searchPlaceholder: "Search from 130+ free tools...",
      ctaEnabled: false,
      ctaText: "",
      ctaUrl: ""
    }
  },
  {
    sectionKey: "brand_studio",
    enabled: true,
    sortOrder: 1,
    heading: "Grow your business online.",
    description: "Your digital presence managed from one place.",
    config: {
      label: "AVEXORA BRAND STUDIO",
      features: [
        { icon: "Globe", title: "Websites", description: "Professional business sites" }
      ],
      ctaText: "Explore Brand Studio",
      ctaUrl: "/studio",
      pricingText: "Starting from ₹3,499/month",
      image: ""
    }
  },
  {
    sectionKey: "featured_tools",
    enabled: true,
    sortOrder: 2,
    heading: "Featured Tools",
    description: "Our most useful tools for everyday work.",
    config: { maxItems: 8, tools: [] }
  },
  {
    sectionKey: "popular_tools",
    enabled: true,
    sortOrder: 3,
    heading: "Popular Tools",
    description: "Tools used by thousands of professionals.",
    config: { mode: "automatic", maxItems: 8, tools: [] }
  },
  {
    sectionKey: "new_tools",
    enabled: true,
    sortOrder: 4,
    heading: "New Tools",
    description: "Our latest additions.",
    config: { mode: "latest", maxItems: 8, tools: [] }
  },
  {
    sectionKey: "recommended_tools",
    enabled: false,
    sortOrder: 5,
    heading: "Recommended Tools",
    description: "Hand-picked for you.",
    config: { maxItems: 8, tools: [] }
  },
  {
    sectionKey: "categories",
    enabled: true,
    sortOrder: 6,
    heading: "Explore by Category",
    description: "Find exactly what you need.",
    config: { maxItems: 12, categories: [] }
  },
  {
    sectionKey: "footer",
    enabled: true,
    sortOrder: 7,
    heading: "",
    description: "Avexora Tools provides practical online business tools.",
    config: {
      navigation: [],
      socialLinks: [],
      legalLinks: [],
      copyright: "© {YEAR} Avexora Tools. All rights reserved."
    }
  }
];

export async function getHomepageSections(): Promise<HomepageSection[]> {
  const dbConfigs = await prisma.homepageConfig.findMany({
    orderBy: { sortOrder: 'asc' }
  });

  const dbMap = new Map(dbConfigs.map(c => [c.sectionKey, c]));

  const merged = DEFAULT_HOMEPAGE_CONFIG.map(defaultConfig => {
    const override = dbMap.get(defaultConfig.sectionKey);
    if (!override) return defaultConfig;
    return {
      ...defaultConfig,
      id: override.id,
      enabled: override.enabled,
      sortOrder: override.sortOrder,
      heading: override.heading ?? defaultConfig.heading,
      description: override.description ?? defaultConfig.description,
      config: override.config ? (override.config as any) : defaultConfig.config
    };
  });

  // DB might have sorted them differently, let's sort the merged result by sortOrder
  return merged.sort((a, b) => a.sortOrder - b.sortOrder);
}
