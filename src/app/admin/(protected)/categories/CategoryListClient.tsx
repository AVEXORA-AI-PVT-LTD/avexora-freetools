"use client";
import { useState } from "react";
import Link from "next/link";
import { useDialog } from "@/components/admin/DialogProvider";
import { deleteCategory, reorderCategories } from "./category-actions";
import { Eye, Edit, Trash2, Plus, GripVertical, Save } from "lucide-react";

export function CategoryListClient({ initialCategories }: { initialCategories: any[] }) {
  const [categories, setCategories] = useState([...initialCategories].sort((a,b) => a.displayOrder - b.displayOrder));
  const { showConfirm, showAlert } = useDialog();
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === index) return;
    
    const newItems = [...categories];
    const draggedItem = newItems[draggedIdx];
    newItems.splice(draggedIdx, 1);
    newItems.splice(index, 0, draggedItem);
    
    // update display orders locally
    newItems.forEach((item, idx) => item.displayOrder = idx);
    
    setDraggedIdx(index);
    setCategories(newItems);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
  };

  const handleSaveOrder = async () => {
    setIsSaving(true);
    try {
      await reorderCategories(categories.map(c => c.slug));
      showAlert("Success", "New order saved.");
    } catch(err) {
      showAlert("Error", "Failed to save order.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (cat: any) => {
    showConfirm(
      "Delete Category",
      `Are you sure you want to delete '${cat.name}'?`,
      async () => {
        try {
          const res = await deleteCategory(cat.slug);
          if (res.success) {
            setCategories(prev => prev.filter(c => c.slug !== cat.slug));
            showAlert("Success", "Category deleted.");
          }
        } catch (e: any) {
          showAlert("Error", e.message || "Failed to delete.");
        }
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Categories</h1>
        <div className="flex gap-2">
          <button 
            onClick={handleSaveOrder}
            disabled={isSaving}
            className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-md hover:bg-slate-700 font-medium text-sm"
          >
            <Save className="w-4 h-4" /> Save Order
          </button>
          <Link 
            href="/admin/categories/new" 
            className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 font-medium text-sm"
          >
            <Plus className="w-4 h-4" /> Add Category
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Order</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Tools</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {categories.map((cat, idx) => (
                <tr 
                  key={cat.slug} 
                  className={`bg-white group hover:bg-slate-50 ${draggedIdx === idx ? 'opacity-50' : ''}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDragEnd={handleDragEnd}
                >
                  <td className="px-6 py-4">
                    <div className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600">
                      <GripVertical className="w-5 h-5" />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{cat.name}</div>
                    <div className="text-sm text-slate-500">/{cat.slug}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cat.status ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}`}>
                      {cat.status ? "Active" : "Inactive"}
                    </span>
                    {cat.featured && (
                      <span className="ml-2 inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800">
                        Featured
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {cat.toolCount} tools
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <a href={`/${cat.slug}`} target="_blank" className="inline-flex p-1.5 text-slate-400 hover:text-blue-600" title="Preview">
                      <Eye className="w-4 h-4" />
                    </a>
                    <Link href={`/admin/categories/${cat.slug}`} className="inline-flex p-1.5 text-slate-400 hover:text-orange-600" title="Edit">
                      <Edit className="w-4 h-4" />
                    </Link>
                    <button onClick={() => handleDelete(cat)} className="inline-flex p-1.5 text-slate-400 hover:text-red-600" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
      </div>
    </div>
  );
}
