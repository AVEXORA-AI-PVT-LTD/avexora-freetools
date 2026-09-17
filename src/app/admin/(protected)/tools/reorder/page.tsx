import { requireAdminAuth } from "@/server/admin-auth";
import { getAdminToolsData } from "@/server/admin-tools";
import Link from "next/link";
import { ToolReorderClient } from "./ToolReorderClient";
import { getCategory } from "@/tools/categories";

export const metadata = {
  title: "Reorder Tools | Admin",
};

export default async function ToolReorderPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  await requireAdminAuth("tools.edit");

  const { category } = await searchParams;
  if (!category) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-4">Reorder Tools</h1>
        <p className="text-red-600">Please select a category first to reorder its tools.</p>
        <Link href="/admin/tools" className="mt-4 inline-block text-orange-600 hover:underline">Back to Tools</Link>
      </div>
    );
  }

  const catObj = getCategory(category);
  const catName = catObj ? catObj.name : category;

  // Fetch tools for this category
  const allTools = await getAdminToolsData();
  const catTools = allTools
    .filter(t => t.category === category)
    .map(t => ({
      name: t.name,
      slug: t.slug,
      category: t.category,
      displayOrder: (t as any).displayOrder || t.priority || 999
    }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link 
          href={`/admin/tools?category=${category}`}
          className="inline-flex items-center justify-center p-2 -ml-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors"
          title="Back to Tools"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <h1 className="text-2xl font-semibold text-slate-900">Reorder Tools in {catName}</h1>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <ToolReorderClient initialTools={catTools} />
      </div>
    </div>
  );
}
