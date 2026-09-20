"use client";
import { useState } from "react";
import Link from "next/link";
import { useDialog } from "@/components/admin/DialogProvider";
import { deleteContent, changeContentStatus } from "./content-actions";
import { Edit, Trash2, Plus, Search, Filter } from "lucide-react";
import { ContentItem, ContentType, ContentStatus } from "@prisma/client";

export function ContentListClient({ initialItems, fixedType }: { initialItems: ContentItem[], fixedType?: ContentType }) {
  const [items, setItems] = useState(initialItems);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>(fixedType || "ALL");
  const { showConfirm, showAlert } = useDialog();

  const filteredItems = items.filter(i => {
    const matchesSearch = i.title.toLowerCase().includes(search.toLowerCase()) || i.slug.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "ALL" || i.contentType === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleDelete = (item: ContentItem) => {
    showConfirm(
      "Delete Content",
      `Are you sure you want to delete '${item.title}'? This action cannot be undone.`,
      async () => {
        try {
          const res = await deleteContent(item.id);
          if (res.success) {
            setItems(prev => prev.filter(c => c.id !== item.id));
            showAlert("Success", "Content deleted.");
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
        <h1 className="text-2xl font-bold text-slate-900">Content Management</h1>
        <Link 
          href="/admin/content/new" 
          className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 font-medium text-sm"
        >
          <Plus className="w-4 h-4" /> Create Content
        </Link>
      </div>
      
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by title or slug..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 border-slate-300 rounded-md py-2 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>
        {!fixedType && (
          <select 
            value={typeFilter} 
            onChange={e => setTypeFilter(e.target.value)}
            className="border-slate-300 rounded-md py-2 px-4 focus:ring-orange-500 focus:border-orange-500 bg-white"
          >
            <option value="ALL">All Types</option>
            {Object.values(ContentType).map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Title & Slug</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Last Updated</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredItems.map((item) => (
                <tr key={item.id} className="bg-white hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{item.title}</div>
                    <div className="text-sm text-slate-500">/{item.slug}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center rounded bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 border border-blue-200">
                      {item.contentType}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                      item.status === ContentStatus.PUBLISHED ? 'bg-green-50 text-green-700 border-green-200' : 
                      item.status === ContentStatus.DRAFT ? 'bg-slate-100 text-slate-700 border-slate-300' :
                      'bg-yellow-50 text-yellow-800 border-yellow-200'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {new Date(item.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <Link href={`/admin/content/${item.id}`} className="inline-flex p-1.5 text-slate-400 hover:text-orange-600" title="Edit">
                      <Edit className="w-4 h-4" />
                    </Link>
                    <button onClick={() => handleDelete(item)} className="inline-flex p-1.5 text-slate-400 hover:text-red-600" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No content found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
      </div>
    </div>
  );
}
