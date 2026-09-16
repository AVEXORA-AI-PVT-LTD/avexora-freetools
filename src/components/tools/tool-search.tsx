"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { SearchItem } from "./search-items";

export function ToolSearch({
  items,
  displayCount,
}: {
  items: SearchItem[];
  displayCount: number;
}) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [dismissed, setDismissed] = useState(false);
  const q = query.trim().toLowerCase();
  const matches = q
    ? items.filter(
        (t) =>
          t.name.toLowerCase().includes(q) || t.categoryName.toLowerCase().includes(q),
      )
    : [];
  const open = !dismissed && matches.length > 0;
  const activeId = activeIndex >= 0 && activeIndex < matches.length ? `search-option-${activeIndex}` : undefined;

  useEffect(() => {
    if (activeIndex < 0 || activeIndex >= matches.length) return;
    document
      .getElementById(`search-option-${activeIndex}`)
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, matches.length]);

  useEffect(() => {
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setDismissed(true);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, []);

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      setActiveIndex(-1);
      setDismissed(true);
      return;
    }
    if (matches.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setDismissed(false);
      setActiveIndex((i) => (i + 1 >= matches.length ? matches.length - 1 : i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setDismissed(false);
      setActiveIndex((i) => (i <= 0 ? -1 : i - 1));
    } else if (e.key === "Enter") {
      if (activeIndex >= 0 && activeIndex < matches.length) {
        e.preventDefault();
        const m = matches[activeIndex];
        router.push(`/${m.category}/${m.slug}`);
      } else if (matches.length > 0) {
        e.preventDefault();
        const m = matches[0];
        router.push(`/${m.category}/${m.slug}`);
      }
    }
  };

  return (
    <div ref={containerRef} className="relative mx-auto w-full max-w-xl">
      <input
        type="search"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setActiveIndex(-1);
          setDismissed(false);
        }}
        onKeyDown={onKeyDown}
        role="combobox"
        aria-label="Search tools"
        aria-expanded={open}
        aria-controls="search-listbox"
        aria-autocomplete="list"
        aria-activedescendant={activeId}
        placeholder={`Search ${displayCount}+ Avex tools…`}
        className="w-full rounded-full border border-slate-300 bg-white px-5 py-3 text-sm shadow-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
      />
      {open && (
        <ul
          id="search-listbox"
          role="listbox"
          className="absolute z-10 mt-2 max-h-72 w-full overflow-y-auto overscroll-contain rounded-xl border border-slate-200 bg-white shadow-lg"
        >
          {matches.map((t, i) => (
            <li
              key={t.slug}
              id={`search-option-${i}`}
              role="option"
              aria-selected={i === activeIndex}
            >
              <Link
                href={`/${t.category}/${t.slug}`}
                onMouseEnter={() => setActiveIndex(i)}
                className={`flex items-center justify-between px-4 py-2.5 text-sm hover:bg-orange-50 ${i === activeIndex ? "bg-orange-50 font-semibold" : ""}`}
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
