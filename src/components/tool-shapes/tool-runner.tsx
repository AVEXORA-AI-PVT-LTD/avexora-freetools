"use client";

import { useEffect, useState } from "react";
import type { CategorySlug, ToolConfig } from "@/tools/types";
import { categoryLoaders } from "@/tools/client-loaders";
import { CalculatorShape } from "./calculator-shape";
import { GeneratorShape } from "./generator-shape";
import { FileToolShape } from "./file-tool-shape";
import { AiWriterShape } from "./ai-writer-shape";

/**
 * Client-side dispatcher: dynamically imports only this category's configs
 * (see client-loaders.ts) and renders the tool via its shape renderer.
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

  useEffect(() => {
    let active = true;
    categoryLoaders[category]().then((mod) => {
      if (active) setTool(mod.tools.find((t) => t.slug === slug) ?? null);
    });
    return () => {
      active = false;
    };
  }, [category, slug]);

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
