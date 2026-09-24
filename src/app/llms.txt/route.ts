import { SITE_NAME, SITE_URL } from "@/tools/categories";
import { getEffectiveCategories } from "@/server/categories";
import { getEffectiveToolsByCategory } from "@/server/tools";

// Follows the llms.txt convention (https://llmstxt.org/) so AI crawlers and
// answer engines can discover the tool catalog without guessing from HTML.
// Reads through the effective (DB-overridable) data layer so tools added or
// edited via the admin panel show up here too, not just the static registry.
export async function GET() {
  const [categories, toolsByCategory] = await Promise.all([
    getEffectiveCategories(),
    getEffectiveToolsByCategory(),
  ]);

  const lines: string[] = [];

  lines.push(`# ${SITE_NAME}`);
  lines.push("");
  lines.push(
    `> ${SITE_NAME}, by Avexora, provides practical online business tools — free calculators, generators, PDF & image utilities and AI writing tools for Indian businesses — GST, EMI, HR/payroll, invoicing, legal and marketing tools included. No sign-up, no cost. Built by Avexora, makers of Enterprise Business OS (EBOS).`,
  );
  lines.push("");
  lines.push(`Site: ${SITE_URL}`);
  lines.push("");
  lines.push("## Important Pages");
  lines.push("");
  lines.push(`- Homepage — ${SITE_URL}`);
  lines.push(`- Brand Studio — ${SITE_URL}/studio`);
  lines.push(`- Pricing — ${SITE_URL}/studio/pricing`);
  lines.push("");

  for (const category of categories) {
    const tools = toolsByCategory[category.slug] || [];
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
