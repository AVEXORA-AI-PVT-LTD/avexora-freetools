import { requireAdminAuth } from "@/server/admin-auth";
import { getEffectiveCategories } from "@/server/categories";
import { getAllToolsWithConfig } from "@/server/tools";
import { redirect } from "next/navigation";
import { ToolReorderClient } from "./ToolReorderClient";

export const metadata = {
  title: "Reorder Tools | Admin",
};

export default async function ToolReorderPage() {
  const user = await requireAdminAuth();
  if (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN") {
    redirect("/studio/app");
  }

  const categories = await getEffectiveCategories();
  const allTools = await getAllToolsWithConfig();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Reorder Tools</h1>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <ToolReorderClient categories={categories} tools={allTools} />
      </div>
    </div>
  );
}
