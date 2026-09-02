"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { ToolConfig } from "@/tools/types";
import { submitLead } from "@/lib/leads-client";

const STORAGE_KEY = "ft_gate_email";

/** Lets custom tool components trigger the gate owned by their shape wrapper. */
const GateContext = createContext<(proceed: () => void) => void>((proceed) => proceed());

export const GateProvider = GateContext.Provider;

export function useToolGate() {
  return useContext(GateContext);
}

function hasUnlocked(): boolean {
  try {
    return Boolean(localStorage.getItem(STORAGE_KEY));
  } catch {
    return false;
  }
}

/**
 * Email gate for document downloads (spec §4). `requireEmail(proceed)` runs
 * `proceed` immediately if the visitor already unlocked once on this browser,
 * otherwise shows the email modal first. Render `modal` alongside the tool.
 */
export function useEmailGate(tool: Pick<ToolConfig, "slug" | "category" | "emailGate">): {
  requireEmail: (proceed: () => void) => void;
  modal: ReactNode;
} {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pendingRef = useRef<(() => void) | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  // Accessible modal behaviour: move focus into the dialog when it opens,
  // restore it to the triggering element when it closes, keep focus inside
  // while Tabbing, and let Escape close the dialog.
  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    emailRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      setOpen(false);
      pendingRef.current = null;
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [open]);

  const trapFocus = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== "Tab" || !dialogRef.current) return;
    const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }, []);

  const requireEmail = useCallback(
    (proceed: () => void) => {
      if (!tool.emailGate || hasUnlocked()) {
        proceed();
        return;
      }
      pendingRef.current = proceed;
      setOpen(true);
    },
    [tool.emailGate],
  );

  const submit = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setBusy(true);
    setError(null);
    const ok = await submitLead({
      event: "email_gate",
      toolSlug: tool.slug,
      category: tool.category,
      email,
      ...(name.trim() && { name: name.trim() }),
    });
    setBusy(false);
    if (!ok) {
      setError("Something went wrong. Please try again.");
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, email);
    } catch {
      // private mode — gate will just show again next time
    }
    setOpen(false);
    pendingRef.current?.();
    pendingRef.current = null;
  };

  const modal = open ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 print:hidden">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="emailGateTitle"
        aria-describedby="emailGateDesc"
        onKeyDown={trapFocus}
        className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl"
      >
        <h2 id="emailGateTitle" className="text-lg font-semibold text-slate-900">
          Almost there!
        </h2>
        <p id="emailGateDesc" className="mt-1 text-sm text-slate-600">
          Enter your email to download your document. It&apos;s free — we&apos;ll also send
          you occasional business tips from Avexora.
        </p>
        <div className="mt-4 space-y-3">
          <div>
            <label
              htmlFor="emailGateName"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Your name (optional)
            </label>
            <input
              id="emailGateName"
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label
              htmlFor="emailGateEmail"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Email address
            </label>
            <input
              id="emailGateEmail"
              ref={emailRef}
              type="email"
              required
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "emailGateError" : undefined}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
          {error && (
            <p id="emailGateError" role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={submit}
              disabled={busy}
              className="flex-1 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {busy ? "Please wait…" : "Unlock download"}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                pendingRef.current = null;
              }}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  return { requireEmail, modal };
}
