import { categories, SITE_NAME, SITE_URL } from "@/tools/categories";
import { toolsByCategory } from "@/tools/registry";

// Follows the llms.txt convention (https://llmstxt.org/) so AI crawlers and
// answer engines can discover the tool catalog without guessing from HTML.
export function GET() {
  const lines: string[] = [];

  lines.push(`# ${SITE_NAME}`);
  lines.push("");
  lines.push(
    `> Free calculators, generators, PDF & image utilities and AI writing tools for Indian businesses — GST, EMI, HR/payroll, invoicing, legal and marketing tools included. No sign-up, no cost. Built by Avexora, makers of Enterprise Business OS (EBOS).`,
  );
  lines.push("");
  lines.push(`Site: ${SITE_URL}`);
  lines.push("");

  for (const category of categories) {
    const tools = toolsByCategory[category.slug];
    if (tools.length === 0) continue;
    lines.push(`## ${category.name}`);
    lines.push("");
    for (const tool of tools) {
      const url = `${SITE_URL}/${category.slug}/${tool.slug}`;
      lines.push(`- [${tool.name}](${url}): ${tool.tagline}`);
    }
    lines.push("");
  }

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
