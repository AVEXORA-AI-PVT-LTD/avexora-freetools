"use client";

import { useState, useTransition, useMemo } from "react";
import { reorderTools } from "./actions";

type MinimalTool = { slug: string; name: string; category: string; status?: boolean };
type Category = { slug: string; name: string };

export function ToolReorderClient({
  categories,
  tools,
}: {
  categories: Category[];
  tools: MinimalTool[];
}) {
  const [selectedCategory, setSelectedCategory] = useState<string>(categories[0]?.slug || "");
  const [orderedSlugs, setOrderedSlugs] = useState<string[]>(() =>
    tools.filter((t) => t.category === selectedCategory).map((t) => t.slug),
  );
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // When category changes, reset the ordered slugs to the current actual order
  const toolsInCategory = useMemo(() => {
    return tools.filter((t) => t.category === selectedCategory);
  }, [tools, selectedCategory]);

  // Sync state when category changes: adjust state during render rather than
  // in an Effect, per https://react.dev/learn/you-might-not-need-an-effect.
  const [syncedCategory, setSyncedCategory] = useState(selectedCategory);
  if (selectedCategory !== syncedCategory) {
    setSyncedCategory(selectedCategory);
    setOrderedSlugs(toolsInCategory.map((t) => t.slug));
  }

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(e.target.value);
    setMessage(null);
  };

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
      const result = await reorderTools({
        categorySlug: selectedCategory,
        orderedToolSlugs: orderedSlugs,
      });

      if (result.success) {
        setMessage({ type: "success", text: "Tool order saved successfully." });
      } else {
        setMessage({ type: "error", text: result.error || "Failed to save order." });
      }
    });
  };

  const handleCancel = () => {
    setOrderedSlugs(toolsInCategory.map(t => t.slug));
    setMessage(null);
  };

  const isDirty = useMemo(() => {
    const originalSlugs = toolsInCategory.map(t => t.slug);
    return JSON.stringify(orderedSlugs) !== JSON.stringify(originalSlugs);
  }, [orderedSlugs, toolsInCategory]);

  if (!categories.length) {
    return <div>No categories found.</div>;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <label htmlFor="categorySelect" className="block text-sm font-medium text-slate-700 mb-1">
          Select Category
        </label>
        <select
          id="categorySelect"
          value={selectedCategory}
          onChange={handleCategoryChange}
          className="w-full sm:w-64 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
        >
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
        <ul className="divide-y divide-slate-200">
          {orderedSlugs.length === 0 ? (
            <li className="p-4 text-sm text-slate-500 text-center">No tools in this category.</li>
          ) : (
            orderedSlugs.map((slug, index) => {
              const tool = tools.find(t => t.slug === slug);
              if (!tool) return null;
              
              return (
                <li key={slug} className="flex items-center justify-between p-3 bg-white hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded bg-slate-100 text-xs font-medium text-slate-500">
                      {index + 1}
                    </span>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-900">{tool.name}</span>
                      <span className="text-xs text-slate-500">{tool.slug}</span>
                    </div>
                    {!tool.status && (
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
                      aria-label={`Move ${tool.name} up`}
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
                      aria-label={`Move ${tool.name} down`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </li>
              );
            })
          )}
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
