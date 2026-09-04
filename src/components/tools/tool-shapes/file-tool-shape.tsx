"use client";

import type { FileTool } from "@/types/tools";

export function FileToolShape({ tool }: { tool: FileTool }) {
  const Component = tool.component;
  return <Component />;
}
