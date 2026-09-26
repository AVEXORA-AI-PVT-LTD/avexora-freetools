"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { recordPageViewAction } from "@/app/actions/analytics";

export function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) return;
    // Ignore internal admin & API routes to keep public analytics data accurate
    if (pathname.startsWith("/admin") || pathname.startsWith("/api")) return;

    const fullPath = searchParams.toString() ? `${pathname}?${searchParams.toString()}` : pathname;

    if (lastTrackedPath.current !== fullPath) {
      lastTrackedPath.current = fullPath;
      recordPageViewAction({
        path: pathname,
        referrer: typeof document !== "undefined" ? document.referrer : "",
      }).catch(console.error);
    }
  }, [pathname, searchParams]);

  return null;
}
