/**
 * Minimal, dependency-free persistence for the sign-in download resume flow.
 *
 * Three kinds of resume are supported, matched to the result shape:
 *
 * 1. `text` — generated text documents (generator shape). Stored in
 *    sessionStorage (JSON string of the document), rehydrated on mount.
 * 2. `state` — arbitrary small JSON state (e.g. barcode generation inputs)
 *    that a tool needs to restore after returning from sign-in. Stored in
 *    sessionStorage under a per-path key.
 * 3. `blob` — real binary results (PDF/image/archive blobs). Stored in
 *    IndexedDB because sessionStorage cannot serialise Blobs and is too small
 *    for large files. Consumed asynchronously.
 *
 * Everything here is wrapped so a private-mode browser (or a server render
 * that lacks the APIs) degrades to a no-op instead of crashing the tool.
 */

export interface DownloadResume {
  path: string;
  text: string;
  filename?: string;
}

export const RESUME_KEY = "ft_resume_download";
export const STATE_RESUME_PREFIX = "ft_resume_state_";

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

/* -----------------------------------------------------------------------
 * State resume — small JSON serialised to sessionStorage.
 * Used for tools whose "result" is re-derivable from lightweight inputs
 * (e.g. barcode specs, lastNorm) where serialising a Blob is unnecessary.
 * --------------------------------------------------------------------- */

function stateKey(path: string): string {
  return STATE_RESUME_PREFIX + path;
}

/** Persist an arbitrary JSON-serialisable state blob for this path. */
export function saveStateResume(state: unknown, path: string, storage?: StorageLike): boolean {
  const s = resolveStorage(storage);
  if (!s) return false;
  try {
    s.setItem(stateKey(path), JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

/** Consume (read + clear) saved state for this path. Returns null when nothing is found. */
export function consumeStateResume<T = unknown>(path: string, storage?: StorageLike): T | null {
  const s = resolveStorage(storage);
  if (!s) return null;
  try {
    const raw = s.getItem(stateKey(path));
    if (!raw) return null;
    s.removeItem(stateKey(path));
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/* -----------------------------------------------------------------------
 * Blob resume — real binary files (PDF / image / archive) stored in
 * IndexedDB so large blobs do not hit sessionStorage limits and are not
 * serialised.  IndexedDB is asynchronous; all functions here are
 * Promise-based.
 * --------------------------------------------------------------------- */

export interface BlobDownloadResume {
  path: string;
  blob: Blob;
  filename: string;
  /** Secondary files that belong to the same download (e.g. split PDF parts two). */
  extras?: Array<{ blob: Blob; filename: string }>;
}

const BLOB_DB = "avex_tools";
const BLOB_DB_VERSION = 1;
const BLOB_STORE = "download_resume";

function openBlobDb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    try {
      if (typeof indexedDB === "undefined") { resolve(null); return; }
      const req = indexedDB.open(BLOB_DB, BLOB_DB_VERSION);
      req.onupgradeneeded = () => {
        try {
          const db = req.result;
          if (!db.objectStoreNames.contains(BLOB_STORE)) {
            db.createObjectStore(BLOB_STORE, { keyPath: "path" });
          }
        } catch { /* swallow — readonly upgrade handler */ }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

function idbTx(db: IDBDatabase, mode: IDBTransactionMode = "readonly"): IDBObjectStore {
  return db.transaction(BLOB_STORE, mode).objectStore(BLOB_STORE);
}

function idbPut(db: IDBDatabase, entry: BlobDownloadResume): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = idbTx(db, "readwrite").put(entry);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

function idbGet(db: IDBDatabase, path: string): Promise<BlobDownloadResume | null> {
  return new Promise((resolve) => {
    const req = idbTx(db).get(path);
    req.onsuccess = () => resolve((req.result as BlobDownloadResume) ?? null);
    req.onerror = () => resolve(null);
  });
}

function idbDelete(db: IDBDatabase, path: string): Promise<void> {
  return new Promise((resolve) => {
    const req = idbTx(db, "readwrite").delete(path);
    req.onsuccess = () => resolve();
    req.onerror = () => resolve();
  });
}

/** Persist a blob for later download after sign-in. Returns false on failure. */
export async function saveBlobDownloadResume(entry: BlobDownloadResume): Promise<boolean> {
  const db = await openBlobDb();
  if (!db) return false;
  try {
    await idbPut(db, entry);
    return true;
  } catch {
    return false;
  }
}

/** Consume (read + delete) the blob for this path. Returns null when nothing is found. */
export async function consumeBlobDownloadResume(path: string): Promise<BlobDownloadResume | null> {
  const db = await openBlobDb();
  if (!db) return null;
  try {
    const entry = await idbGet(db, path);
    if (entry) await idbDelete(db, path);
    return entry;
  } catch {
    return null;
  }
}

/** Peek (read without deleting) the blob for this path. */
export async function peekBlobDownloadResume(path: string): Promise<BlobDownloadResume | null> {
  const db = await openBlobDb();
  if (!db) return null;
  try {
    return await idbGet(db, path);
  } catch {
    return null;
  }
}