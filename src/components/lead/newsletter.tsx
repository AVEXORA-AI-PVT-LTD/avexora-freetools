"use client";

import { useState } from "react";
import { submitLead } from "./client";

export function NewsletterBlock({
  toolSlug,
  category,
}: {
  toolSlug: string;
  category: string;
}) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");

  if (state === "done") {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center text-sm font-medium text-emerald-800 print:hidden">
        You&apos;re subscribed! Look out for practical business tips from Avexora.
      </div>
    );
  }

  return (
    <form
      className="rounded-xl border border-slate-200 bg-slate-50 p-6 print:hidden"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          setState("error");
          return;
        }
        setState("busy");
        const ok = await submitLead({ event: "newsletter", toolSlug, category, email });
        setState(ok ? "done" : "error");
      }}
    >
      <h2 className="text-base font-semibold text-slate-900">
        Get one practical business tip every week
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Tools, templates and tactics for running your business — free, no spam.
      </p>
      <div className="mt-3 flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          aria-label="Email address"
          className="w-full max-w-xs rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={state === "busy"}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {state === "busy" ? "…" : "Subscribe"}
        </button>
      </div>
      {state === "error" && (
        <p className="mt-2 text-sm text-red-600">
          Please enter a valid email and try again.
        </p>
      )}
    </form>
  );
}
