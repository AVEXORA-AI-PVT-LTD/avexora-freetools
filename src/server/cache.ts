type Entry<T> = { promise: Promise<T>; expires: number };

const store = new Map<string, Entry<unknown>>();

/**
 * Short-lived in-memory memoization for read-mostly DB config lookups
 * (ToolConfig / CategoryConfig / DynamicTool overrides).
 *
 * Root layout, the homepage, every category page and every one of the
 * ~180 statically generated [category]/[slug] pages each call
 * getEffectiveCategories()/getEffectiveTools() with no request-level
 * dedupe, which floods MongoDB with thousands of redundant round trips
 * during `next build` (single worker) and trips the 60s per-page static
 * generation timeout. A short TTL collapses that storm to a handful of
 * queries while still keeping admin-panel status/priority changes visible
 * within a few seconds at runtime.
 */
export function memoize<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const hit = store.get(key) as Entry<T> | undefined;
  if (hit && hit.expires > Date.now()) return hit.promise;

  const promise = fn();
  store.set(key, { promise, expires: Date.now() + ttlMs });
  // Don't let a failed lookup poison the cache for the rest of the TTL window.
  promise.catch(() => store.delete(key));
  return promise;
}
