import { describe, expect, it } from "vitest";
import { allTools } from "@/tools/registry";
import { categories, SITE_URL } from "@/tools/categories";
import { getToolFormData } from "@/server/admin-tools";
import { toolPageDescription, toolPageJsonLd, toolPageKeywords, toolPageTitle } from "@/lib/tool-page-seo";
import { AVEXORA_ORGANIZATION, AVEXORA_PRODUCTS, productUrl } from "@/config/avexora-products";
import { GET as llms } from "@/app/llms.txt/route";
import { metadata as productsMetadata } from "@/app/products/page";

// What the live tool page emits: these are the builders page.tsx calls.

type Node = Record<string, unknown> & { "@type": string };

describe("tool page metadata (live builders)", () => {
  it.each(allTools)("$slug: bare title, so the layout adds the site name once", async (tool) => {
    const data = (await getToolFormData(tool.slug))!;
    const title = toolPageTitle(data);
    expect(title).toBe(tool.seoTitle || tool.name);
    expect(title).not.toMatch(/Avexora Tools/);
  });

  it.each(allTools)("$slug: meta description is the short SEO description", async (tool) => {
    const data = (await getToolFormData(tool.slug))!;
    const description = toolPageDescription(data);
    if (tool.seoDescription) expect(description).toBe(tool.seoDescription);
    else expect(description.length).toBeLessThanOrEqual(161);
    expect(description).not.toBe(tool.about.join("\n"));
  });
});

describe("digital business card generator SEO", () => {
  const slug = "digital-business-card-generator";

  it("has a focused title, description and keywords", async () => {
    const data = (await getToolFormData(slug))!;
    const title = toolPageTitle(data);
    expect(title.length).toBeLessThanOrEqual(60);
    expect(title.toLowerCase()).toContain("digital business card generator");
    const description = toolPageDescription(data);
    expect(description.length).toBeLessThanOrEqual(170);
    expect(description.toLowerCase()).toContain("digital business card generator");
    const keywords = toolPageKeywords(data);
    expect(keywords[0]).toBe("digital business card generator");
    expect(keywords).toContain("digital visiting card maker");
  });

  it("emits SoftwareApplication, BreadcrumbList, FAQPage and HowTo", async () => {
    const data = (await getToolFormData(slug))!;
    const cat = categories.find((c) => c.slug === data.category)!;
    const nodes = toolPageJsonLd(data, cat) as Node[];
    const types = nodes.map((n) => n["@type"]);
    expect(types).toEqual(expect.arrayContaining(["SoftwareApplication", "BreadcrumbList", "FAQPage", "HowTo"]));

    const app = nodes.find((n) => n["@type"] === "SoftwareApplication")!;
    expect(app.url).toBe(`${SITE_URL}/business-legal/${slug}`);
    expect(app.publisher).toEqual(AVEXORA_ORGANIZATION);

    const faq = nodes.find((n) => n["@type"] === "FAQPage") as unknown as { mainEntity: { name: string }[] };
    const questions = faq.mainEntity.map((q) => q.name);
    expect(questions).toContain("How do I make a digital business card for free?");
    expect(questions).toContain("What is a vCard, and why does my card need one?");

    const howTo = nodes.find((n) => n["@type"] === "HowTo") as unknown as { step: { position: number; text: string }[] };
    expect(howTo.step.length).toBe(data.steps.length);
    expect(howTo.step[0]!.position).toBe(1);
  });

  it("is the only tool showing the Avexora product cards", () => {
    expect(allTools.filter((t) => t.showAvexoraProducts).map((t) => t.slug)).toEqual([slug]);
  });
});

describe("Avexora products", () => {
  const expected = [
    "https://avexcrm.com",
    "https://avexwa.com",
    "https://ai.avexora.in",
    "https://avexora.in",
    "https://va.avexora.in",
    "https://examos.avexora.in",
  ];

  it("lists all six sites", () => {
    expect(AVEXORA_PRODUCTS.map((p) => p.url)).toEqual(expected);
    for (const p of AVEXORA_PRODUCTS) {
      expect(p.tagline && p.description && p.features.length && p.audience).toBeTruthy();
    }
  });

  it("tags outbound links with UTM parameters", () => {
    const url = new URL(productUrl(AVEXORA_PRODUCTS[0]!, "digital-business-card-generator"));
    expect(url.origin).toBe("https://avexcrm.com");
    expect(url.searchParams.get("utm_source")).toBe("tools.avexora.in");
    expect(url.searchParams.get("utm_medium")).toBe("referral");
    expect(url.searchParams.get("utm_campaign")).toBe("digital-business-card-generator");
  });

  it("the Organization's sameAs covers every Avexora site", () => {
    const all = new Set([AVEXORA_ORGANIZATION.url, ...AVEXORA_ORGANIZATION.sameAs]);
    for (const u of expected) expect(all.has(u)).toBe(true);
  });

  it("/products has a canonical and a title without the site name", () => {
    expect(productsMetadata.alternates?.canonical).toBe(`${SITE_URL}/products`);
    expect(String(productsMetadata.title)).not.toMatch(/Avexora Tools/);
    expect(String(productsMetadata.description).length).toBeLessThanOrEqual(160);
  });

  it("llms.txt lists the products and the /products page", async () => {
    const body = await (await llms()).text();
    expect(body).toContain("## Avexora products");
    expect(body).toContain(`${SITE_URL}/products`);
    for (const u of expected) expect(body).toContain(`](${u})`);
  });
});
