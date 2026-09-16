import { requireAdminAuth } from "@/server/admin-auth";
import { getCategory } from "@/tools/categories";
import { notFound } from "next/navigation";
import { getCategorySeoOverride } from "@/server/seo-manager";
import { SITE_URL } from "@/tools/categories";
import { SeoEditor } from "@/components/admin/SeoEditor";
import { updateCategorySeo, resetCategorySeo } from "@/app/admin/(protected)/seo/actions";
import Link from "next/link";

export default async function CategorySeoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireAdminAuth("seo.view");
  const { slug } = await params;
  
  const category = getCategory(slug);
  if (!category) notFound();

  const seoOverride = await getCategorySeoOverride(slug);
  const fallbackUrl = `${SITE_URL}/${category.slug}`;

  const handleSave = async (data: any) => {
    "use server";
    await updateCategorySeo(slug, data);
  };

  const handleReset = async () => {
    "use server";
    await resetCategorySeo(slug);
  };

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/admin/categories" className="text-orange-600 text-sm hover:underline mb-2 inline-block">← Back to Categories</Link>
          <h1 className="text-2xl font-bold">SEO settings for "{category.name}"</h1>
        </div>
        <a href={`/${category.slug}`} target="_blank" rel="noopener" className="px-3 py-1.5 border rounded-md text-sm hover:bg-slate-50">View Live</a>
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
