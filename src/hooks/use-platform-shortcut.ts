"use client";

import { useEffect, useState } from "react";

/**
 * Hook to detect the user's OS and return the appropriate keyboard shortcut.
 * - Mac / iOS: '⌘K' (Cmd+K)
 * - Windows / Linux: 'Ctrl K' (Ctrl+K)
 */
export function usePlatformShortcut() {
  const [isMac, setIsMac] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const nav = window.navigator as {
        userAgentData?: { platform?: string };
        platform?: string;
        userAgent?: string;
      };

      const platform =
        nav.userAgentData?.platform ||
        nav.platform ||
        nav.userAgent ||
        "";

      const isApple = /(Mac|iPhone|iPod|iPad)/i.test(platform);
      setIsMac(isApple);
    } catch {
      // Fallback to true (Mac style) if detection fails
      setIsMac(true);
    }
  }, []);

  return {
    isMac,
    shortcutSymbol: isMac ? "⌘K" : "Ctrl K",
    shortcutText: isMac ? "Cmd+K" : "Ctrl+K",
  };
}
