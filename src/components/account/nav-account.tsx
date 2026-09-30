"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";

const SIGN_IN = "/studio/signin";

export function NavAccount() {
  const { status, data } = useSession();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      const el = panelRef.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  if (status === "loading") {
    return (
      <span className="inline-block h-[30px] w-[30px] rounded-full bg-slate-100 sm:h-8 sm:w-8" />
    );
  }

  if (status === "unauthenticated") {
    return (
      <Link
        href={`${SIGN_IN}?next=${encodeURIComponent(pathname)}`}
        className="text-slate-600 hover:text-orange-600 font-medium transition-colors"
      >
        Sign In
      </Link>
    );
  }

  return (
    <span className="inline-flex items-center gap-4 text-sm">
      <Link href="/studio" className="text-slate-600 hover:text-orange-600 font-medium transition-colors">
        <span className="sm:hidden">Studio</span>
        <span className="hidden sm:inline">Brand Studio</span>
      </Link>

      <div className="relative" ref={panelRef}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label="Account menu"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-600 text-white font-bold shadow-xs hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500/30 ring-2 ring-orange-200/80 transition-all"
        >
          {data?.user?.name ? data.user.name.charAt(0).toUpperCase() : (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          )}
        </button>

        {open && (
          <div
            role="dialog"
            aria-label="Account"
            className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-2 text-sm shadow-2xl shadow-orange-950/10 animate-in fade-in slide-in-from-top-2 duration-150"
          >
            {data?.user?.name && (
              <div className="rounded-xl bg-orange-50/80 border border-orange-200/60 p-3 mb-1">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-600 text-white font-bold text-sm shrink-0 shadow-xs">
                    {data.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-slate-900">
                      {data.user.name}
                    </p>
                    {data.user.email && (
                      <p className="truncate text-[11px] font-medium text-slate-500">
                        {data.user.email}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-0.5 font-medium text-slate-700">
              <Link
                href="/studio/app"
                className="flex items-center gap-2.5 w-full rounded-xl px-3 py-2 text-xs hover:bg-orange-50 hover:text-orange-900 transition-colors"
                onClick={() => setOpen(false)}
              >
                <span>📊</span>
                <span>Studio Dashboard</span>
              </Link>
              <Link
                href="/studio/pricing"
                className="flex items-center gap-2.5 w-full rounded-xl px-3 py-2 text-xs hover:bg-orange-50 hover:text-orange-900 transition-colors"
                onClick={() => setOpen(false)}
              >
                <span>🏷️</span>
                <span>Plans & Pricing</span>
              </Link>
              <Link
                href="/studio/account"
                className="flex items-center gap-2.5 w-full rounded-xl px-3 py-2 text-xs hover:bg-orange-50 hover:text-orange-900 transition-colors"
                onClick={() => setOpen(false)}
              >
                <span>⚙️</span>
                <span>Account Settings</span>
              </Link>
            </div>

            <div className="border-t border-slate-100 mt-1 pt-1">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  signOut({ callbackUrl: pathname });
                }}
                className="flex items-center gap-2.5 w-full rounded-xl px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-semibold transition-colors text-left"
              >
                <span>🚪</span>
                <span>Sign out</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </span>
  );
}
