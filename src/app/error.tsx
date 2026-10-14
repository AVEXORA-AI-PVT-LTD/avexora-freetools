"use client";

import { useEffect } from "react";
import Link from "next/link";
import { HeaderNav } from "@/components/editorial/header-nav";
import { FooterSection } from "@/components/editorial/footer-section";
import { AlertTriangle, RotateCcw, Home, Layers } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error securely
    console.error("[Application Error Caught]:", error);
    try {
      fetch("/api/errors/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: error.message,
          digest: error.digest,
          url: window.location.href,
        }),
      }).catch(() => {});
    } catch {}
  }, [error]);

  return (
    <div className="min-h-screen bg-white text-stone-900 font-sans selection:bg-orange-500 selection:text-white flex flex-col justify-between relative">
      <div className="absolute inset-0 bg-matrix-grid opacity-35 pointer-events-none" />
      <HeaderNav />

      <div className="flex-1 pt-24 sm:pt-28 pb-16 relative z-10 flex flex-col justify-center">
        <main className="mx-auto max-w-xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          
          <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-sm">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900">
              Something went wrong while processing your request
            </h1>
            <p className="text-sm text-stone-600 leading-relaxed max-w-md mx-auto">
              An unexpected error occurred during execution. Your data has not been modified.
              Please try reloading or return to the main directory.
            </p>
          </div>

          {error.digest && (
            <div className="text-[11px] font-mono text-stone-400 bg-stone-50 border border-stone-200/80 px-3 py-1.5 rounded-lg inline-block">
              Reference Code: {error.digest}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => reset()}
              type="button"
              className="px-6 py-2.5 rounded-xl bg-orange-600 text-white hover:bg-orange-700 font-semibold text-sm shadow-md shadow-orange-500/20 transition flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Try Again</span>
            </button>

            <Link
              href="/"
              className="px-6 py-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-800 font-semibold text-sm shadow-xs transition flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              <span>Return to Homepage</span>
            </Link>

            <Link
              href="/#categories-showcase"
              className="px-6 py-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-800 font-semibold text-sm shadow-xs transition flex items-center gap-2"
            >
              <Layers className="w-4 h-4 text-orange-600" />
              <span>Browse Tools</span>
            </Link>
          </div>

        </main>
      </div>

      <FooterSection />
    </div>
  );
}
