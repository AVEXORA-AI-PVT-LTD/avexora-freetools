import type { GenerateFn } from "@/types/tools";

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

  // A URL fragment (#...) must always remain at the very end of the final URL.
  // Split it off first so the UTM query parameters are inserted before it and
  // are never swallowed into the fragment.
  const hashIndex = baseUrl.indexOf("#");
  const fragment = hashIndex >= 0 ? baseUrl.slice(hashIndex) : "";
  const url = new URL(hashIndex >= 0 ? baseUrl.slice(0, hashIndex) : baseUrl);

  const existing = url.search ? url.search.slice(1) : "";
  const joined = existing ? `${existing}&${params.join("&")}` : params.join("&");
  return { text: `${url.origin}${url.pathname}?${joined}${fragment}` };
};
