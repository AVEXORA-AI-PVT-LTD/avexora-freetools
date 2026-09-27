"use client";

/**
 * Client-side helper to record tool execution metrics in real-time.
 * Uses navigator.sendBeacon or fetch with keepalive so that tracking payloads
 * reliably reach the server even if the user navigates away or closes the tab.
 */
export async function trackToolExecution(
  toolSlug: string,
  executionTimeMs?: number,
  isSuccess: boolean = true
) {
  if (!toolSlug) return;
  try {
    const payload = JSON.stringify({ toolSlug, executionTimeMs, isSuccess });

    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      const blob = new Blob([payload], { type: "application/json" });
      const sent = navigator.sendBeacon("/api/analytics/track", blob);
      if (sent) return;
    }

    await fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    });
  } catch (err) {
    console.error("Failed to track tool execution:", err);
  }
}
