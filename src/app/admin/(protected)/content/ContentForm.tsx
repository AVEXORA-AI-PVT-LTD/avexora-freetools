"use client";

import { useState, useTransition } from "react";
import { updateContentBlock } from "./actions";
import { ContentBlockConfig } from "@/server/content";

export function ContentForm({ config, initialValue }: { config: ContentBlockConfig, initialValue: string }) {
  const [value, setValue] = useState(initialValue);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null);

  const isDirty = value !== initialValue;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const formData = new FormData();
    formData.append("key", config.key);
    formData.append("value", value);

    startTransition(async () => {
      const result = await updateContentBlock(formData);
      if (result.error) {
        setMessage({ type: "error", text: result.error });
      } else {
        setMessage({ type: "success", text: "Content updated successfully." });
        // Hide success message after 3 seconds
        setTimeout(() => setMessage(null), 3000);
      }
    });
  };

  return (
    <form onSubmit={handleSave} className="p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1 w-full max-w-2xl">
          <label htmlFor={config.key} className="block text-sm font-medium text-slate-700 mb-2">
            {config.label}
          </label>
          
          {config.type === "TEXTAREA" ? (
            <textarea
              id={config.key}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              maxLength={config.maxLength}
              required={config.required}
              rows={4}
              className="w-full rounded-md border border-slate-300 p-2 text-sm shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          ) : (
            <input
              type="text"
              id={config.key}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              maxLength={config.maxLength}
              required={config.required}
              className="w-full rounded-md border border-slate-300 p-2 text-sm shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          )}
          
          <div className="mt-2 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Max {config.maxLength} characters.
            </p>
            {message && (
              <p className={`text-xs font-medium ${message.type === "error" ? "text-red-600" : "text-green-600"}`}>
                {message.text}
              </p>
            )}
          </div>
        </div>
        
        <div className="mt-4 sm:mt-7 sm:ml-4 flex flex-col items-end shrink-0">
          <button
            type="submit"
            disabled={!isDirty || isPending}
            className={`rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm transition 
              ${!isDirty || isPending 
                ? "bg-slate-300 cursor-not-allowed" 
                : "bg-orange-600 hover:bg-orange-700"}`}
          >
            {isPending ? "Saving..." : "Save"}
          </button>
          {isDirty && !isPending && (
            <span className="mt-2 text-xs text-amber-600 font-medium">
              Unsaved changes
            </span>
          )}
        </div>
      </div>
    </form>
  );
}
