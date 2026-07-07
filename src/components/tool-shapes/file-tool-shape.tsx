"use client";

import type { FileTool } from "@/tools/types";

export function FileToolShape({ tool }: { tool: FileTool }) {
  const Component = tool.component;
  return <Component />;
}
