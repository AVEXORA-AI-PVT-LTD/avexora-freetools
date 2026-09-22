"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPlan, updatePlan } from "../pricing-actions";

export default function PlanForm({ initialData }: { initialData: any }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    slug: initialData?.slug || "",
    tagline: initialData?.tagline || "",
    monthlyPrice: initialData?.monthlyPrice || 0,
    yearlyPrice: initialData?.yearlyPrice || 0,
    razorpayMonthlyId: initialData?.razorpayMonthlyId || "",
    razorpayYearlyId: initialData?.razorpayYearlyId || "",
    isActive: initialData ? initialData.isActive : true,
    isFeatured: initialData?.isFeatured || false,
    limits: initialData?.limits ? JSON.stringify(initialData.limits, null, 2) : "{}",
    capabilities: initialData?.capabilities ? JSON.stringify(initialData.capabilities, null, 2) : "{}",
    highlights: initialData?.highlights ? initialData.highlights.join("\n") : "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        limits: JSON.parse(formData.limits),
        capabilities: JSON.parse(formData.capabilities),
        highlights: formData.highlights.split("\n").filter((l: string) => l.trim()),
      };

      if (initialData?.id) {
        await updatePlan(initialData.id, payload);
      } else {
        await createPlan(payload);
      }
      router.push("/admin/monetization/pricing");
      router.refresh();
    } catch (err: any) {
      alert(err.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-slate-700">Plan Name</label>
          <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Slug (e.g., launch)</label>
          <input required disabled={!!initialData} type="text" value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm disabled:opacity-50" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700">Tagline</label>
          <input type="text" value={formData.tagline} onChange={e => setFormData({...formData, tagline: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Monthly Price (Paise)</label>
          <input required type="number" min="0" value={formData.monthlyPrice} onChange={e => setFormData({...formData, monthlyPrice: Number(e.target.value)})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Yearly Price (Paise)</label>
          <input required type="number" min="0" value={formData.yearlyPrice} onChange={e => setFormData({...formData, yearlyPrice: Number(e.target.value)})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Razorpay Monthly Plan ID</label>
          <input type="text" value={formData.razorpayMonthlyId} onChange={e => setFormData({...formData, razorpayMonthlyId: e.target.value})} placeholder="plan_XYZ..." className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Razorpay Yearly Plan ID</label>
          <input type="text" value={formData.razorpayYearlyId} onChange={e => setFormData({...formData, razorpayYearlyId: e.target.value})} placeholder="plan_XYZ..." className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Highlights (One per line)</label>
        <textarea rows={4} value={formData.highlights} onChange={e => setFormData({...formData, highlights: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm" placeholder="1 brand&#10;Unlimited exports" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-slate-700">Limits (JSON)</label>
          <textarea rows={5} value={formData.limits} onChange={e => setFormData({...formData, limits: e.target.value})} className="mt-1 block w-full font-mono text-xs rounded-md border-slate-300 shadow-sm focus:border-orange-500 focus:ring-orange-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Capabilities (JSON)</label>
          <textarea rows={5} value={formData.capabilities} onChange={e => setFormData({...formData, capabilities: e.target.value})} className="mt-1 block w-full font-mono text-xs rounded-md border-slate-300 shadow-sm focus:border-orange-500 focus:ring-orange-500" />
        </div>
      </div>

      <div className="flex items-center gap-4 border-t pt-6">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} className="rounded border-slate-300 text-orange-600 focus:ring-orange-500" />
          <span className="text-sm font-medium text-slate-900">Active (Visible to users)</span>
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={formData.isFeatured} onChange={e => setFormData({...formData, isFeatured: e.target.checked})} className="rounded border-slate-300 text-orange-600 focus:ring-orange-500" />
          <span className="text-sm font-medium text-slate-900">Featured (Highlight on pricing page)</span>
        </label>
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t">
        <button type="button" onClick={() => router.back()} className="px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50">Cancel</button>
        <button type="submit" disabled={isSubmitting} className="inline-flex justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700">
          {isSubmitting ? "Saving..." : "Save Plan"}
        </button>
      </div>
    </form>
  );
}
