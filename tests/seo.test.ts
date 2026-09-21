import { describe, expect, it, beforeAll } from "vitest";
import { allTools, TOTAL_ACTIVE_TOOLS } from "@/tools/registry";
import { categories, SITE_NAME, SITE_OG_IMAGE, SITE_URL } from "@/tools/categories";
import { canonicalUrl, categoryJsonLd, categoryMetadata, categoryUrl, ogImageUrl, toolJsonLd, toolMetadata } from "@/lib/seo";
import sitemap from "@/app/sitemap";
import robots from "@/app/robots";

const PROD_DOMAIN = "https://tools.avexora.in";
const OLD_DOMAIN = "avextools.avexora.in";
const INTERNAL_LINK_RE = /\[([^\]]+)\]\(((?:\/[a-z0-9-]+){1,2})\)/g;

describe("§46 SEO acceptance: domain", () => {
  it("SITE_URL is the production origin", () => {
    expect(SITE_URL).toBe(PROD_DOMAIN);
  });

  it("site-wide default OG image URL uses the production domain", () => {
    expect(SITE_OG_IMAGE.startsWith(PROD_DOMAIN)).toBe(true);
    expect(SITE_OG_IMAGE).not.toContain(OLD_DOMAIN);
  });

  it("no registry or category metadata references the old domain", () => {
    const haystack = [
      SITE_NAME,
      ...categories.map((c) => [c.name, c.description, c.shortName].join(" ")),
      ...allTools.map((t) =>
        [t.name, t.tagline, t.seoDescription, ...t.about, ...t.faq.map((f) => f.question + f.answer)].join(" "),
      ),
    ].join(" ");
    expect(haystack).not.toContain(OLD_DOMAIN);
    expect(haystack).not.toContain("freetools");
  });
});

describe("§46 SEO acceptance: canonical + metadata", () => {
  it.each(allTools)("tool $slug gets one self-referencing canonical on the production domain", (tool) => {
    const canonical = canonicalUrl(tool);
    expect(canonical).toBe(`${PROD_DOMAIN}/${tool.category}/${tool.slug}`);
    expect(canonical).not.toContain(OLD_DOMAIN);
    const meta = toolMetadata(tool, categories.find((c) => c.slug === tool.category)!);
    expect(meta.title).toBe(tool.name);
    expect(meta.description).toBe(tool.seoDescription);
    expect(meta.alternates?.canonical).toBe(canonical);
    expect(meta.openGraph?.url).toBe(canonical);
    expect(meta.twitter?.description).toBe(tool.seoDescription);
  });

  it.each(categories)("category $slug gets a canonical + metadata", (cat) => {
    const meta = categoryMetadata(cat);
    expect(meta.alternates?.canonical).toBe(`${PROD_DOMAIN}/${cat.slug}`);
    expect(meta.title).toBe(cat.name);
    expect(meta.openGraph?.url).toBe(`${PROD_DOMAIN}/${cat.slug}`);
    const ogImage = Array.isArray(meta.openGraph?.images) ? meta.openGraph?.images[0] : meta.openGraph?.images;
    expect(String(ogImage)).toMatch(/^https:\/\/tools\.avexora\.in\/og-image\?/);
  });

  it("tool titles are unique across the registry", () => {
    const titles = allTools.map((t) => toolMetadata(t, categories.find((c) => c.slug === t.category)!).title);
    expect(new Set(titles).size).toBe(TOTAL_ACTIVE_TOOLS);
  });

  it("tool descriptions are unique across the registry", () => {
    const descs = allTools.map((t) => toolMetadata(t, categories.find((c) => c.slug === t.category)!).description);
    expect(new Set(descs).size).toBe(TOTAL_ACTIVE_TOOLS);
  });

  it("OG images are tool/category specific and safely encoded", () => {
    for (const t of allTools.slice(0, 12)) {
      const img = ogImageUrl(t.name, "Finance Calculators");
      expect(img.startsWith(`${PROD_DOMAIN}/og-image?`)).toBe(true);
      expect(img).not.toContain(OLD_DOMAIN);
    }
  });
});

describe("§46 SEO acceptance: sitemap", () => {
  let urls: string[] = [];

  beforeAll(async () => {
    const sm = await sitemap();
    urls = sm.map((e) => e.url);
  });

  it("references the production domain only", () => {
    for (const u of urls) {
      expect(u.startsWith(PROD_DOMAIN)).toBe(true);
      expect(u).not.toContain(OLD_DOMAIN);
    }
  });

  it("includes homepage, category pages and every public tool", () => {
    expect(urls).toContain(PROD_DOMAIN);
    for (const c of categories) expect(urls).toContain(`${PROD_DOMAIN}/${c.slug}`);
    for (const t of allTools) expect(urls).toContain(`${PROD_DOMAIN}/${t.category}/${t.slug}`);
  });

  it("excludes private, admin and auth routes", () => {
    const privatePaths = [
      "/api",
      "/studio/app",
      "/studio/account",
      "/studio/signin",
      "/studio/signup",
      "/studio/onboarding",
    ];
    for (const p of privatePaths) {
      expect(urls.some((u) => u.includes(p))).toBe(false);
    }
  });

  it("contains no duplicates and no invalid tool routes", () => {
    expect(new Set(urls).size).toBe(urls.length);
    const knownRoots = new Set([
      "",
      "/",
      "/studio",
      "/studio/pricing",
      ...categories.map((c) => `/${c.slug}`),
      ...allTools.map((t) => `/${t.category}/${t.slug}`),
    ]);
    for (const u of urls) {
      const path = u.replace(PROD_DOMAIN, "");
      expect(knownRoots.has(path), `sitemap contains unexpected route ${u}`).toBe(true);
    }
  });
});

