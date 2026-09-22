import { requireAdminAuth } from "@/server/admin-auth";
import { prisma } from "@/server/db";
import { allTools } from "@/tools/registry";
import { SeoToolsClient } from "./SeoToolsClient";

export const metadata = { title: "Tool SEO Management | Admin" };

export default async function SeoToolsPage() {
  await requireAdminAuth("seo.view");

  const configs = await prisma.toolConfig.findMany({
    select: { toolSlug: true, categorySlug: true, seoMetadata: true }
  });

  const merged = allTools.map(t => {
    const override = configs.find(c => c.toolSlug === t.slug)?.seoMetadata as any;
    return {
      name: t.name,
      slug: t.slug,
      category: t.category,
      hasOverride: !!override && Object.keys(override).length > 0,
      seoTitle: override?.title || t.name,
      seoDescription: override?.description || t.seoDescription,
      canonical: override?.canonical || "",
      robotsIndex: override?.robotsIndex !== false
    };
  });

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Tool SEO Override</h1>
        <p className="mt-1 text-slate-600">Manage individual SEO metadata for every tool to override the default generation.</p>
      </div>

      <SeoToolsClient tools={merged} />
    </div>
  );
}
