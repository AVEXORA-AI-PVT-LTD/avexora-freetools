import { categories, SITE_URL } from "@/tools/categories";
import { allTools } from "@/tools/registry";

export const dynamic = "force-static";

export async function GET() {
  let content = `# Avexora Tools\n`;
  content += `Avexora Tools, by Avexora, provides practical online business tools such as calculators, generators, PDF utilities, image utilities, AI writing tools, developer/web utilities, HR/payroll tools, finance tools, invoicing/billing tools, and business/legal utilities for everyday work.\n\n`;

  content += `## Main Categories\n`;
  categories.forEach((cat) => {
    content += `- ${cat.name} — ${SITE_URL}/${cat.slug}\n`;
  });

  content += `\n## Important Pages\n`;
  content += `- Homepage — ${SITE_URL}\n`;
  content += `- Brand Studio — ${SITE_URL}/studio\n`;
  content += `- Pricing — ${SITE_URL}/studio/pricing\n`;

  content += `\n## Tool Directory\n`;
  allTools.forEach((tool) => {
    content += `- ${tool.name} — ${SITE_URL}/${tool.category}/${tool.slug}\n`;
  });

  return new Response(content.trim() + "\n", {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
