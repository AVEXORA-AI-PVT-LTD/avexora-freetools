"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";

interface NavAccountProps {
  onOpenAuth?: () => void;
}

export function NavAccount({ onOpenAuth }: NavAccountProps) {
  const { status, data } = useSession();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const current = (document.documentElement.dataset.theme as "light" | "dark") || "light";
    setTheme(current);
  }, []);

  const setThemeExplicit = useCallback((mode: "light" | "dark") => {
    setTheme(mode);
    document.documentElement.dataset.theme = mode;
    try {
      localStorage.setItem("avexora-theme", mode);
    } catch {}
    const m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute("content", mode === "dark" ? "#08090b" : "#ffffff");

    // Also sync design_2 theme buttons if present
    document.querySelectorAll("[data-theme-set]").forEach((btn) => {
      btn.setAttribute("aria-pressed", String((btn as HTMLElement).dataset.themeSet === mode));
    });
    document.querySelectorAll("[data-theme-toggle]").forEach((btn) => {
      btn.setAttribute("aria-pressed", String(mode === "dark"));
    });
  }, []);

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
      <span className="inline-block h-8 w-8 rounded-full bg-[var(--surface-3)] animate-pulse" />
    );
  }

  if (status === "unauthenticated") {
    if (onOpenAuth) {
      return (
        <button
          className="btn btn-ghost btn-sm"
          type="button"
          onClick={onOpenAuth}
        >
          Log in
        </button>
      );
    }
    return (
      <Link
        href={`/studio/signin?next=${encodeURIComponent(pathname)}`}
        className="btn btn-ghost btn-sm"
      >
        Log in
      </Link>
    );
  }

  const userInitial = data?.user?.name
    ? data.user.name.charAt(0).toUpperCase()
    : data?.user?.email
    ? data.user.email.charAt(0).toUpperCase()
    : "A";

  return (
    <div className="relative inline-flex items-center" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Account menu"
        className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--btn-solid)] text-[var(--btn-solid-ink)] font-semibold text-xs shadow-xs hover:opacity-90 transition-all border border-[var(--border)] focus:outline-none"
      >
        {userInitial}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Account"
          className="absolute right-0 top-full mt-2 w-64 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-2 text-xs shadow-2xl text-[var(--text)] z-50 animate-in fade-in slide-in-from-top-2 duration-150"
        >
          {/* User info badge */}
          <div className="rounded-lg bg-[var(--surface-3)] border border-[var(--border)] p-3 mb-1.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--btn-solid)] text-[var(--btn-solid-ink)] font-bold text-xs shrink-0 shadow-xs">
                {userInitial}
              </div>
              <div className="min-w-0 flex-1">
                {data?.user?.name && (
                  <p className="truncate font-semibold text-[var(--text)]">
                    {data.user.name}
                  </p>
                )}
                {data?.user?.email && (
                  <p className="truncate text-[11px] text-[var(--text-3)]">
                    {data.user.email}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Links */}
          <div className="space-y-0.5 font-medium text-[var(--text-2)]">
            <Link
              href="/studio/app"
              className="flex items-center gap-2.5 w-full rounded-lg px-2.5 py-1.5 hover:bg-[var(--surface-3)] hover:text-[var(--text)] transition-colors group"
              onClick={() => setOpen(false)}
            >
              <svg className="w-4 h-4 text-[var(--text-3)] group-hover:text-[var(--text)] shrink-0 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
              <span>Studio Dashboard</span>
            </Link>
            <Link
              href="/studio/pricing"
              className="flex items-center gap-2.5 w-full rounded-lg px-2.5 py-1.5 hover:bg-[var(--surface-3)] hover:text-[var(--text)] transition-colors group"
              onClick={() => setOpen(false)}
            >
              <svg className="w-4 h-4 text-[var(--text-3)] group-hover:text-[var(--text)] shrink-0 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                <line x1="7" y1="7" x2="7.01" y2="7" />
              </svg>
              <span>Plans & Pricing</span>
            </Link>
            <Link
              href="/studio/account"
              className="flex items-center gap-2.5 w-full rounded-lg px-2.5 py-1.5 hover:bg-[var(--surface-3)] hover:text-[var(--text)] transition-colors group"
              onClick={() => setOpen(false)}
            >
              <svg className="w-4 h-4 text-[var(--text-3)] group-hover:text-[var(--text)] shrink-0 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              <span>Account Settings</span>
            </Link>
          </div>

          {/* Theme switcher */}
          <div className="border-t border-[var(--border)] mt-1.5 pt-1.5">
            <div className="px-2 py-1">
              <p className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-3)] mb-1.5">Appearance</p>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setThemeExplicit("light")}
                  className={`flex-1 flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-all ${
                    theme === "light"
                      ? "bg-[var(--btn-solid)] text-[var(--btn-solid-ink)] shadow-xs"
                      : "bg-[var(--surface-3)] text-[var(--text-2)] hover:text-[var(--text)]"
                  }`}
                  aria-pressed={theme === "light"}
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                  </svg>
                  Light
                </button>
                <button
                  type="button"
                  onClick={() => setThemeExplicit("dark")}
                  className={`flex-1 flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-all ${
                    theme === "dark"
                      ? "bg-[var(--btn-solid)] text-[var(--btn-solid-ink)] shadow-xs"
                      : "bg-[var(--surface-3)] text-[var(--text-2)] hover:text-[var(--text)]"
                  }`}
                  aria-pressed={theme === "dark"}
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                  Dark
                </button>
              </div>
            </div>
          </div>

          {/* Sign out */}
          <div className="border-t border-[var(--border)] mt-1.5 pt-1.5">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                signOut({ callbackUrl: pathname });
              }}
              className="flex items-center gap-2 w-full rounded-lg px-2.5 py-1.5 text-xs text-[var(--err)] hover:bg-[var(--err-soft)] font-medium transition-colors text-left"
            >
              <svg className="w-4 h-4 text-[var(--err)] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>Sign out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
