import { requireAdminAuth } from "@/server/admin-auth";
import { prisma } from "@/server/db";
import { RobotsForm } from "./RobotsForm";
import { SITE_URL } from "@/tools/categories";

export const metadata = { title: "Robots.txt | Admin" };

export default async function RobotsPage() {
  await requireAdminAuth("seo.view");
  
  const existing = await prisma.contentBlock.findUnique({
    where: { key: "robots_txt" }
  });

  const defaultContent = `User-Agent: *\nAllow: /\nDisallow: /api/\nDisallow: /admin/\n\nSitemap: ${SITE_URL}/sitemap.xml`;
  const content = existing?.value || defaultContent;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Robots.txt Rules</h1>
        <p className="mt-1 text-slate-600">Configure crawler access rules. Use cautiously to avoid de-indexing public pages.</p>
      </div>

      <RobotsForm initialContent={content} defaultContent={defaultContent} />
    </div>
  );
}
