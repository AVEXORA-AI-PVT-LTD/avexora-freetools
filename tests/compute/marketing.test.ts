import { describe, expect, it } from "vitest";
import type { ComputeFn, FieldValues, GenerateFn } from "@/tools/types";
import { generateMetaTags } from "@/tools/compute/marketing/meta-tags";
import { buildUtmUrl } from "@/tools/compute/marketing/utm-builder";
import { generateSlugs } from "@/tools/compute/marketing/slug";
import { generateHashtags } from "@/tools/compute/marketing/hashtags";
import { generateSerpSnippet } from "@/tools/compute/marketing/serp-snippet";
import { generateRobotsTxt } from "@/tools/compute/marketing/robots-txt";
import { computeKeywordDensity } from "@/tools/compute/marketing/keyword-density";
import { analyzeHeadline } from "@/tools/compute/marketing/headline";
import { testSubjectLine } from "@/tools/compute/marketing/subject-line";
import { computeRoas } from "@/tools/compute/marketing/roas";
import { computeCpm } from "@/tools/compute/marketing/cpm";
import { computeEngagementRate } from "@/tools/compute/marketing/engagement-rate";

function textOf(fn: GenerateFn, values: FieldValues): string {
  const out = fn(values);
  if ("error" in out) throw new Error(out.error);
  return out.text;
}

function resultMap(fn: ComputeFn, values: FieldValues) {
  const out = fn(values);
  if ("error" in out) throw new Error(out.error);
  return new Map(out.results.map((r) => [r.label, r.value]));
}

describe("generateMetaTags", () => {
  it("builds title, description, canonical and OG/Twitter tags", () => {
    const out = textOf(generateMetaTags, {
      title: "GST Calculator", description: "Free GST calculator", canonical: "https://x.in/gst",
      ogImage: "", siteName: "Avexora", twitterCard: "summary",
    });
    expect(out).toContain("<title>GST Calculator</title>");
    expect(out).toContain('<link rel="canonical" href="https://x.in/gst" />');
    expect(out).toContain('<meta property="og:site_name" content="Avexora" />');
    expect(out).toContain('<meta name="twitter:card" content="summary" />');
  });
  it("escapes HTML-sensitive characters", () => {
    expect(textOf(generateMetaTags, { title: "A & B", description: "d" })).toContain("A &amp; B");
  });
  it("rejects missing title/description and bad URLs", () => {
    expect(generateMetaTags({ title: "", description: "d" })).toHaveProperty("error");
    expect(generateMetaTags({ title: "t", description: "d", canonical: "not-a-url" })).toHaveProperty("error");
  });
});

describe("buildUtmUrl", () => {
  it("builds a UTM URL and encodes values", () => {
    expect(
      textOf(buildUtmUrl, { url: "https://x.in/page", source: "news letter", medium: "email", campaign: "diwali sale" }),
    ).toBe("https://x.in/page?utm_source=news%20letter&utm_medium=email&utm_campaign=diwali%20sale");
  });
  it("appends with & when the URL already has a query string", () => {
    expect(
      textOf(buildUtmUrl, { url: "https://x.in/page?ref=1", source: "s", medium: "m", campaign: "c" }),
    ).toBe("https://x.in/page?ref=1&utm_source=s&utm_medium=m&utm_campaign=c");
  });
  it("rejects a non-http URL and missing required params", () => {
    expect(buildUtmUrl({ url: "ftp://x.in", source: "s", medium: "m", campaign: "c" })).toHaveProperty("error");
    expect(buildUtmUrl({ url: "https://x.in", source: "", medium: "m", campaign: "c" })).toHaveProperty("error");
  });
});

describe("generateSlugs", () => {
  it("slugifies with hyphens by default", () => {
    expect(textOf(generateSlugs, { text: "Hello, World! 2026", separator: "hyphen" })).toBe("hello-world-2026");
  });
  it("supports underscore separator and multiple lines", () => {
    expect(textOf(generateSlugs, { text: "Line One\nLine Two", separator: "underscore" })).toBe("line_one\nline_two");
  });
  it("rejects empty input", () => {
    expect(generateSlugs({ text: "   ", separator: "hyphen" })).toHaveProperty("error");
  });
});

describe("generateHashtags", () => {
  it("generates camelCase hashtags and dedupes", () => {
    const out = textOf(generateHashtags, { keywords: "small business, Small Business", style: "camelCase" });
    expect(out.split("\n\n")[0]).toBe("#smallBusiness");
  });
  it("supports lowercase and capitalized styles", () => {
    expect(textOf(generateHashtags, { keywords: "free tools", style: "lowercase" }).split("\n")[0]).toBe("#freetools");
    expect(textOf(generateHashtags, { keywords: "free tools", style: "capitalized" }).split("\n")[0]).toBe("#FreeTools");
  });
  it("rejects empty keywords", () => {
    expect(generateHashtags({ keywords: "", style: "camelCase" })).toHaveProperty("error");
  });
});

