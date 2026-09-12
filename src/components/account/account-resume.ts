/**
 * Minimal, dependency-free persistence for the sign-in download resume flow.
 *
 * When a visitor on an auth-required tool clicks "Download" the generator
 * shape writes the generated document into sessionStorage (same-origin,
 * per-tab) and then sends them to /studio/signin. After signing in, Auth.js
 * redirects back to the same tool URL; the shape reads the saved document on
 * mount and restores it so the download can continue without regenerating.
 *
 * Everything here is a pure function over a `Storage`-like object so it can be
 * unit-tested without a browser, and every call is wrapped so a private-mode
 * browser (or server render) that throws on sessionStorage access degrades to
 * a no-op instead of crashing the tool.
 */

export interface DownloadResume {
  path: string;
  text: string;
  filename?: string;
}

export const RESUME_KEY = "ft_resume_download";

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function resolveStorage(storage?: StorageLike): StorageLike | null {
  if (storage) return storage;
  try {
    return globalThis.sessionStorage ?? null;
  } catch {
    return null;
  }
}

function read(payload: unknown): DownloadResume | null {
  if (!payload || typeof payload !== "object") return null;
  const p = payload as Record<string, unknown>;
  if (typeof p.path !== "string" || typeof p.text !== "string") return null;
  return {
    path: p.path,
    text: p.text,
    filename: typeof p.filename === "string" ? p.filename : undefined,
  };
}

/** Save a pending download to resume after sign-in. Returns false if storage unavailable. */
export function saveDownloadResume(payload: DownloadResume, storage?: StorageLike): boolean {
  const s = resolveStorage(storage);
  if (!s) return false;
  try {
    s.setItem(RESUME_KEY, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

/** Read any saved resume for this path without removing it. */
export function peekDownloadResume(path: string, storage?: StorageLike): DownloadResume | null {
  const s = resolveStorage(storage);
  if (!s) return null;
  try {
    const raw = s.getItem(RESUME_KEY);
    if (!raw) return null;
    const parsed = read(JSON.parse(raw));
    if (!parsed || parsed.path !== path) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Read and clear any saved resume for this path. */
export function consumeDownloadResume(path: string, storage?: StorageLike): DownloadResume | null {
  const s = resolveStorage(storage);
  if (!s) return null;
  try {
    const raw = s.getItem(RESUME_KEY);
    if (!raw) return null;
    const parsed = read(JSON.parse(raw));
    if (!parsed || parsed.path !== path) return null;
    s.removeItem(RESUME_KEY);
    return parsed;
  } catch {
    return null;
  }
}