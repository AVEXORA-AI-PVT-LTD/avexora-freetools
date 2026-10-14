"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { SearchItem } from "./search-items";
import { usePlatformShortcut } from "@/hooks/use-platform-shortcut";

export function ToolSearch({
  items,
  displayCount,
}: {
  items: SearchItem[];
  displayCount: number;
}) {
  const router = useRouter();
  const { shortcutSymbol } = usePlatformShortcut();
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

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleGlobalKeyDown = (e: globalThis.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDismissed(true);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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

  const quickPills = [
    { label: "Background Remover", query: "background" },
    { label: "Merge PDF", query: "pdf" },
    { label: "GST Calculator", query: "gst" },
    { label: "Invoice Generator", query: "invoice" },
    { label: "QR Code", query: "qr" },
  ];

  return (
    <div ref={containerRef} className="relative mx-auto w-full max-w-2xl space-y-3">
      <div className="relative flex items-center rounded-2xl border border-slate-200 bg-white shadow-lg shadow-orange-500/5 transition-all focus-within:border-orange-500 focus-within:ring-4 focus-within:ring-orange-500/10">
        <svg
          className="ml-4 h-5 w-5 text-slate-400 shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          ref={inputRef}
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
          className="w-full bg-transparent px-4 py-3.5 text-base font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
        />
        <div className="mr-3 hidden sm:flex items-center gap-1">
          <kbd 
            suppressHydrationWarning
            className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-xs text-slate-500 font-semibold shadow-2xs"
          >
            {shortcutSymbol}
          </kbd>
        </div>
      </div>

      {/* Quick Access Tags */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs text-slate-500">
        <span className="font-semibold text-slate-400 mr-1">Popular:</span>
        {quickPills.map((pill) => (
          <button
            key={pill.label}
            type="button"
            onClick={() => {
              setQuery(pill.query);
              setDismissed(false);
              inputRef.current?.focus();
            }}
            className="rounded-full border border-slate-200/80 bg-slate-50 px-3 py-1 font-medium text-slate-600 transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-900"
          >
            {pill.label}
          </button>
        ))}
      </div>

      {open && (
        <ul
          id="search-listbox"
          role="listbox"
          className="absolute left-0 right-0 z-30 mt-1 max-h-72 sm:max-h-80 w-full overflow-y-auto overscroll-contain rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl shadow-orange-950/10"
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
                className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm transition ${
                  i === activeIndex ? "bg-orange-50/80 text-orange-900 font-semibold" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100/60 text-orange-600 font-bold text-xs">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900">{t.name}</span>
                  </div>
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500 capitalize">
                  {t.categoryName}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {q && matches.length === 0 && (
        <p className="absolute left-0 right-0 z-30 mt-1 w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-center text-sm text-slate-500 shadow-xl">
          No tools match “{query}” yet. Try searching for <span className="font-semibold text-orange-600">PDF</span>, <span className="font-semibold text-orange-600">GST</span>, or <span className="font-semibold text-orange-600">Image</span>.
        </p>
      )}
    </div>
  );
}
