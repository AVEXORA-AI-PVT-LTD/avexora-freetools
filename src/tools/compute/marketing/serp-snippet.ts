import type { GenerateFn } from "@/tools/types";

const TITLE_LIMIT = 60;
const DESC_LIMIT = 160;

function truncate(text: string, limit: number): string {
  if (text.length <= limit) return text;
  return `${text.slice(0, limit).trimEnd()}…`;
}

export const generateSerpSnippet: GenerateFn = (values) => {
  const title = typeof values.title === "string" ? values.title.trim() : "";
  const description = typeof values.description === "string" ? values.description.trim() : "";
  const rawUrl = typeof values.url === "string" ? values.url.trim() : "";

  if (!title) return { error: "Enter a page title." };
  if (!description) return { error: "Enter a meta description." };
  if (!rawUrl) return { error: "Enter the page URL." };

  let parsed: URL;
  try {
    parsed = new URL(/^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`);
  } catch {
    return { error: "Enter a valid URL, e.g. https://example.com/blog/post." };
  }

  const pathParts = parsed.pathname.split("/").filter((p) => p.length > 0);
  const breadcrumb = [parsed.hostname, ...pathParts].join(" › ");

  const titleVerdict = title.length <= TITLE_LIMIT ? "OK" : "TOO LONG";
  const descVerdict = description.length <= DESC_LIMIT ? "OK" : "TOO LONG";

  return {
    text: [
      breadcrumb,
      truncate(title, TITLE_LIMIT),
      truncate(description, DESC_LIMIT),
      "",
      `Title: ${title.length}/${TITLE_LIMIT} characters — ${titleVerdict}`,
      `Description: ${description.length}/${DESC_LIMIT} characters — ${descVerdict}`,
    ].join("\n"),
  };
};
