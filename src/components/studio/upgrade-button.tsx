"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { PlanId } from "@/server/studio/plans";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

/**
 * Starts a Razorpay subscription checkout.
 *
 * The Razorpay script is loaded on demand rather than in the root layout —
 * the 120 free-tool pages have no reason to ship a payments SDK.
 */
export function UpgradeButton({
  plan,
  planName,
  enabled,
  cycle = "monthly",
  className,
  label,
}: {
  plan: PlanId;
  planName: string;
  enabled: boolean;
  cycle?: "monthly" | "yearly";
  className?: string;
  label?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (plan === "free") {
    return (
      <Link
        href="/studio/app/new"
        className={
          className ??
          "block rounded-md border border-slate-300 px-4 py-2 text-center text-sm font-semibold text-slate-700 hover:border-slate-400"
        }
      >
        Start free
      </Link>
    );
  }

  async function loadRazorpay(): Promise<boolean> {
    if (window.Razorpay) return true;
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  async function upgrade() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/studio/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, cycle }),
      });

      if (res.status === 401) {
        router.push(`/studio/signin?next=${encodeURIComponent("/studio/pricing")}`);
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not start checkout.");
        return;
      }

      if (!(await loadRazorpay())) {
        setError("Could not load the payment window. Check your connection.");
        return;
      }

      new window.Razorpay!({
        key: data.keyId,
        subscription_id: data.subscriptionId,
        name: "Avexora Brand Studio",
        description: `${data.planName} plan`,
        theme: { color: "#4f46e5" },
        handler: () => router.push("/studio/app?upgraded=1"),
      }).open();
    } catch {
      setError("Could not start checkout.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={upgrade}
        disabled={busy || !enabled}
        className={
          className ??
          "w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        }
      >
        {busy ? "Starting…" : (label ?? `Choose ${planName}`)}
      </button>
      {!enabled && (
        <p className="mt-2 text-xs text-slate-500">Checkout not configured</p>
      )}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
