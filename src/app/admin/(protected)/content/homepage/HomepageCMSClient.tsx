"use client";
import { useState } from "react";
import { useDialog } from "@/components/admin/DialogProvider";
import { reorderHomepageSections, saveHomepageSection } from "./homepage-actions";
import { GripVertical, Save, Edit, Eye, Power } from "lucide-react";
import { HomepageSection, SectionKey } from "@/server/homepage-service";
import { SectionEditor } from "./SectionEditor";
import type { getAllCategoriesAdmin } from "@/server/category-service";

type AdminCategory = Awaited<ReturnType<typeof getAllCategoriesAdmin>>[number];

interface SelectableTool {
  slug: string;
  name?: string;
  toolSlug?: string;
  categorySlug: string;
  status: boolean;
}

export function HomepageCMSClient({ initialSections, allCategories, allTools }: { initialSections: HomepageSection[], allCategories: AdminCategory[], allTools: SelectableTool[] }) {
  const [sections, setSections] = useState([...initialSections].sort((a,b) => a.sortOrder - b.sortOrder));
  const { showAlert } = useDialog();
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [editingSection, setEditingSection] = useState<HomepageSection | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === index) return;
    
    const newItems = [...sections];
    const draggedItem = newItems[draggedIdx];
    newItems.splice(draggedIdx, 1);
    newItems.splice(index, 0, draggedItem);
    
    newItems.forEach((item, idx) => item.sortOrder = idx);
    
    setDraggedIdx(index);
    setSections(newItems);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
  };

  const handleSaveOrder = async () => {
    setIsSaving(true);
    try {
      await reorderHomepageSections(sections.map(c => c.sectionKey));
      showAlert("Success", "New order saved. The public homepage will reflect this change.");
    } catch(err) {
      showAlert("Error", "Failed to save order.");
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleToggle = async (idx: number) => {
    const section = sections[idx];
    const updated = { ...section, enabled: !section.enabled };
    const newSections = [...sections];
    newSections[idx] = updated;
    setSections(newSections);
    
    try {
      await saveHomepageSection(updated);
    } catch(err) {
      // revert
      const reverted = [...newSections];
      reverted[idx] = section;
      setSections(reverted);
      showAlert("Error", "Failed to toggle section.");
    }
  };

  if (editingSection) {
    return <SectionEditor 
      section={editingSection} 
      allCategories={allCategories} 
      allTools={allTools}
      onBack={() => setEditingSection(null)}
      onSaved={(updated) => {
        setSections(prev => prev.map(s => s.sectionKey === updated.sectionKey ? updated : s));
        setEditingSection(null);
      }}
    />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Homepage CMS</h1>
          <p className="text-sm text-slate-500 mt-1">Reorder and configure the public homepage layout.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleSaveOrder}
            disabled={isSaving}
            className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-md hover:bg-slate-700 font-medium text-sm"
          >
            <Save className="w-4 h-4" /> Save Ordering
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Order</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Section</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {sections.map((section, idx) => (
              <tr 
                key={section.sectionKey} 
                className={`bg-white group hover:bg-slate-50 ${draggedIdx === idx ? 'opacity-50' : ''}`}
                draggable
                onDragStart={(e) => handleDragStart(e, idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDragEnd={handleDragEnd}
              >
                <td className="px-6 py-4 w-16">
                  <div className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600">
                    <GripVertical className="w-5 h-5" />
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-medium text-slate-900 capitalize">{section.sectionKey.replace(/_/g, " ")}</div>
                  <div className="text-sm text-slate-500 truncate max-w-md">{section.heading || "No heading"}</div>
                </td>
                <td className="px-6 py-4">
                  <button 
                    onClick={() => handleToggle(idx)}
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                      section.enabled ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Power className="w-3 h-3" />
                    {section.enabled ? "ON" : "OFF"}
                  </button>
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button onClick={() => setEditingSection(section)} className="inline-flex p-1.5 text-slate-400 hover:text-orange-600" title="Edit">
                    <Edit className="w-4 h-4" /> Edit
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