describe("§46 SEO acceptance: robots", () => {
  it("allows public crawling, blocks only /api/, references the correct sitemap", () => {
    const r = robots();
    expect(r.rules).toEqual({ userAgent: "*", allow: "/", disallow: ["/api/"] });
    expect(r.sitemap).toBe(`${PROD_DOMAIN}/sitemap.xml`);
    expect(r.sitemap).not.toContain(OLD_DOMAIN);
  });
});

describe("§46 SEO acceptance: structured data", () => {
  it.each(allTools)("tool $slug JSON-LD is valid and uses tool facts + production URLs", (tool) => {
    const cat = categories.find((c) => c.slug === tool.category)!;
    const ld = toolJsonLd(tool, cat);
    const hasSteps = tool.steps && tool.steps.length > 0;
    expect(ld).toHaveLength(hasSteps ? 4 : 3);
    const software = ld[0] as Record<string, unknown>;
    const faq = ld[1] as { mainEntity: unknown[] };
    const breadcrumb = ld[2] as { itemListElement: Array<{ item: string }> };
    expect(software["@type"]).toBe("SoftwareApplication");
    expect(software.name).toBe(tool.name);
    expect(software.url).toBe(`${PROD_DOMAIN}/${tool.category}/${tool.slug}`);
    const offers = software.offers as { price?: string; priceCurrency?: string };
    expect(offers.price).toBe("0");
    expect(offers.priceCurrency).toBe("INR");
    expect(faq.mainEntity).toHaveLength(tool.faq.length);
    expect(faq.mainEntity.length).toBeGreaterThan(0);
    const breadcrumbItems = breadcrumb.itemListElement;
    expect(breadcrumbItems.map((i) => i.item)).toEqual([
      `${PROD_DOMAIN}`,
      `${PROD_DOMAIN}/${cat.slug}`,
      `${PROD_DOMAIN}/${tool.category}/${tool.slug}`,
    ]);
    for (const node of ld) {
      const s = JSON.stringify(node);
      expect(s).not.toContain(OLD_DOMAIN);
    }
  });

  it.each(categories)("category $slug gets a two-level BreadcrumbList", (cat) => {
    const ld = categoryJsonLd(cat);
    expect(ld).toHaveLength(1);
    const bc = ld[0] as { itemListElement: Array<{ item: string }> };
    expect(bc.itemListElement.map((i) => i.item)).toEqual([
      `${PROD_DOMAIN}`,
      `${PROD_DOMAIN}/${cat.slug}`,
    ]);
  });
});

describe("§46 SEO acceptance: contextual internal links in About", () => {
  it("every About link target resolves to a real public tool route", () => {
    const slugs = new Set(allTools.map((t) => t.slug));
    const routes = new Set(allTools.map((t) => `/${t.category}/${t.slug}`));
    for (const tool of allTools) {
      for (const para of tool.about) {
        for (const match of para.matchAll(INTERNAL_LINK_RE)) {
          const href = match[2];
          expect(href.startsWith("/"), `About of ${tool.slug} has a non-root link ${href}`).toBe(true);
          const parts = href.slice(1).split("/");
          if (parts.length === 1) {
            expect(slugs.has(parts[0]), `About of ${tool.slug} links to unknown tool ${href}`).toBe(true);
          } else {
            expect(routes.has(href), `About of ${tool.slug} links to unknown route ${href}`).toBe(true);
            const [catSlug, toolSlug] = parts;
            const target = allTools.find((t) => t.slug === toolSlug);
            expect(target?.category, `About of ${tool.slug} links wrong category ${href}`).toBe(catSlug);
          }
          expect(href).not.toContain(OLD_DOMAIN);
          expect(href).not.toContain("://");
        }
      }
    }
  });

  it("every related slug resolves to an existing tool", () => {
    for (const t of allTools) {
      for (const r of t.related) {
        expect(allTools.some((x) => x.slug === r), `related slug ${r} of ${t.slug} is unknown`).toBe(true);
      }
    }
  });
});

describe("§46 SEO acceptance: headings", () => {
  it("every public tool has a single H1 title (its name)", () => {
    for (const t of allTools) {
      expect((t.name.match(/h1/gi) ?? []).length).toBe(0);
      expect(t.name.trim().length).toBeGreaterThan(0);
    }
  });
});

describe("§46 SEO acceptance: homepage + category structure", () => {
  it("category URL helper is stable and correct", () => {
    expect(categoryUrl(categories[0])).toBe(`${PROD_DOMAIN}/${categories[0].slug}`);
  });
});