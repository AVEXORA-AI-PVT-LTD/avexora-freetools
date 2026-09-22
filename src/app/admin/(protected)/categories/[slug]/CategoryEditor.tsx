"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Save, ArrowLeft } from "lucide-react";
import { useDialog } from "@/components/admin/DialogProvider";
import { saveCategory } from "../category-actions";

export function CategoryEditor({ initialData, isNew }: { initialData: any, isNew: boolean }) {
  const router = useRouter();
  const { showAlert } = useDialog();
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState(initialData);

  const update = (field: string, value: any) => setData((prev: any) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    startTransition(async () => {
      try {
        const res = await saveCategory(data);
        if (res.success) {
          showAlert("Success", "Category saved successfully.");
          if (isNew) router.push(`/admin/categories/${data.slug}`);
        }
      } catch (err: any) {
        showAlert("Error", err.message || "Failed to save category.");
      }
    });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-4">
          <Link href="/admin/categories" className="text-slate-500 hover:text-slate-800 p-2 border rounded-md">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">{isNew ? "Create Category" : "Edit Category"}</h1>
        </div>
        <button
          onClick={handleSave}
          disabled={isPending || !data.name || !data.slug}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white font-medium rounded-md hover:bg-orange-700 disabled:opacity-50"
        >
          <Save className="w-4 h-4" /> Save Category
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-1">Name</label>
            <input 
              type="text" 
              value={data.name} 
              onChange={e => {
                update("name", e.target.value);
                if (isNew) update("slug", e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
              }}
              className="w-full border-slate-300 rounded-md py-2 px-3 text-sm focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-1">Slug</label>
            <input 
              type="text" 
              value={data.slug} 
              onChange={e => update("slug", e.target.value)}
              disabled={!isNew && data.isStatic}
              className="w-full border-slate-300 rounded-md py-2 px-3 text-sm focus:ring-orange-500 focus:border-orange-500 disabled:bg-slate-100"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-900 mb-1">Description</label>
          <textarea 
            rows={3}
            value={data.description} 
            onChange={e => update("description", e.target.value)}
            className="w-full border-slate-300 rounded-md py-2 px-3 text-sm focus:ring-orange-500 focus:border-orange-500"
          />
        </div>

        <div className="flex gap-8">
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={data.status} 
              onChange={e => update("status", e.target.checked)}
              className="rounded text-orange-600 focus:ring-orange-600 border-slate-300"
            />
            <span className="text-sm font-medium text-slate-900">Active (Visible publicly)</span>
          </label>
          
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={data.featured} 
              onChange={e => update("featured", e.target.checked)}
              className="rounded text-orange-600 focus:ring-orange-600 border-slate-300"
            />
            <span className="text-sm font-medium text-slate-900">Featured</span>
          </label>
        </div>
      </div>
    </div>
  );
}
