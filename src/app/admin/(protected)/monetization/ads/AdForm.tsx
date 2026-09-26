"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createAdAction, updateAdAction, AdSlotFormData } from "./ad-actions";
import Link from "next/link";
import { Eye } from "lucide-react";
import AdPreviewModal from "./AdPreviewModal";

interface AdFormProps {
  initialData?: any;
}

export default function AdForm({ initialData }: AdFormProps) {
  const router = useRouter();
  const isEditing = Boolean(initialData?.id);

  const [formData, setFormData] = useState<AdSlotFormData>({
    name: initialData?.name || "",
    description: initialData?.description || "",
    placement: initialData?.placement || "tool_page",
    device: initialData?.device || "all",
    adProvider: initialData?.adProvider || "adsense",
    adReference: initialData?.adReference || "",
    customHtml: initialData?.customHtml || "",
    destinationUrl: initialData?.destinationUrl || "",
    imageUrl: initialData?.imageUrl || "",
    priority: initialData?.priority || 1,
    active: initialData?.active !== undefined ? initialData.active : true,
    startDate: initialData?.startDate ? new Date(initialData.startDate).toISOString().slice(0, 16) : "",
    endDate: initialData?.endDate ? new Date(initialData.endDate).toISOString().slice(0, 16) : "",
    categorySlug: initialData?.categorySlug || "",
    toolSlug: initialData?.toolSlug || "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const handleChange = (field: keyof AdSlotFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      if (isEditing) {
        await updateAdAction(initialData.id, formData);
      } else {
        await createAdAction(formData);
      }
      router.push("/admin/monetization/ads");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to save ad slot");
      setIsSubmitting(false);
    }
  };

  const inputCls = "w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm outline-none";
  const labelCls = "block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* BASIC SETTINGS */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
        <h2 className="text-lg font-bold text-slate-800 border-b pb-3">Basic Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="col-span-2">
            <label className={labelCls}>Ad Name *</label>
            <input 
              type="text" 
              required
              placeholder="e.g., Header Leaderboard Banner" 
              className={inputCls} 
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
            />
          </div>

          <div className="col-span-2">
            <label className={labelCls}>Internal Description / Notes</label>
            <input 
              type="text" 
              placeholder="Internal notes regarding campaign or sponsor" 
              className={inputCls} 
              value={formData.description || ""}
              onChange={(e) => handleChange("description", e.target.value)}
            />
          </div>

          <div>
            <label className={labelCls}>Placement *</label>
            <select 
              className={inputCls}
              value={formData.placement}
              onChange={(e) => handleChange("placement", e.target.value)}
            >
              <option value="header">Header</option>
              <option value="homepage">Homepage</option>
              <option value="tool_page">Tool Page Main</option>
              <option value="sidebar">Sidebar</option>
              <option value="footer">Footer</option>
            </select>
          </div>

          <div>
            <label className={labelCls}>Device Targeting *</label>
            <select 
              className={inputCls}
              value={formData.device}
              onChange={(e) => handleChange("device", e.target.value)}
            >
              <option value="all">All Devices (Desktop & Mobile)</option>
              <option value="desktop">Desktop Only</option>
              <option value="mobile">Mobile Only</option>
              <option value="tablet">Tablet Only</option>
            </select>
          </div>

          <div>
            <label className={labelCls}>Priority Order (1 = Highest)</label>
            <input 
              type="number" 
              min={1} 
              max={100}
              className={inputCls} 
              value={formData.priority}
              onChange={(e) => handleChange("priority", Number(e.target.value))}
            />
          </div>

          <div className="flex items-center gap-3 pt-6">
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={formData.active}
                onChange={(e) => handleChange("active", e.target.checked)}
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
            </label>
            <span className="text-sm font-semibold text-slate-800">
              {formData.active ? "Active" : "Inactive"}
            </span>
          </div>
        </div>
      </div>

      {/* PROVIDER & CONFIG */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
        <h2 className="text-lg font-bold text-slate-800 border-b pb-3">Ad Provider & Code Reference</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={labelCls}>Ad Provider *</label>
            <select 
              className={inputCls}
              value={formData.adProvider}
              onChange={(e) => handleChange("adProvider", e.target.value)}
            >
              <option value="adsense">Google AdSense</option>
              <option value="admanager">Google Ad Manager</option>
              <option value="internal">Internal Promo Banner</option>
              <option value="custom">Custom HTML (Sanitized)</option>
            </select>
          </div>

          <div>
            <label className={labelCls}>Provider Ad Reference / Slot ID</label>
            <input 
              type="text" 
              placeholder="e.g. 1234567890 (AdSense Slot ID)" 
              className={inputCls} 
              value={formData.adReference || ""}
              onChange={(e) => handleChange("adReference", e.target.value)}
            />
          </div>

          {formData.adProvider === "internal" && (
            <>
              <div>
                <label className={labelCls}>Image URL (Promo Banner)</label>
                <input 
                  type="url" 
                  placeholder="https://example.com/banner.png" 
                  className={inputCls} 
                  value={formData.imageUrl || ""}
                  onChange={(e) => handleChange("imageUrl", e.target.value)}
                />
              </div>

              <div>
                <label className={labelCls}>Destination Target URL</label>
                <input 
                  type="url" 
                  placeholder="https://example.com/landing" 
                  className={inputCls} 
                  value={formData.destinationUrl || ""}
                  onChange={(e) => handleChange("destinationUrl", e.target.value)}
                />
              </div>
            </>
          )}

          {formData.adProvider === "custom" && (
            <div className="col-span-2">
              <label className={labelCls}>Custom HTML Markup</label>
              <textarea 
                rows={4}
                placeholder="<div class='my-ad'>Custom Ad Content</div>" 
                className={inputCls + " font-mono text-xs"} 
                value={formData.customHtml || ""}
                onChange={(e) => handleChange("customHtml", e.target.value)}
              />
              <p className="text-xs text-slate-500 mt-1">HTML is automatically sanitized for security before saving.</p>
            </div>
          )}
        </div>
      </div>

      {/* SCHEDULE & TARGETING */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
        <h2 className="text-lg font-bold text-slate-800 border-b pb-3">Schedule & Specific Targeting (Optional)</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={labelCls}>Start Date & Time</label>
            <input 
              type="datetime-local" 
              className={inputCls} 
              value={formData.startDate || ""}
              onChange={(e) => handleChange("startDate", e.target.value)}
            />
          </div>

          <div>
            <label className={labelCls}>End Date & Time</label>
            <input 
              type="datetime-local" 
              className={inputCls} 
              value={formData.endDate || ""}
              onChange={(e) => handleChange("endDate", e.target.value)}
            />
          </div>

          <div>
            <label className={labelCls}>Target Category Slug (Optional)</label>
            <input 
              type="text" 
              placeholder="e.g. business-legal (Leave blank for global)" 
              className={inputCls} 
              value={formData.categorySlug || ""}
              onChange={(e) => handleChange("categorySlug", e.target.value)}
            />
          </div>

          <div>
            <label className={labelCls}>Target Tool Slug (Optional)</label>
            <input 
              type="text" 
              placeholder="e.g. digital-business-card-generator (Leave blank for global)" 
              className={inputCls} 
              value={formData.toolSlug || ""}
              onChange={(e) => handleChange("toolSlug", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* FORM ACTIONS */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <button 
          type="button" 
          onClick={() => setShowPreview(true)}
          className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium rounded-lg text-sm inline-flex items-center gap-2"
        >
          <Eye className="w-4 h-4" /> Preview Ad
        </button>

        <div className="flex items-center gap-3">
          <Link href="/admin/monetization/ads" className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm">
            Cancel
          </Link>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg text-sm disabled:opacity-50 transition-colors shadow-sm"
          >
            {isSubmitting ? "Saving..." : isEditing ? "Update Ad Slot" : "Create Ad Slot"}
          </button>
        </div>
      </div>

      {/* PREVIEW MODAL */}
      {showPreview && (
        <AdPreviewModal 
          ad={{
            name: formData.name || "Untitled Ad",
            placement: formData.placement,
            device: formData.device,
            adProvider: formData.adProvider,
            adReference: formData.adReference,
            customHtml: formData.customHtml,
            destinationUrl: formData.destinationUrl,
            imageUrl: formData.imageUrl
          }} 
          onClose={() => setShowPreview(false)} 
        />
      )}
    </form>
  );
}
