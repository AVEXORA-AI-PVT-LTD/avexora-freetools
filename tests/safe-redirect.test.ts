import { describe, expect, it } from "vitest";
import { safeRedirectPath } from "@/server/safe-redirect";

describe("safeRedirectPath (no open redirects)", () => {
  it("allows an in-app pathname", () => {
    expect(safeRedirectPath("/invoicing-billing/quotation-generator", "/studio/app")).toBe(
      "/invoicing-billing/quotation-generator",
    );
  });
  it("allows the root path", () => {
    expect(safeRedirectPath("/", "/studio/app")).toBe("/");
  });
  it("rejects fully-qualified external URLs", () => {
    expect(safeRedirectPath("https://evil.example/phish", "/studio/app")).toBe("/studio/app");
  });
  it("rejects protocol-relative URLs", () => {
    expect(safeRedirectPath("//evil.example/phish", "/studio/app")).toBe("/studio/app");
  });
  it("rejects scheme-less javascript-ish strings", () => {
    expect(safeRedirectPath("javascript:alert(1)", "/studio/app")).toBe("/studio/app");
  });
  it("falls back for non-string values", () => {
    expect(safeRedirectPath(undefined, "/studio/app")).toBe("/studio/app");
    expect(safeRedirectPath(null, "/studio/app")).toBe("/studio/app");
    expect(safeRedirectPath(42, "/studio/app")).toBe("/studio/app");
  });
});