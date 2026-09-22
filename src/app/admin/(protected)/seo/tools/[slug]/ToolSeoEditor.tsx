"use client";
import { useState, useTransition } from "react";
import { updateToolSeo } from "../../actions";
import { useDialog } from "@/components/admin/DialogProvider";
import { Save } from "lucide-react";

export function ToolSeoEditor({ tool, initialData, siteUrl }: { tool: any, initialData: any, siteUrl: string }) {
  const [data, setData] = useState(initialData);
  const [isPending, startTransition] = useTransition();
  const { showAlert } = useDialog();

  const update = (field: string, value: any) => setData((prev: any) => ({ ...prev, [field]: value }));

  const handleSave = () => {
    startTransition(async () => {
      try {
        await updateToolSeo(tool.slug, tool.category, data);
        showAlert("Success", "Tool SEO updated successfully.");
      } catch (e: any) {
        showAlert("Error", e.message || "Failed to update.");
      }
    });
  };

  const previewTitle = data.title || `${tool.name} — Avexora`;
  const previewDesc = data.description || tool.seoDescription || tool.description || "";
  const previewUrl = data.canonical || `${siteUrl}/${tool.category}/${tool.slug}`;

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-1 space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
          <h3 className="font-semibold text-slate-900 border-b pb-2">Primary Metadata</h3>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">SEO Title</label>
            <input type="text" value={data.title || ""} onChange={e => update("title", e.target.value)} className="w-full border-slate-300 rounded-md py-2 px-3 text-sm focus:ring-orange-500" placeholder={tool.name} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Meta Description</label>
            <textarea rows={3} value={data.description || ""} onChange={e => update("description", e.target.value)} className="w-full border-slate-300 rounded-md py-2 px-3 text-sm focus:ring-orange-500" placeholder={tool.seoDescription} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Canonical URL</label>
            <input type="text" value={data.canonical || ""} onChange={e => update("canonical", e.target.value)} className="w-full border-slate-300 rounded-md py-2 px-3 text-sm focus:ring-orange-500" placeholder={`${siteUrl}/${tool.category}/${tool.slug}`} />
          </div>
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={data.robotsIndex === false} onChange={e => update("robotsIndex", !e.target.checked)} className="rounded text-orange-600 focus:ring-orange-600 border-slate-300" />
              <span className="text-sm font-medium text-slate-900">NoIndex (Hide from Search Engines)</span>
            </label>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
          <h3 className="font-semibold text-slate-900 border-b pb-2">Social / Open Graph</h3>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">OG Title</label>
            <input type="text" value={data.ogTitle || ""} onChange={e => update("ogTitle", e.target.value)} className="w-full border-slate-300 rounded-md py-2 px-3 text-sm focus:ring-orange-500" placeholder="Defaults to SEO Title" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">OG Image URL</label>
            <input type="text" value={data.ogImage || ""} onChange={e => update("ogImage", e.target.value)} className="w-full border-slate-300 rounded-md py-2 px-3 text-sm focus:ring-orange-500" placeholder="Image URL for social sharing" />
          </div>
        </div>

        <div className="flex justify-end">
          <button onClick={handleSave} disabled={isPending} className="flex items-center gap-2 px-6 py-2 bg-orange-600 text-white font-medium rounded-md hover:bg-orange-700 disabled:opacity-50">
            <Save className="w-4 h-4" /> Save SEO Override
          </button>
        </div>
      </div>

      <div className="w-full lg:w-96 flex-shrink-0 space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
          <h3 className="font-semibold text-slate-900 border-b pb-2">Live Google SERP Preview</h3>
          <div className="bg-white p-4 rounded-md border border-slate-100 shadow-sm">
            <div className="text-sm text-slate-700 truncate mb-1">{previewUrl}</div>
            <div className="text-xl text-blue-800 hover:underline cursor-pointer truncate mb-1">{previewTitle}</div>
            <div className="text-sm text-slate-600 line-clamp-2">{previewDesc}</div>
          </div>
          <p className="text-xs text-slate-500 mt-2">This is an approximate preview of how this page might appear in Google search results.</p>
        </div>
      </div>
    </div>
  );
}
