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
        className="text-slate-600 hover:text-slate-900"
      >
        Sign in
      </Link>
    );
  }

  return (
    <span className="inline-flex items-center gap-4 text-sm">
      <Link href="/studio" className="text-slate-600 hover:text-slate-900">
        <span className="sm:hidden">Studio</span>
        <span className="hidden sm:inline">Brand Studio</span>
      </Link>

      <div className="relative" ref={panelRef}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label="Account menu"
          className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-slate-900 text-white shadow-sm transition-colors hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-1 sm:h-8 sm:w-8"
        >
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
        </button>

        {open && (
          <div
            role="dialog"
            aria-label="Account"
            className="absolute right-0 z-50 mt-1 w-56 overflow-hidden rounded-md border border-slate-200 bg-white text-sm shadow-lg"
          >
            {data?.user?.name && (
              <div className="border-b px-3 py-2">
                <p className="truncate text-sm font-medium text-slate-800">
                  {data.user.name}
                </p>
                {data.user.email && (
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {data.user.email}
                  </p>
                )}
              </div>
            )}

            <div className="p-1">
              <Link
                href="/studio/app"
                className="block w-full rounded px-3 py-1.5 text-left text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                onClick={() => setOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                href="/studio/pricing"
                className="block w-full rounded px-3 py-1.5 text-left text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                onClick={() => setOpen(false)}
              >
                Pricing
              </Link>
            </div>

            <div className="border-t p-1">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  signOut({ callbackUrl: pathname });
                }}
                className="w-full rounded px-3 py-1.5 text-left text-slate-700 hover:bg-slate-100 hover:text-slate-900"
              >
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </span>
  );
}
