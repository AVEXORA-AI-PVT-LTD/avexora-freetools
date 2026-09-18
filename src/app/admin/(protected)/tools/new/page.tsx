import { requireAdminAuth } from "@/server/admin-auth";
import { getAllCategoriesWithConfig } from "@/server/categories";
import { NewToolForm } from "./NewToolForm";
import Link from "next/link";

export const metadata = {
  title: "Add New Tool | Admin",
};

export default async function AddNewToolPage() {
  await requireAdminAuth("tools.create");
  const categories = await getAllCategoriesWithConfig();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Add New Tool</h1>
        <Link
          href="/admin/tools"
          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm"
        >
          Cancel
        </Link>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <NewToolForm categories={categories.map(c => ({ slug: c.slug, name: c.name }))} />
      </div>
    </div>
  );
}
