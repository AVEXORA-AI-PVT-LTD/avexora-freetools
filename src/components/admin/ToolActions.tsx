"use client";

import { useTransition, useState, useEffect, useRef } from "react";
import { updateToolStatus } from "@/app/admin/tools/actions";
import Link from "next/link";

export function ToolActions({ slug, initialStatus }: { slug: string; initialStatus: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState(initialStatus);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const handleToggle = () => {
    const newStatus = !status;
    setStatus(newStatus);
    setError(null);
    setOpen(false);

    startTransition(async () => {
      const result = await updateToolStatus(slug, newStatus);
      if (!result.success) {
        setStatus(!newStatus);
        setError(result.error || "Failed to update status");
      }
    });
  };

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
        aria-label={`Tool actions for ${slug}`}
        aria-expanded={open}
      >
        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M10 3a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM10 8.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM10 14a1.5 1.5 0 110 3 1.5 1.5 0 010-3z" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            <span className="block px-4 py-2 text-sm text-slate-400 italic">
              Edit (Coming soon)
            </span>
            <button
              onClick={handleToggle}
              disabled={isPending}
              className={`block w-full text-left px-4 py-2 text-sm ${
                isPending ? "text-slate-400 cursor-wait" : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              {status ? "Disable" : "Enable"}
            </button>
          </div>
        </div>
      )}
      {error && <div className="absolute right-0 top-full mt-1 text-xs text-red-600 whitespace-nowrap">{error}</div>}
    </div>
  );
}
