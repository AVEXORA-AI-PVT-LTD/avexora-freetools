import { describe, expect, it } from "vitest";
import {
  RESUME_KEY,
  consumeBlobDownloadResume,
  consumeDownloadResume,
  consumeStateResume,
  peekBlobDownloadResume,
  peekDownloadResume,
  saveBlobDownloadResume,
  saveDownloadResume,
  saveStateResume,
  type BlobDownloadResume,
  type DownloadResume,
} from "@/components/account/account-resume";

function mockStorage() {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
    _map: m,
  };
}

const payload: DownloadResume = { path: "/invoicing-billing/quotation-generator", text: "hello", filename: "quotation.txt" };

describe("account-resume (sessionStorage download resume)", () => {
  it("round-trips a payload for the matching path", () => {
    const s = mockStorage();
    expect(saveDownloadResume(payload, s)).toBe(true);
    expect(peekDownloadResume(payload.path, s)).toEqual(payload);
    expect(s.getItem(RESUME_KEY)).toBeTruthy();
  });

  it("consume returns the payload and clears the entry", () => {
    const s = mockStorage();
    saveDownloadResume(payload, s);
    expect(consumeDownloadResume(payload.path, s)).toEqual(payload);
    expect(s.getItem(RESUME_KEY)).toBeNull();
    expect(consumeDownloadResume(payload.path, s)).toBeNull();
  });

  it("peek/consume ignore a resume saved for a different path", () => {
    const s = mockStorage();
    saveDownloadResume(payload, s);
    expect(peekDownloadResume("/pdf-tools/other", s)).toBeNull();
    expect(consumeDownloadResume("/pdf-tools/other", s)).toBeNull();
    expect(s.getItem(RESUME_KEY)).toBeTruthy();
    expect(consumeDownloadResume(payload.path, s)).toEqual(payload);
  });

  it("does not throw on malformed stored JSON", () => {
    const s = mockStorage();
    (s as { setItem: (k: string, v: string) => void }).setItem(RESUME_KEY, "{not json");
    expect(peekDownloadResume(payload.path, s)).toBeNull();
    expect(consumeDownloadResume(payload.path, s)).toBeNull();
  });

  it("rejects structurally-invalid payloads (missing text or path)", () => {
    const s = mockStorage();
    (s as { setItem: (k: string, v: string) => void }).setItem(RESUME_KEY, JSON.stringify({ path: "/x" }));
    expect(peekDownloadResume("/x", s)).toBeNull();
  });

  it("no-ops gracefully when sessionStorage is unavailable or throws (private mode)", () => {
    const throwing = {
      getItem: (): string => {
        throw new Error("denied");
      },
      setItem: (): void => {
        throw new Error("denied");
      },
      removeItem: (): void => {
        throw new Error("denied");
      },
    };
    expect(saveDownloadResume(payload, throwing)).toBe(false);
    expect(peekDownloadResume(payload.path, throwing)).toBeNull();
    expect(consumeDownloadResume(payload.path, throwing)).toBeNull();
  });
});
/* ---------------------------------------------------------------------------
 * State resume (sessionStorage-backed) and blob resume (IndexedDB-backed)
 * ------------------------------------------------------------------------- */

describe("account-resume (state resume)", () => {
  it("round-trips JSON state for a path and consumes it once", () => {
    const s = mockStorage();
    const state = { lastNorm: { identifier: "PAPAD-001" }, outputFormat: "png" };
    expect(saveStateResume(state, "/tools/barcode-generator", s)).toBe(true);
    expect(consumeStateResume("/tools/barcode-generator", s)).toEqual(state);
    expect(consumeStateResume("/tools/barcode-generator", s)).toBeNull();
  });

  it("keeps saved state isolated per path", () => {
    const s = mockStorage();
    saveStateResume({ a: 1 }, "/x", s);
    expect(consumeStateResume("/y", s)).toBeNull();
    expect(consumeStateResume("/x", s)).toEqual({ a: 1 });
  });

  it("returns null on malformed JSON and never throws", () => {
    const s = mockStorage();
    (s as { setItem: (k: string, v: string) => void }).setItem(
      "ft_resume_state_/z",
      "{bad json",
    );
    expect(consumeStateResume("/z", s)).toBeNull();
  });
});

/** Minimal in-memory IndexedDB stub exposing only the API surface used by
 *  account-resume's blob helpers (open / objectStore get / put / delete). */
function installFakeIndexedDB() {
  const store = new Map<string, BlobDownloadResume>();

  const request = <T>(op: () => T) => {
    const req: any = { result: undefined as T, error: null };
    let run = () => {
      try {
        req.result = op();
        req.onsuccess?.();
      } catch (err) {
        req.error = err;
        req.onerror?.();
      }
    };
    queueMicrotask(run);
    return req;
  };

  const objectStore = () => ({
    put: (entry: BlobDownloadResume) =>
      request(() => {
        store.set(entry.path, entry);
      }),
    get: (path: string) => request(() => store.get(path) ?? null),
    delete: (path: string) =>
      request(() => {
        store.delete(path);
      }),
  });

  const db: any = {
    objectStoreNames: { contains: () => true },
    createObjectStore: () => {},
    transaction: () => ({ objectStore }),
  };

  (globalThis as Record<string, unknown>).indexedDB = {
    open: () => {
      const req: any = { result: db, error: null };
      queueMicrotask(() => req.onsuccess?.());
      return req;
    },
  } as unknown as IDBFactory;

  return store;
}

describe("account-resume (blob resume)", () => {
  const blobEntry: BlobDownloadResume = {
    path: "/tools/merge-pdf",
    blob: new Blob(["%PDF-1.4 fake"], { type: "application/pdf" }),
    filename: "merged.pdf",
    extras: [{ blob: new Blob(["part2"]), filename: "merged-part2.pdf" }],
  };

  it("round-trips a blob (with extras) via IndexedDB and consumes it once", async () => {
    installFakeIndexedDB();
    expect(await saveBlobDownloadResume(blobEntry)).toBe(true);
    expect(await peekBlobDownloadResume(blobEntry.path)).toEqual(blobEntry);
    const consumed = await consumeBlobDownloadResume(blobEntry.path);
    expect(consumed).toEqual(blobEntry);
    expect(await consumeBlobDownloadResume(blobEntry.path)).toBeNull();
  });

  it("peek does not delete the stored blob", async () => {
    installFakeIndexedDB();
    await saveBlobDownloadResume(blobEntry);
    expect((await peekBlobDownloadResume(blobEntry.path))?.filename).toBe("merged.pdf");
    expect((await consumeBlobDownloadResume(blobEntry.path))?.filename).toBe("merged.pdf");
  });

  it("returns its null/no-op fallbacks when IndexedDB is unavailable", async () => {
    delete (globalThis as Record<string, unknown>).indexedDB;
    expect(await saveBlobDownloadResume(blobEntry)).toBe(false);
    expect(await peekBlobDownloadResume(blobEntry.path)).toBeNull();
    expect(await consumeBlobDownloadResume(blobEntry.path)).toBeNull();
  });
});
