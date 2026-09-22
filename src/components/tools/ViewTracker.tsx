"use client";

import { useEffect, useRef } from "react";
import { incrementToolViews } from "@/app/actions/tool-views";

export function ViewTracker({ toolSlug, categorySlug }: { toolSlug: string; categorySlug: string }) {
  const tracked = useRef(false);

  useEffect(() => {
    if (!tracked.current) {
      tracked.current = true;
      // Fire and forget
      incrementToolViews(toolSlug, categorySlug).catch(() => {});
    }
  }, [toolSlug, categorySlug]);

  return null;
}
