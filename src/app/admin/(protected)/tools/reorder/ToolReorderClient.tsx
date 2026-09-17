"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { GripVertical, Save } from "lucide-react";
import { reorderToolsAction } from "./reorder-actions";

type ToolItem = {
  name: string;
  slug: string;
  category: string;
  displayOrder: number;
};

export function ToolReorderClient({ initialTools }: { initialTools: ToolItem[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [items, setItems] = useState(
    [...initialTools].sort((a, b) => a.displayOrder - b.displayOrder)
  );
  
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    
    if (draggedIdx === null || draggedIdx === index) return;
    
    const newItems = [...items];
    const draggedItem = newItems[draggedIdx];
    newItems.splice(draggedIdx, 1);
    newItems.splice(index, 0, draggedItem);
    
    setItems(newItems);
    setDraggedIdx(index);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
  };

  const handleSave = async () => {
    const payload = items.map((item, idx) => ({
      ...item,
      displayOrder: idx,
    }));
    
    startTransition(async () => {
      try {
        await reorderToolsAction(payload);
        alert("Tools reordered successfully!");
        router.push("/admin/tools?category=" + items[0].category);
      } catch (err) {
        alert("Failed to save order.");
      }
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <p className="text-slate-600 text-sm">Drag and drop the tools below to change their display order on the public category page.</p>
        <button
          onClick={handleSave}
          disabled={isPending}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-md hover:bg-orange-700 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {isPending ? "Saving..." : "Save Order"}
        </button>
      </div>

      <div className="space-y-2 max-w-2xl">
        {items.map((item, idx) => (
          <div
            key={item.slug}
            draggable
            onDragStart={(e) => handleDragStart(e, idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDragEnd={handleDragEnd}
            className={`flex items-center gap-4 p-3 bg-white border rounded-lg shadow-sm cursor-grab active:cursor-grabbing transition-colors ${draggedIdx === idx ? 'border-orange-500 bg-orange-50 opacity-50' : 'border-slate-200 hover:border-orange-300'}`}
          >
            <GripVertical className="w-5 h-5 text-slate-400" />
            <span className="w-8 text-center text-sm font-medium text-slate-400">{idx + 1}</span>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-slate-900">{item.name}</h3>
              <p className="text-xs text-slate-500">{item.slug}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
