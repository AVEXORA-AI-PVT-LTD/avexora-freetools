"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

/** Called just before navigating to sign-in so the caller can persist state. */
export type GatePersist = () => void;

/**
 * Download auth gate (spec §8). Composes with the existing lead email gate:
 * `requireAuth` (sign-in required) runs first, then `emailGate` if set.
 *
 * Flow for a logged-out visitor:
 *   1. Click Download → `authGate(proceed, persist)` stores the pending action,
 *      runs `persist()` (the generator shape saves its output so it survives
 *      the round trip) and shows the "sign in to download" prompt.
 *   2. "Continue to sign in" → /studio/signin?next=<current-path>. Auth.js
 *      redirects back to the same tool after signing in (Google or magic link).
 *   3. The shape rehydrates the saved output on mount; the next Download click
 *      now passes the gate and runs in place — the result is never lost.
 *
 * While the session is still resolving a click is buffered and completed as
 * soon as the status settles, so the gate never guesses.
 */
export function useAuthGate(requireAuth: boolean): {
  authGate: (proceed: () => void, persist?: GatePersist) => void;
  modal: React.ReactNode;
} {
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const pendingRef = useRef<{ proceed: () => void; persist?: GatePersist } | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const primaryRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    primaryRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const authGate = useCallback(
    (proceed: () => void, persist?: GatePersist) => {
      if (!requireAuth) {
        proceed();
        return;
      }
      if (status === "authenticated") {
        proceed();
        return;
      }
      pendingRef.current = { proceed, persist };
      if (status === "unauthenticated") {
        persist?.();
        // The closure cannot survive the sign-in navigation, so the decision is
        // made here: prompt now and let the restored result drive the retry.
        pendingRef.current = null;
        setOpen(true);
      }
      // status === "loading": wait — the effect below resolves the pending click.
    },
    [requireAuth, status],
  );

  useEffect(() => {
    if (status === "loading" || !pendingRef.current) return;
    const pending = pendingRef.current;
    pendingRef.current = null;
    // Resolve the buffered click after this commit finishes (avoids setting
    // state synchronously from the effect body).
    queueMicrotask(() => {
      if (status === "authenticated") {
        pending.proceed();
      } else {
        pending.persist?.();
        setOpen(true);
      }
    });
  }, [status]);

  const goToSignIn = useCallback(() => {
    setOpen(false);
    router.push(`/studio/signin?next=${encodeURIComponent(pathname)}`);
  }, [router, pathname]);

  const modal = open ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 print:hidden">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="authGateTitle"
        tabIndex={-1}
        className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl"
      >
        <h2 id="authGateTitle" className="text-lg font-semibold text-slate-900">
          Sign in to download
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Save and manage this document in your account. One account works
          across Avexora Tools and Brand Studio — sign in with Google or an email
          magic link. Your result is kept ready — you&apos;ll download it right
          after signing in.
        </p>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            ref={primaryRef}
            onClick={goToSignIn}
            className="flex-1 rounded-md bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
          >
            Continue to sign in
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return { authGate, modal };
}