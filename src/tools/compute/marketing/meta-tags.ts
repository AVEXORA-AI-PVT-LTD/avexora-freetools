import type { GenerateFn } from "@/types/tools";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export const generateMetaTags: GenerateFn = (values) => {
  const title = str(values.title);
  const description = str(values.description);
  const canonical = str(values.canonical);
  const ogImage = str(values.ogImage);
  const siteName = str(values.siteName);
  const twitterCard = values.twitterCard === "summary" ? "summary" : "summary_large_image";

  if (!title) return { error: "Enter a page title." };
  if (!description) return { error: "Enter a meta description." };
  if (canonical && !/^https?:\/\//i.test(canonical)) {
    return { error: "Canonical URL must start with http:// or https://." };
  }
  if (ogImage && !/^https?:\/\//i.test(ogImage)) {
    return { error: "OG image URL must start with http:// or https://." };
  }

  const lines: string[] = [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}" />`,
  ];
  if (canonical) lines.push(`<link rel="canonical" href="${esc(canonical)}" />`);

  lines.push("", "<!-- Open Graph -->");
  lines.push(`<meta property="og:type" content="website" />`);
  lines.push(`<meta property="og:title" content="${esc(title)}" />`);
  lines.push(`<meta property="og:description" content="${esc(description)}" />`);
  if (canonical) lines.push(`<meta property="og:url" content="${esc(canonical)}" />`);
  if (ogImage) lines.push(`<meta property="og:image" content="${esc(ogImage)}" />`);
  if (siteName) lines.push(`<meta property="og:site_name" content="${esc(siteName)}" />`);

  lines.push("", "<!-- Twitter Card -->");
  lines.push(`<meta name="twitter:card" content="${twitterCard}" />`);
  lines.push(`<meta name="twitter:title" content="${esc(title)}" />`);
  lines.push(`<meta name="twitter:description" content="${esc(description)}" />`);
  if (ogImage) lines.push(`<meta name="twitter:image" content="${esc(ogImage)}" />`);

  return { text: lines.join("\n"), filename: "meta-tags.html" };
};
