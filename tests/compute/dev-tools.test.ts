import { describe, expect, it } from "vitest";
import type { FieldValues, GenerateFn } from "@/tools/types";
import { generateUrlEncodeDecode } from "@/tools/compute/dev/url-encoder-decoder";
import { generateBase64 } from "@/tools/compute/dev/base64";
import { generateUuids } from "@/tools/compute/dev/uuid";
import { testRegex } from "@/tools/compute/dev/regex-tester";
import { convertColor } from "@/tools/compute/dev/color-converter";
import { generateGradient } from "@/tools/compute/dev/css-gradient";
import { generateHtmlEntities } from "@/tools/compute/dev/html-entities";
import { decodeJwt } from "@/tools/compute/dev/jwt-decoder";
import { markdownToHtml, generateMarkdownHtml } from "@/tools/compute/dev/markdown-to-html";
import { convertTimestamp } from "@/tools/compute/dev/timestamp-converter";

function textOf(fn: GenerateFn, values: FieldValues): string {
  const out = fn(values);
  if ("error" in out) throw new Error(out.error);
  return out.text;
}

describe("generateUrlEncodeDecode", () => {
  it("encodes a query value in component mode", () => {
    expect(textOf(generateUrlEncodeDecode, { text: "Tom & Jerry", mode: "encode", scope: "component" })).toBe(
      "Tom%20%26%20Jerry",
    );
  });
  it("keeps URL structure in URI mode", () => {
    expect(
      textOf(generateUrlEncodeDecode, { text: "https://x.in/a b?q=1", mode: "encode", scope: "uri" }),
    ).toBe("https://x.in/a%20b?q=1");
  });
  it("decodes and reports malformed input", () => {
    expect(textOf(generateUrlEncodeDecode, { text: "a%20b", mode: "decode", scope: "component" })).toBe("a b");
    expect(generateUrlEncodeDecode({ text: "100%", mode: "decode", scope: "component" })).toHaveProperty("error");
  });
});

describe("generateBase64", () => {
  it("round-trips ASCII and Unicode", () => {
    expect(textOf(generateBase64, { text: "Hello, world!", mode: "encode" })).toBe("SGVsbG8sIHdvcmxkIQ==");
    const encoded = textOf(generateBase64, { text: "नमस्ते ₹500", mode: "encode" });
    expect(textOf(generateBase64, { text: encoded, mode: "decode" })).toBe("नमस्ते ₹500");
  });
  it("errors on invalid base64", () => {
    expect(generateBase64({ text: "!!!not-base64!!!", mode: "decode" })).toHaveProperty("error");
  });
});

describe("generateUuids", () => {
  it("generates the requested number of valid v4 UUIDs", () => {
    const out = textOf(generateUuids, { count: 5 }).split("\n");
    expect(out).toHaveLength(5);
    for (const u of out) {
      expect(u).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    }
    expect(new Set(out).size).toBe(5);
  });
  it("rejects out-of-range counts", () => {
    expect(generateUuids({ count: 0 })).toHaveProperty("error");
    expect(generateUuids({ count: 101 })).toHaveProperty("error");
  });
});

describe("testRegex", () => {
  it("lists matches with indexes and groups", () => {
    const out = textOf(testRegex, { pattern: "(\\d{2})-(\\d{2})", flags: "", text: "on 05-07 and 06-08" });
    expect(out).toContain("2 matches found.");
    expect(out).toContain('Match 1 at index 3: "05-07"');
    expect(out).toContain('  Group 1: "05"');
  });
  it("reports no matches and invalid patterns", () => {
    expect(textOf(testRegex, { pattern: "xyz", flags: "", text: "abc" })).toBe("No matches.");
    expect(testRegex({ pattern: "(", flags: "", text: "abc" })).toHaveProperty("error");
    expect(testRegex({ pattern: "a", flags: "gz", text: "abc" })).toHaveProperty("error");
  });
});

describe("convertColor", () => {
  it("converts hex to all formats", () => {
    const out = textOf(convertColor, { color: "#4f46e5" });
    expect(out).toContain("HEX:  #4f46e5");
    expect(out).toContain("RGB:  rgb(79, 70, 229)");
    expect(out).toContain("HSL:  hsl(243, 75%, 59%)");
  });
  it("expands 3-digit hex and parses rgb()/hsl()", () => {
    expect(textOf(convertColor, { color: "#abc" })).toContain("rgb(170, 187, 204)");
    expect(textOf(convertColor, { color: "rgb(255, 0, 0)" })).toContain("HEX:  #ff0000");
    expect(textOf(convertColor, { color: "hsl(0, 100%, 50%)" })).toContain("rgb(255, 0, 0)");
  });
  it("rejects nonsense", () => {
    expect(convertColor({ color: "bluish" })).toHaveProperty("error");
    expect(convertColor({ color: "rgb(999,0,0)" })).toHaveProperty("error");
  });
});

