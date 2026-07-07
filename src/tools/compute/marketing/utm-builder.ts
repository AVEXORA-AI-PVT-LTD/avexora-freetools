import type { GenerateFn } from "@/tools/types";

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export const buildUtmUrl: GenerateFn = (values) => {
  const baseUrl = str(values.url);
  const source = str(values.source);
  const medium = str(values.medium);
  const campaign = str(values.campaign);
  const term = str(values.term);
  const content = str(values.content);

  if (!baseUrl) return { error: "Enter the destination URL." };
  if (!/^https?:\/\//i.test(baseUrl)) {
    return { error: "The URL must start with http:// or https://." };
  }
  try {
    new URL(baseUrl);
  } catch {
    return { error: "Enter a valid URL, e.g. https://example.com/page." };
  }
  if (!source) return { error: "Enter utm_source (e.g. google, newsletter)." };
  if (!medium) return { error: "Enter utm_medium (e.g. cpc, email, social)." };
  if (!campaign) return { error: "Enter utm_campaign (e.g. diwali-sale)." };

  const params: string[] = [
    `utm_source=${encodeURIComponent(source)}`,
    `utm_medium=${encodeURIComponent(medium)}`,
    `utm_campaign=${encodeURIComponent(campaign)}`,
  ];
  if (term) params.push(`utm_term=${encodeURIComponent(term)}`);
  if (content) params.push(`utm_content=${encodeURIComponent(content)}`);

  const separator = baseUrl.includes("?") ? "&" : "?";
  return { text: `${baseUrl}${separator}${params.join("&")}` };
};
