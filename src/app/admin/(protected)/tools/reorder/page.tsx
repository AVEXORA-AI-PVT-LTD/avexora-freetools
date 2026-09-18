import { requireAdminAuth } from "@/server/admin-auth";
import { getEffectiveCategories } from "@/server/categories";
import { getAllToolsWithConfig } from "@/server/tools";
import Link from "next/link";
import { ToolReorderClient } from "./ToolReorderClient";

export const metadata = {
  title: "Reorder Tools | Admin",
};

export default async function ToolReorderPage() {
  await requireAdminAuth("tools.reorder");

  const categories = await getEffectiveCategories();
  const allTools = await getAllToolsWithConfig();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link 
          href="/admin/tools"
          className="inline-flex items-center justify-center p-2 -ml-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors"
          title="Back to Tools"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <h1 className="text-2xl font-semibold text-slate-900">Reorder Tools</h1>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <ToolReorderClient categories={categories} tools={allTools} />
      </div>
    </div>
  );
}