describe("generateSerpSnippet", () => {
  it("shows breadcrumb and OK verdicts for short text", () => {
    const out = textOf(generateSerpSnippet, { title: "Short Title", description: "A short description.", url: "https://x.in/blog/post" });
    expect(out).toContain("x.in › blog › post");
    expect(out).toMatch(/Title: 11\/60 characters — OK/);
  });
  it("truncates and flags overly long title/description", () => {
    const longTitle = "A".repeat(70);
    const out = textOf(generateSerpSnippet, { title: longTitle, description: "d", url: "x.in" });
    expect(out).toContain("TOO LONG");
    expect(out.split("\n")[1].endsWith("…")).toBe(true);
  });
});

describe("generateRobotsTxt", () => {
  it("allows all by default", () => {
    expect(textOf(generateRobotsTxt, { mode: "allow" })).toBe("User-agent: *\nDisallow:");
  });
  it("blocks all", () => {
    expect(textOf(generateRobotsTxt, { mode: "block" })).toBe("User-agent: *\nDisallow: /");
  });
  it("builds custom disallow paths and appends sitemap", () => {
    const out = textOf(generateRobotsTxt, { mode: "custom", disallow: "/admin\ncart", sitemap: "https://x.in/sitemap.xml" });
    expect(out).toContain("Disallow: /admin");
    expect(out).toContain("Disallow: /cart");
    expect(out).toContain("Sitemap: https://x.in/sitemap.xml");
  });
  it("rejects custom mode with no paths", () => {
    expect(generateRobotsTxt({ mode: "custom", disallow: "" })).toHaveProperty("error");
  });
});

describe("computeKeywordDensity", () => {
  it("counts whole-word occurrences and computes density", () => {
    const r = resultMap(computeKeywordDensity, { content: "cat cat dog cat", keyword: "cat" });
    expect(r.get("Keyword occurrences")).toBe("3");
    expect(r.get("Keyword density")).toBe("75.00%");
  });
  it("rejects empty content or keyword", () => {
    expect(computeKeywordDensity({ content: "", keyword: "x" })).toHaveProperty("error");
  });
});

describe("analyzeHeadline", () => {
  it("scores a headline with a number and power word highly", () => {
    const r = resultMap(analyzeHeadline, { headline: "7 Proven Ways to Save on GST Filing This Year" });
    expect(r.get("Contains a number")).toBe("Yes");
    expect(r.get("Contains a power word")).toBe("Yes");
  });
  it("rejects empty input", () => {
    expect(analyzeHeadline({ headline: "" })).toHaveProperty("error");
  });
});

describe("testSubjectLine", () => {
  it("flags spam triggers and all-caps", () => {
    const r = resultMap(testSubjectLine, { subject: "ACT NOW - guarantee your FREE!!! prize" });
    expect(Number(r.get("Spam trigger phrases"))).toBeGreaterThan(0);
    expect(Number(r.get("ALL-CAPS words"))).toBeGreaterThan(0);
  });
  it("detects personalization", () => {
    const r = resultMap(testSubjectLine, { subject: "Your invoice is ready" });
    expect(r.get("Personalization (you/your)")).toBe("Yes");
  });
  it("rejects empty input", () => {
    expect(testSubjectLine({ subject: "" })).toHaveProperty("error");
  });
});

describe("computeRoas", () => {
  it("computes ROAS ratio and profit", () => {
    const r = resultMap(computeRoas, { spend: "10000", revenue: "45000" });
    expect(r.get("ROAS")).toBe("4.50x");
    expect(r.get("Net revenue after ad spend")).toBe("₹35,000.00");
  });
  it("flags a losing campaign", () => {
    const r = resultMap(computeRoas, { spend: "10000", revenue: "5000" });
    expect(r.get("Verdict")).toMatch(/Losing money/);
  });
});

describe("computeCpm", () => {
  it("computes CPM from cost and impressions", () => {
    const r = resultMap(computeCpm, { cost: "500", impressions: "100000" });
    expect(r.get("CPM (cost per 1,000 impressions)")).toBe("₹5.00");
  });
  it("computes CPC and CTR when both impressions and clicks given", () => {
    const r = resultMap(computeCpm, { cost: "1000", impressions: "50000", clicks: "500" });
    expect(r.get("CPC (cost per click)")).toBe("₹2.00");
    expect(r.get("CTR (click-through rate)")).toBe("1.00%");
  });
  it("errors when neither impressions nor clicks given", () => {
    expect(computeCpm({ cost: "1000" })).toHaveProperty("error");
  });
});

describe("computeEngagementRate", () => {
  it("computes per-post engagement rate", () => {
    const r = resultMap(computeEngagementRate, { engagements: "500", followers: "10000", posts: "5" });
    expect(r.get("Engagement rate per post")).toBe("1.00%");
    expect(r.get("Benchmark verdict")).toMatch(/Average/);
  });
  it("rejects zero followers", () => {
    expect(computeEngagementRate({ engagements: "10", followers: "0", posts: "1" })).toHaveProperty("error");
  });
});
