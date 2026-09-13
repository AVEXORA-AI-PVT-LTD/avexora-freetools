"use client";

import { useEffect, useState } from "react";
import type { CategorySlug, ToolConfig } from "@/types/tools";
import { categoryLoaders } from "./client-loaders";
import { CalculatorShape } from "./calculator-shape";
import { GeneratorShape } from "./generator-shape";
import { FileToolShape } from "./file-tool-shape";
import { AiWriterShape } from "./ai-writer-shape";

/**
 * Client-side dispatcher: dynamically imports only this category's configs
 * (see client-loaders.ts) and renders the tool via its shape renderer.
 *
 * The category config is loaded with a dynamic `import()`. If that chunk fails
 * to load (network error, chunk-load error, etc.) the promise rejects; without
 * a catch the tool would stay `null` and the loading skeleton would remain on
 * screen forever. This component instead surfaces a load error with a retry so
 * the page can never get stuck in a loading state.
 */
export function ToolRunner({
  category,
  slug,
  aiEnabled = false,
  isDynamic = false,
}: {
  category: CategorySlug;
  slug: string;
  aiEnabled?: boolean;
  isDynamic?: boolean;
}) {
  const [tool, setTool] = useState<ToolConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (isDynamic) return; // Dynamic tools don't have a client-side module to load

    let active = true;
    categoryLoaders[category]()
      .then((mod) => {
        if (active) {
          setTool(mod.tools.find((t) => t.slug === slug) ?? null);
          setError(null);
        }
      })
      .catch(() => {
        if (active) {
          setTool(null);
          setError("This tool failed to load. Check your connection and try again.");
        }
      });
    return () => {
      active = false;
    };
  }, [category, slug, attempt]);

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-700">
        <p className="font-semibold">This tool failed to load.</p>
        <p className="mt-1">Check your connection and try again.</p>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setAttempt((a) => a + 1);
          }}
          className="mt-3 rounded-md bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
        >
          Try again
        </button>
      </div>
    );
  }

  if (isDynamic) {
    return (
      <div className="rounded-lg border border-orange-200 bg-orange-50 p-8 text-center text-orange-800">
        <svg className="mx-auto h-12 w-12 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <h3 className="mt-2 text-lg font-semibold text-orange-900">Tool Under Construction</h3>
        <p className="mt-1 text-sm text-orange-700">
          This tool has been registered but is not yet fully configured with a functional renderer. Please check back later.
        </p>
      </div>
    );
  }

  if (!tool) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-10 rounded-md bg-slate-100" />
        <div className="h-10 rounded-md bg-slate-100" />
        <div className="h-24 rounded-md bg-slate-100" />
      </div>
    );
  }

  switch (tool.kind) {
    case "calculator":
      return <CalculatorShape tool={tool} />;
    case "generator":
      return <GeneratorShape tool={tool} />;
    case "file-tool":
      return <FileToolShape tool={tool} />;
    case "ai-writer":
      return <AiWriterShape tool={tool} aiEnabled={aiEnabled} />;
  }
}
