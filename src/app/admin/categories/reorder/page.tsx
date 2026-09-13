import { requireAdminAuth } from "@/server/admin-auth";
import { getAllCategoriesWithConfig } from "@/server/categories";
import { redirect } from "next/navigation";
import { CategoryReorderClient } from "./CategoryReorderClient";

export const metadata = {
  title: "Reorder Categories | Admin",
};

export default async function CategoryReorderPage() {
  const user = await requireAdminAuth();
  if (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN") {
    redirect("/studio/app");
  }

  const categories = await getAllCategoriesWithConfig();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Reorder Categories</h1>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <CategoryReorderClient categories={categories} />
      </div>
    </div>
  );
}
