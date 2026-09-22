import { requireAdminAuth } from "@/server/admin-auth";
import { getGlobalSeoOverride } from "@/server/seo-manager";
import { GlobalSeoForm } from "./GlobalSeoForm";

export const metadata = { title: "Global SEO | Admin" };

export default async function GlobalSeoPage() {
  await requireAdminAuth("seo.view");
  
  const seo = await getGlobalSeoOverride();

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Global SEO Configuration</h1>
        <p className="mt-1 text-slate-600">These settings act as the ultimate fallback if a specific tool or category lacks custom SEO metadata.</p>
      </div>

      <GlobalSeoForm initialData={seo || {}} />
    </div>
  );
}
