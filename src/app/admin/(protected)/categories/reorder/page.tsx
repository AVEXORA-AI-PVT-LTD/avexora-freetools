import { requireAdminAuth } from "@/server/admin-auth";
import { getAllCategoriesWithConfig } from "@/server/categories";
import Link from "next/link";
import { CategoryReorderClient } from "./CategoryReorderClient";

export const metadata = {
  title: "Reorder Categories | Admin",
};

export default async function CategoryReorderPage() {
  await requireAdminAuth("tools.reorder"); // Categories reorder uses similar permission or categories.edit

  const categories = await getAllCategoriesWithConfig();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link 
          href="/admin/categories"
          className="inline-flex items-center justify-center p-2 -ml-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors"
          title="Back to Categories"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <h1 className="text-2xl font-semibold text-slate-900">Reorder Categories</h1>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <CategoryReorderClient categories={categories} />
      </div>
    </div>
  );
}