describe("generateGradient", () => {
  it("builds a linear gradient with angle", () => {
    const out = textOf(generateGradient, { from: "#4f46e5", to: "#9333ea", type: "linear", angle: 90 });
    expect(out).toContain("background: linear-gradient(90deg, #4f46e5 0%, #9333ea 100%);");
  });
  it("builds a radial gradient", () => {
    expect(textOf(generateGradient, { from: "#000", to: "#fff", type: "radial" })).toContain(
      "radial-gradient(circle, #000 0%, #fff 100%)",
    );
  });
  it("rejects invalid hex", () => {
    expect(generateGradient({ from: "blue", to: "#fff", type: "linear", angle: 90 })).toHaveProperty("error");
  });
});

describe("generateHtmlEntities", () => {
  it("encodes dangerous characters and non-ASCII", () => {
    expect(textOf(generateHtmlEntities, { text: 'a < b & "c" ₹', mode: "encode" })).toBe(
      "a &lt; b &amp; &quot;c&quot; &#8377;",
    );
  });
  it("decodes named, decimal and hex entities", () => {
    expect(textOf(generateHtmlEntities, { text: "a &lt; b &amp; &#8377; &#x20B9;", mode: "decode" })).toBe(
      "a < b & ₹ ₹",
    );
  });
});

describe("decodeJwt", () => {
  // header {"alg":"HS256","typ":"JWT"} payload {"sub":"123","exp":1000000000}
  const jwt =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJleHAiOjEwMDAwMDAwMDB9.sig";
  it("decodes header, payload and flags expiry", () => {
    const out = textOf(decodeJwt, { token: jwt });
    expect(out).toContain('"alg": "HS256"');
    expect(out).toContain('"sub": "123"');
    expect(out).toContain("2001-09-09");
    expect(out).toContain("EXPIRED");
    expect(out).toContain("NOT verified");
  });
  it("rejects malformed tokens", () => {
    expect(decodeJwt({ token: "onlytwo.parts" })).toHaveProperty("error");
    expect(decodeJwt({ token: "a.b.c" })).toHaveProperty("error");
  });
});

describe("markdownToHtml", () => {
  it("converts headings, emphasis, links and lists", () => {
    const html = markdownToHtml("# Title\n\nSome **bold** and a [link](https://x.in).\n\n- one\n- two");
    expect(html).toContain("<h1>Title</h1>");
    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain('<a href="https://x.in">link</a>');
    expect(html).toContain("<ul>\n<li>one</li>\n<li>two</li>\n</ul>");
  });
  it("converts fenced code blocks and blockquotes", () => {
    const html = markdownToHtml("```\nconst a = 1;\n```\n\n> quoted");
    expect(html).toContain("<pre><code>const a = 1;</code></pre>");
    expect(html).toContain("<blockquote><p>quoted</p></blockquote>");
  });
  it("escapes raw HTML in the input", () => {
    expect(markdownToHtml('<script>alert("x")</script>')).not.toContain("<script>");
    expect(markdownToHtml("<b>hi</b>")).toContain("&lt;b&gt;hi&lt;/b&gt;");
  });
  it("errors on empty input via the GenerateFn wrapper", () => {
    expect(generateMarkdownHtml({ markdown: "  " })).toHaveProperty("error");
  });
});

describe("convertTimestamp", () => {
  function resultMap(values: FieldValues) {
    const out = convertTimestamp(values);
    if ("error" in out) throw new Error(out.error);
    return new Map(out.results.map((r) => [r.label, r.value]));
  }
  it("converts unix seconds", () => {
    const r = resultMap({ input: "1751712000" });
    expect(r.get("UTC (ISO 8601)")).toBe("2025-07-05T10:40:00.000Z");
    expect(r.get("Unix timestamp (milliseconds)")).toBe("1751712000000");
  });
  it("treats 13-digit numbers as milliseconds", () => {
    const r = resultMap({ input: "1751712000000" });
    expect(r.get("Unix timestamp (seconds)")).toBe("1751712000");
  });
  it("parses ISO strings", () => {
    const r = resultMap({ input: "2026-01-01T00:00:00Z" });
    expect(r.get("Unix timestamp (seconds)")).toBe("1767225600");
  });
  it("rejects garbage", () => {
    expect(convertTimestamp({ input: "not a date" })).toHaveProperty("error");
  });
});
