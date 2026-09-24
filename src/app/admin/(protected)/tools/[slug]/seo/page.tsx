import { requireAdminAuth } from "@/server/admin-auth";
import { getTool } from "@/tools/registry";
import { notFound } from "next/navigation";
import { getToolSeoOverride, type SeoMetadata } from "@/server/seo-manager";
import { SITE_URL } from "@/tools/categories";
import { SeoEditor } from "@/components/admin/SeoEditor";
import { updateToolSeo, resetToolSeo } from "@/app/admin/(protected)/seo/actions";
import Link from "next/link";

export default async function ToolSeoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireAdminAuth("seo.view");
  const { slug } = await params;
  
  const tool = getTool(slug);
  if (!tool) notFound();

  const seoOverride = await getToolSeoOverride(slug);
  const fallbackUrl = `${SITE_URL}/${tool.category}/${tool.slug}`;

  // Server actions wrapped for the client
  const handleSave = async (data: Partial<SeoMetadata>) => {
    "use server";
    await updateToolSeo(slug, tool.category, data);
  };

  const handleReset = async () => {
    "use server";
    await resetToolSeo(slug, tool.category);
  };

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/admin/tools" className="text-orange-600 text-sm hover:underline mb-2 inline-block">← Back to Tools</Link>
          <h1 className="text-2xl font-bold">SEO settings for &quot;{tool.name}&quot;</h1>
        </div>
        <a href={`/${tool.category}/${tool.slug}`} target="_blank" rel="noopener" className="px-3 py-1.5 border rounded-md text-sm hover:bg-slate-50">View Live</a>
      </div>
      
      <SeoEditor 
        initialData={seoOverride} 
        fallbackUrl={fallbackUrl} 
        onSave={handleSave} 
        onReset={handleReset} 
      />
    </div>
  );
}
