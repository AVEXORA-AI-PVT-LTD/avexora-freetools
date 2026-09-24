"use client";
import { useState, useTransition } from "react";
import { ArrowLeft, Save, Plus, Trash2, GripVertical } from "lucide-react";
import { HomepageSection, SectionKey } from "@/server/homepage-service";
import { saveHomepageSection } from "./homepage-actions";
import { useDialog } from "@/components/admin/DialogProvider";
import type { getAllCategoriesAdmin } from "@/server/category-service";

/** Tool entries assembled for the homepage selectors (static registry merged with DB overrides). */
interface HomepageToolOption {
  slug: string;
  name?: string;
  categorySlug: string;
  status: boolean;
}

export function SectionEditor({ section, allCategories, allTools, onBack, onSaved }: { 
  section: HomepageSection, 
  allCategories: Awaited<ReturnType<typeof getAllCategoriesAdmin>>, 
  allTools: HomepageToolOption[],
  onBack: () => void,
  onSaved: (s: HomepageSection) => void
}) {
  const [data, setData] = useState<HomepageSection>(JSON.parse(JSON.stringify(section))); // deep copy
  const [isPending, startTransition] = useTransition();
  const { showAlert } = useDialog();

  const handleSave = () => {
    startTransition(async () => {
      try {
        const res = await saveHomepageSection(data);
        if (res.success) {
          showAlert("Success", "Section configuration saved.");
          onSaved(data);
        }
      } catch (err) {
        showAlert("Error", (err instanceof Error ? err.message : String(err)) || "Failed to save section.");
      }
    });
  };

  const updateConfig = (key: string, value: string | number) => {
    setData(prev => ({ ...prev, config: { ...prev.config, [key]: value } }));
  };

  const renderConfigEditor = () => {
    switch (data.sectionKey) {
      case "hero":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1">Search Placeholder</label>
              <input type="text" value={data.config.searchPlaceholder || ""} onChange={e => updateConfig("searchPlaceholder", e.target.value)} className="w-full border-slate-300 rounded-md" />
            </div>
          </div>
        );
      case "brand_studio":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1">Label</label>
              <input type="text" value={data.config.label || ""} onChange={e => updateConfig("label", e.target.value)} className="w-full border-slate-300 rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1">CTA Text</label>
              <input type="text" value={data.config.ctaText || ""} onChange={e => updateConfig("ctaText", e.target.value)} className="w-full border-slate-300 rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1">CTA URL</label>
              <input type="text" value={data.config.ctaUrl || ""} onChange={e => updateConfig("ctaUrl", e.target.value)} className="w-full border-slate-300 rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1">Pricing Text</label>
              <input type="text" value={data.config.pricingText || ""} onChange={e => updateConfig("pricingText", e.target.value)} className="w-full border-slate-300 rounded-md" />
            </div>
          </div>
        );
      case "categories":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1">Max Items</label>
              <input type="number" value={data.config.maxItems || 8} onChange={e => updateConfig("maxItems", parseInt(e.target.value))} className="w-full border-slate-300 rounded-md" />
            </div>
            <p className="text-sm text-slate-500">Categories will be populated automatically based on their visibility settings in Category Management.</p>
          </div>
        );
      case "footer":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1">Copyright Text</label>
              <input type="text" value={data.config.copyright || ""} onChange={e => updateConfig("copyright", e.target.value)} className="w-full border-slate-300 rounded-md" />
              <p className="text-xs text-slate-500 mt-1">Use {'{YEAR}'} to inject current year.</p>
            </div>
          </div>
        );
      case "featured_tools":
      case "popular_tools":
      case "new_tools":
      case "recommended_tools":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1">Max Items</label>
              <input type="number" value={data.config.maxItems || 8} onChange={e => updateConfig("maxItems", parseInt(e.target.value))} className="w-full border-slate-300 rounded-md" />
            </div>
            {(data.sectionKey === "popular_tools" || data.sectionKey === "new_tools") && (
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">Mode</label>
                <select value={data.config.mode || "manual"} onChange={e => updateConfig("mode", e.target.value)} className="w-full border-slate-300 rounded-md">
                  <option value="manual">Manual Selection</option>
                  <option value={data.sectionKey === "popular_tools" ? "automatic" : "latest"}>{data.sectionKey === "popular_tools" ? "Automatic (Usage Analytics)" : "Automatic (Latest)"}</option>
                </select>
              </div>
            )}
            {/* simple manual selector fallback */}
            <p className="text-sm text-slate-500">For manual mode, tools are configured in the database.</p>
          </div>
        );
      default:
        return <p className="text-sm text-slate-500">No additional configuration for this section.</p>;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-slate-500 hover:text-slate-800 p-2 border rounded-md">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-slate-900 capitalize">Edit {data.sectionKey.replace(/_/g, " ")}</h1>
        </div>
        <button
          onClick={handleSave}
          disabled={isPending}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white font-medium rounded-md hover:bg-orange-700 disabled:opacity-50"
        >
          <Save className="w-4 h-4" /> Save Changes
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-900 mb-1">Heading</label>
          <input 
            type="text" 
            value={data.heading} 
            onChange={e => setData({...data, heading: e.target.value})}
            className="w-full border-slate-300 rounded-md py-2 px-3 text-sm focus:ring-orange-500 focus:border-orange-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-900 mb-1">Description / Subtitle</label>
          <textarea 
            rows={3}
            value={data.description} 
            onChange={e => setData({...data, description: e.target.value})}
            className="w-full border-slate-300 rounded-md py-2 px-3 text-sm focus:ring-orange-500 focus:border-orange-500"
          />
        </div>
        
        <div className="pt-4 border-t border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Section Configuration</h3>
          {renderConfigEditor()}
        </div>
      </div>
    </div>
  );
}
