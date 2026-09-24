"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { SeoMetadata } from "@/server/seo-manager";

type SeoEditorProps = {
  initialData: SeoMetadata | null;
  onSave: (data: Partial<SeoMetadata>) => Promise<void>;
  onReset: () => Promise<void>;
  fallbackUrl: string;
};

export function SeoEditor({ initialData, onSave, onReset, fallbackUrl }: SeoEditorProps) {
  const [formData, setFormData] = useState<Partial<SeoMetadata>>(initialData || {});
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = () => {
    startTransition(async () => {
      try {
        await onSave(formData);
        alert("SEO saved successfully.");
        router.refresh();
      } catch (err) {
        alert((err instanceof Error ? err.message : String(err)) || "Failed to save SEO");
      }
    });
  };

  const handleReset = () => {
    if (!confirm("Are you sure you want to remove all SEO overrides for this page? It will revert to fallback values.")) return;
    startTransition(async () => {
      await onReset();
      setFormData({});
      router.refresh();
    });
  };

  const titleLength = formData.title?.length || 0;
  const descLength = formData.description?.length || 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        {/* Basic SEO */}
        <div className="bg-white p-6 border rounded-lg shadow-sm">
          <h3 className="font-semibold text-lg mb-4">Basic SEO</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">SEO Title</label>
              <input 
                name="title" 
                value={formData.title || ""} 
                onChange={handleChange} 
                placeholder="Custom SEO Title" 
                className="w-full p-2 border rounded"
              />
              <div className={`text-xs mt-1 ${titleLength > 60 ? "text-red-500" : titleLength > 10 ? "text-green-600" : "text-slate-500"}`}>
                {titleLength} characters (Recommended: 50-60)
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Meta Description</label>
              <textarea 
                name="description" 
                value={formData.description || ""} 
                onChange={handleChange} 
                rows={3}
                placeholder="Meta description for search engines" 
                className="w-full p-2 border rounded"
              />
              <div className={`text-xs mt-1 ${descLength > 160 ? "text-red-500" : descLength > 50 ? "text-green-600" : "text-slate-500"}`}>
                {descLength} characters (Recommended: 140-160)
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Canonical URL</label>
              <input 
                name="canonical" 
                value={formData.canonical || ""} 
                onChange={handleChange} 
                placeholder={fallbackUrl} 
                className="w-full p-2 border rounded font-mono text-sm"
              />
              <p className="text-xs text-slate-500 mt-1">Leave empty to use default. Only use full absolute URLs starting with https://tools.avexora.in</p>
            </div>
            
            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input type="checkbox" name="robotsIndex" checked={formData.robotsIndex !== false} onChange={handleChange} />
                Index
              </label>
              <label className="flex items-center gap-2 text-sm font-medium">
                <input type="checkbox" name="robotsFollow" checked={formData.robotsFollow !== false} onChange={handleChange} />
                Follow
              </label>
            </div>
          </div>
        </div>

        {/* Open Graph */}
        <div className="bg-white p-6 border rounded-lg shadow-sm">
          <h3 className="font-semibold text-lg mb-4">Open Graph (Social Sharing)</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">OG Title</label>
              <input name="ogTitle" value={formData.ogTitle || ""} onChange={handleChange} placeholder="Falls back to SEO Title" className="w-full p-2 border rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">OG Description</label>
              <textarea name="ogDescription" value={formData.ogDescription || ""} onChange={handleChange} placeholder="Falls back to Meta Description" rows={2} className="w-full p-2 border rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">OG Image URL</label>
              <input name="ogImage" value={formData.ogImage || ""} onChange={handleChange} placeholder="https://..." className="w-full p-2 border rounded font-mono text-sm" />
            </div>
          </div>
        </div>

        <div className="flex justify-between">
          <button onClick={handleReset} disabled={isPending || !initialData} className="px-4 py-2 border border-red-200 text-red-600 rounded-md hover:bg-red-50 disabled:opacity-50">
            Reset Override
          </button>
          <button onClick={handleSave} disabled={isPending} className="px-6 py-2 bg-orange-600 text-white font-medium rounded-md hover:bg-orange-700 disabled:opacity-50">
            {isPending ? "Saving..." : "Save SEO"}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white p-4 border rounded-lg shadow-sm">
          <h3 className="font-semibold text-sm mb-3">Google SERP Preview</h3>
          <div className="p-3 bg-slate-50 border rounded text-sm">
            <div className="text-blue-700 text-base truncate font-medium">{formData.title || "Fallback SEO Title"}</div>
            <div className="text-green-700 text-xs truncate">{formData.canonical || fallbackUrl}</div>
            <div className="text-slate-600 text-xs mt-1 line-clamp-2">{formData.description || "Fallback meta description showing what this page is about."}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
