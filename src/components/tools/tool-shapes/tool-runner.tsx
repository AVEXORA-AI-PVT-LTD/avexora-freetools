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
}: {
  category: CategorySlug;
  slug: string;
  aiEnabled?: boolean;
}) {
  const [tool, setTool] = useState<ToolConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
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
          className="mt-3 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Try again
        </button>
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
