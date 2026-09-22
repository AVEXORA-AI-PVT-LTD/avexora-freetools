import { describe, expect, it } from "vitest";
import { sanitizeHtml } from "@/lib/sanitize-html";

describe("sanitizeHtml", () => {
  it("keeps safe rich-text markup", () => {
    const ok = "<p>Hello <strong>world</strong> <a href='/other-tool'>link</a></p><ul><li>one</li></ul>";
    expect(sanitizeHtml(ok)).toBe(
      "<p>Hello <strong>world</strong> <a href=\"/other-tool\">link</a></p><ul><li>one</li></ul>",
    );
  });

  it("strips script elements and inline event handlers", () => {
    const input = "<p onclick=\"alert(1)\" style='x' onerror='boom'>Hi</p><script>alert(1)</script><script src='//evil'></script>";
    const out = sanitizeHtml(input);
    expect(out).not.toContain("script");
    expect(out).not.toContain("onclick");
    expect(out).not.toContain("onerror=");
    expect(out).not.toContain("style");
    expect(out).toContain("<p>Hi</p>");
  });

  it("removes javascript: URLs from links", () => {
    expect(sanitizeHtml("<a href=\"javascript:alert(1)\">x</a>")).toBe("<a>x</a>");
    expect(sanitizeHtml("<a href='vbscript:x'>y</a>")).toBe("<a>y</a>");
    expect(sanitizeHtml("<a href='/ok' target='_blank'>z</a>")).toBe("<a href=\"/ok\" target=\"_blank\">z</a>");
  });

  it("allows safe http/https links", () => {
    expect(sanitizeHtml("<a href=\"https://example.com\" rel=\"noopener\">ok</a>")).toBe(
      "<a href=\"https://example.com\" rel=\"noopener\">ok</a>",
    );
  });

  it("drops dangerous elements along with their content", () => {
    const input = "<div><iframe src='x'></iframe>after</div>text";
    const out = sanitizeHtml(input);
    expect(out).not.toContain("iframe");
    expect(out).toContain("text");
  });

  it("is idempotent", () => {
    const input = "<h2>Title</h2><p>Body with <a href='/x'>a link</a>.</p>";
    expect(sanitizeHtml(sanitizeHtml(input))).toBe(sanitizeHtml(input));
  });
});