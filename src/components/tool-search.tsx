"use client";

import { useState } from "react";
import Link from "next/link";

export interface SearchItem {
  name: string;
  slug: string;
  category: string;
  categoryName: string;
}

export function ToolSearch({ items }: { items: SearchItem[] }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const matches = q
    ? items.filter((t) => t.name.toLowerCase().includes(q)).slice(0, 8)
    : [];

  return (
    <div className="relative mx-auto w-full max-w-xl">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={`Search ${items.length} free tools…`}
        aria-label="Search tools"
        className="w-full rounded-full border border-slate-300 bg-white px-5 py-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
      />
      {matches.length > 0 && (
        <ul className="absolute z-10 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          {matches.map((t) => (
            <li key={t.slug}>
              <Link
                href={`/${t.category}/${t.slug}`}
                className="flex items-center justify-between px-4 py-2.5 text-sm hover:bg-indigo-50"
              >
                <span className="font-medium text-slate-900">{t.name}</span>
                <span className="text-xs text-slate-400">{t.categoryName}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {q && matches.length === 0 && (
        <p className="absolute z-10 mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-lg">
          No tools match “{query}” yet.
        </p>
      )}
    </div>
  );
}
