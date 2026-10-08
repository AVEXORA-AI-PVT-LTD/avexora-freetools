"use client";

import React from "react";
import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => {
        if (typeof window !== "undefined") {
          window.print();
        }
      }}
      className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-xs font-mono font-semibold text-stone-700 shadow-2xs transition cursor-pointer"
    >
      <Printer className="w-3.5 h-3.5 text-stone-500" />
      <span>Print Overview</span>
    </button>
  );
}
