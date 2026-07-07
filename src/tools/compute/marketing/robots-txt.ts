import type { GenerateFn } from "@/tools/types";
import { toNumber } from "../format";

export const generateRobotsTxt: GenerateFn = (values) => {
  const mode = typeof values.mode === "string" ? values.mode : "allow";
  const sitemap = typeof values.sitemap === "string" ? values.sitemap.trim() : "";
  const disallowRaw = typeof values.disallow === "string" ? values.disallow : "";
  const crawlDelay = toNumber(values.crawlDelay);

  if (sitemap && !/^https?:\/\//i.test(sitemap)) {
    return { error: "Sitemap URL must start with http:// or https://." };
  }
  if (values.crawlDelay !== undefined && values.crawlDelay !== "" && (crawlDelay === null || crawlDelay <= 0)) {
    return { error: "Crawl-delay must be a positive number of seconds (or left empty)." };
  }

  const lines: string[] = ["User-agent: *"];

  if (mode === "block") {
    lines.push("Disallow: /");
  } else if (mode === "custom") {
    const paths = disallowRaw
      .split("\n")
      .map((p) => p.trim())
      .filter((p) => p.length > 0)
      .map((p) => (p.startsWith("/") ? p : `/${p}`));
    if (paths.length === 0) {
      return { error: "Custom mode needs at least one disallow path (one per line, e.g. /admin)." };
    }
    for (const path of paths) lines.push(`Disallow: ${path}`);
  } else {
    lines.push("Disallow:");
  }

  if (crawlDelay !== null && crawlDelay > 0) {
    lines.push(`Crawl-delay: ${crawlDelay}`);
  }
  if (sitemap) {
    lines.push("", `Sitemap: ${sitemap}`);
  }

  return { text: lines.join("\n"), filename: "robots.txt" };
};
