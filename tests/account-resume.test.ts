import { describe, expect, it } from "vitest";
import {
  RESUME_KEY,
  consumeDownloadResume,
  peekDownloadResume,
  saveDownloadResume,
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