"use client";
import { useState } from "react";
import Link from "next/link";
import { Search, Filter, Edit, ExternalLink } from "lucide-react";
import { resetToolSeo } from "../actions";
import { useDialog } from "@/components/admin/DialogProvider";

export function SeoToolsClient({ tools }: { tools: any[] }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const { showConfirm, showAlert } = useDialog();

  const filtered = tools.filter(t => {
    const mSearch = t.name.toLowerCase().includes(search.toLowerCase()) || t.slug.toLowerCase().includes(search.toLowerCase());
    const mFilter = filter === "ALL" 
      ? true 
      : filter === "OVERRIDE" 
        ? t.hasOverride 
        : filter === "NOINDEX"
          ? !t.robotsIndex
          : true;
    return mSearch && mFilter;
  });

  const handleReset = (slug: string, cat: string) => {
    showConfirm("Reset SEO", `Remove all SEO overrides for ${slug}?`, async () => {
      try {
        await resetToolSeo(slug, cat);
        showAlert("Success", "SEO reset to defaults.");
      } catch (e: any) {
        showAlert("Error", e.message || "Failed to reset.");
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input type="text" placeholder="Search tools..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 border-slate-300 rounded-md py-2 focus:ring-orange-500" />
        </div>
        <select value={filter} onChange={e => setFilter(e.target.value)} className="border-slate-300 rounded-md py-2 px-4 focus:ring-orange-500 bg-white">
          <option value="ALL">All Tools</option>
          <option value="OVERRIDE">Custom SEO</option>
          <option value="NOINDEX">NoIndex</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Tool Name & Slug</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">SEO Override</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Index Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filtered.map(t => (
              <tr key={t.slug} className="hover:bg-slate-50">
                <td className="px-6 py-4">
                  <div className="font-medium text-slate-900">{t.name}</div>
                  <div className="text-sm text-slate-500">/{t.slug}</div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">{t.category}</td>
                <td className="px-6 py-4">
                  {t.hasOverride ? (
                    <span className="inline-flex rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">Custom</span>
                  ) : (
                    <span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">Default</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {t.robotsIndex ? (
                    <span className="inline-flex rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">Index</span>
                  ) : (
                    <span className="inline-flex rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700">NoIndex</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <Link href={`/admin/seo/tools/${t.slug}`} className="inline-flex p-1.5 text-slate-400 hover:text-orange-600" title="Edit SEO">
                    <Edit className="w-4 h-4" />
                  </Link>
                  <a href={`/${t.category}/${t.slug}`} target="_blank" className="inline-flex p-1.5 text-slate-400 hover:text-blue-600" title="Preview">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
