"use client";

import { useState, useTransition, useMemo } from "react";
import { reorderCategories } from "./actions";

type Category = { slug: string; name: string; status?: boolean };

export function CategoryReorderClient({ categories }: { categories: Category[] }) {
  const [orderedSlugs, setOrderedSlugs] = useState<string[]>(categories.map(c => c.slug));
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newOrder = [...orderedSlugs];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    setOrderedSlugs(newOrder);
    setMessage(null);
  };

  const moveDown = (index: number) => {
    if (index === orderedSlugs.length - 1) return;
    const newOrder = [...orderedSlugs];
    [newOrder[index + 1], newOrder[index]] = [newOrder[index], newOrder[index + 1]];
    setOrderedSlugs(newOrder);
    setMessage(null);
  };

  const handleSave = () => {
    setMessage(null);
    startTransition(async () => {
      const result = await reorderCategories(orderedSlugs);
      if (result.success) {
        setMessage({ type: "success", text: "Category order saved successfully." });
      } else {
        setMessage({ type: "error", text: result.error || "Failed to save order." });
      }
    });
  };

  const handleCancel = () => {
    setOrderedSlugs(categories.map(c => c.slug));
    setMessage(null);
  };

  const isDirty = useMemo(() => {
    const originalSlugs = categories.map(c => c.slug);
    return JSON.stringify(orderedSlugs) !== JSON.stringify(originalSlugs);
  }, [orderedSlugs, categories]);

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
        <ul className="divide-y divide-slate-200">
          {orderedSlugs.map((slug, index) => {
            const cat = categories.find(c => c.slug === slug);
            if (!cat) return null;
            
            return (
              <li key={slug} className="flex items-center justify-between p-3 bg-white hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded bg-slate-100 text-xs font-medium text-slate-500">
                    {index + 1}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-900">{cat.name}</span>
                    <span className="text-xs text-slate-500">{cat.slug}</span>
                  </div>
                  {!cat.status && (
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 border border-slate-200">
                      Disabled
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveUp(index)}
                    disabled={index === 0}
                    className="p-1.5 text-slate-400 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed rounded hover:bg-slate-100"
                    aria-label={`Move ${cat.name} up`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => moveDown(index)}
                    disabled={index === orderedSlugs.length - 1}
                    className="p-1.5 text-slate-400 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed rounded hover:bg-slate-100"
                    aria-label={`Move ${cat.name} down`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={!isDirty || isPending}
          className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? "Saving..." : "Save Order"}
        </button>
        <button
          type="button"
          onClick={handleCancel}
          disabled={!isDirty || isPending}
          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>

        {message && (
          <span className={`text-sm font-medium ${message.type === "success" ? "text-green-600" : "text-red-600"}`}>
            {message.text}
          </span>
        )}
      </div>
    </div>
  );
}
