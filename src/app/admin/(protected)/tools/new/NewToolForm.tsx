"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createDynamicTool } from "./actions";
import { DYNAMIC_TOOL_TYPES, DYNAMIC_TOOL_ICONS } from "@/lib/admin/dynamic-tools";

export function NewToolForm({ categories }: { categories: { slug: string; name: string }[] }) {
  const [state, formAction, isPending] = useActionState(createDynamicTool, { error: null });

  return (
    <form action={formAction} className="space-y-6">
      {state.error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{state.error}</h3>
            </div>
          </div>
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
          Tool Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          maxLength={100}
          defaultValue={state.fields?.name}
          placeholder="e.g. Percentage Calculator"
          className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
        />
      </div>

      <div>
        <label htmlFor="slug" className="block text-sm font-medium text-slate-700 mb-1">
          Slug
        </label>
        <input
          type="text"
          id="slug"
          name="slug"
          required
          maxLength={100}
          defaultValue={state.fields?.slug}
          pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
          title="Must contain only lowercase letters, numbers, and hyphens"
          placeholder="e.g. percentage-calculator"
          className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
        />
      </div>

      <div>
        <label htmlFor="categorySlug" className="block text-sm font-medium text-slate-700 mb-1">
          Category
        </label>
        <select
          id="categorySlug"
          name="categorySlug"
          required
          defaultValue={state.fields?.categorySlug}
          className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
        >
          <option value="">Select Category</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="type" className="block text-sm font-medium text-slate-700 mb-1">
          Type
        </label>
        <select
          id="type"
          name="type"
          required
          defaultValue={state.fields?.type}
          className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
        >
          <option value="">Select Type</option>
          {DYNAMIC_TOOL_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-slate-500">
          Only trusted renderers for these types are supported. No arbitrary code execution is allowed.
        </p>
      </div>

      <div>
        <label htmlFor="icon" className="block text-sm font-medium text-slate-700 mb-1">
          Icon
        </label>
        <select
          id="icon"
          name="icon"
          defaultValue={state.fields?.icon}
          className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
        >
          <option value="">Select Icon (Optional)</option>
          {DYNAMIC_TOOL_ICONS.map((i) => (
            <option key={i} value={i}>
              {i}
            </option>
          ))}
        </select>
      </div>

      <div className="pt-4 border-t border-slate-100 flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className={`rounded-md bg-slate-900 px-6 py-2 text-sm font-medium text-white hover:bg-slate-800 ${isPending ? 'opacity-50 cursor-wait' : ''}`}
        >
          {isPending ? 'Creating...' : 'Create Tool'}
        </button>
      </div>
    </form>
  );
}
