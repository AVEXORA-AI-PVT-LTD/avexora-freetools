/**
 * Shared guard for `next` / `redirectTo` query values. Only same-origin
 * pathname redirects are ever honoured so a crafted `?next=` can never turn a
 * sign-in redirect into an open redirect. Protocol-relative (`//`) and fully
 * qualified URLs fall back to `fallback`.
 */
export function safeRedirectPath(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
}