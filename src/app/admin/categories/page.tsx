import { requireAdminAuth } from "@/server/admin-auth";
import { getAllCategoriesWithConfig } from "@/server/categories";
import { CategoryToggle } from "@/components/admin/CategoryToggle";
import Link from "next/link";

export default async function AdminCategoriesPage() {
  await requireAdminAuth("categories.view");

  const effectiveCategories = await getAllCategoriesWithConfig();

  return (
    <div>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">Categories</h1>
          <p className="text-zinc-500 mt-2">Manage tool categories and their visibility.</p>
        </div>
        <Link
          href="/admin/categories/reorder"
          className="inline-flex justify-center items-center px-4 py-2 bg-slate-900 text-white rounded-md text-sm font-medium hover:bg-slate-800 transition-colors"
        >
          Reorder Categories
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 text-sm font-medium">
              <th className="px-6 py-4">Category Name</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {effectiveCategories.map((cat) => (
              <tr key={cat.slug} className="hover:bg-zinc-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-medium text-zinc-900">{cat.name}</div>
                  <div className="text-xs text-zinc-400 font-mono mt-0.5">{cat.slug}</div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                      cat.status
                        ? "bg-green-50 text-green-700 ring-green-600/20"
                        : "bg-zinc-50 text-zinc-600 ring-zinc-500/10"
                    }`}
                  >
                    {cat.status ? "Active" : "Disabled"}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <CategoryToggle slug={cat.slug} initialStatus={cat.status} />
                </td>
              </tr>
            ))}
            {effectiveCategories.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-zinc-500">
                  No categories found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
