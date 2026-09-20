"use client";

import { useState, useTransition } from "react";
import { updateGlobalSeo } from "../actions";
import { useDialog } from "@/components/admin/DialogProvider";
import { Save } from "lucide-react";

export function GlobalSeoForm({ initialData }: { initialData: any }) {
  const [data, setData] = useState(initialData);
  const [isPending, startTransition] = useTransition();
  const { showAlert } = useDialog();

  const update = (field: string, value: any) => setData((prev: any) => ({ ...prev, [field]: value }));

  const handleSave = () => {
    startTransition(async () => {
      try {
        await updateGlobalSeo(data);
        showAlert("Success", "Global SEO defaults saved successfully.");
      } catch (e: any) {
        showAlert("Error", e.message || "Failed to save.");
      }
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="font-semibold text-slate-900 border-b pb-2">Default Metadata</h3>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Default Meta Title</label>
            <input type="text" value={data.title || ""} onChange={e => update("title", e.target.value)} className="w-full border-slate-300 rounded-md py-2 px-3 text-sm focus:ring-orange-500" placeholder="e.g. Free Online Tools | Avexora" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Default Meta Description</label>
            <textarea rows={3} value={data.description || ""} onChange={e => update("description", e.target.value)} className="w-full border-slate-300 rounded-md py-2 px-3 text-sm focus:ring-orange-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Canonical Base URL</label>
            <input type="text" value={data.canonical || ""} onChange={e => update("canonical", e.target.value)} className="w-full border-slate-300 rounded-md py-2 px-3 text-sm focus:ring-orange-500" placeholder="https://tools.avexora.in" />
            <p className="text-xs text-slate-500 mt-1">IMPORTANT: Do not use legacy domains. Must be your primary domain.</p>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-slate-900 border-b pb-2">Open Graph & Social</h3>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Default OG Image URL</label>
            <input type="text" value={data.ogImage || ""} onChange={e => update("ogImage", e.target.value)} className="w-full border-slate-300 rounded-md py-2 px-3 text-sm focus:ring-orange-500" placeholder="https://..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Default OG Title</label>
            <input type="text" value={data.ogTitle || ""} onChange={e => update("ogTitle", e.target.value)} className="w-full border-slate-300 rounded-md py-2 px-3 text-sm focus:ring-orange-500" placeholder="Leave blank to use Meta Title" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Twitter Card Type</label>
            <select value={data.twitterCard || "summary_large_image"} onChange={e => update("twitterCard", e.target.value)} className="w-full border-slate-300 rounded-md py-2 px-3 text-sm focus:ring-orange-500">
              <option value="summary_large_image">Summary Large Image</option>
              <option value="summary">Summary</option>
            </select>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t flex justify-end">
        <button onClick={handleSave} disabled={isPending} className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white font-medium rounded-md hover:bg-orange-700 disabled:opacity-50">
          <Save className="w-4 h-4" /> Save Global Configuration
        </button>
      </div>
    </div>
  );
}
