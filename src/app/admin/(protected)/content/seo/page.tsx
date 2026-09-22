import { requireAdminAuth } from "@/server/admin-auth";
import { getGlobalSeoOverride } from "@/server/seo-manager";
import { SITE_URL, SITE_NAME } from "@/tools/categories";
import { SeoEditor } from "@/components/admin/SeoEditor";
import { updateGlobalSeo, resetGlobalSeo } from "@/app/admin/(protected)/seo/actions";
import Link from "next/link";

export default async function GlobalSeoPage() {
  await requireAdminAuth("seo.view");

  const seoOverride = await getGlobalSeoOverride();
  const fallbackUrl = SITE_URL;

  const handleSave = async (data: any) => {
    "use server";
    await updateGlobalSeo(data);
  };

  const handleReset = async () => {
    "use server";
    await resetGlobalSeo();
  };

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/admin/content" className="text-orange-600 text-sm hover:underline mb-2 inline-block">← Back to Content</Link>
          <h1 className="text-2xl font-bold">Global SEO Defaults</h1>
          <p className="text-sm text-slate-500">Applied across the site when a page doesn't have a specific override.</p>
        </div>
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
