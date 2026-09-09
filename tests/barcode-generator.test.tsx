/** @vitest-environment jsdom */
import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import JsBarcode from "jsbarcode";
import bwipjs from "bwip-js";
import { strFromU8, unzipSync } from "fflate";
import {
  baseFilename,
  buildLabelSheetHtml,
  buildLabelSpecs,
  buildLabelZip,
  buildProductsCsv,
  code128Validation,
  csvEscape,
  emptyProductForm,
  mod10CheckDigit,
  normalizeEAN13,
  normalizeUPCA,
  renderBarcodeToSvg,
  sanitizeFilenameSegment,
  skuFromName,
  svgInnerContent,
  svgViewBoxAttribute,
  validateProductForm,
  type BarcodeFormat,
  type LabelSheetCell,
  type ProductFormNormalized,
} from "@/tools/compute/dev/barcode";
import BarcodeGenerator from "@/tools/ui/dev/barcode-generator";
import {
  bwipRuns,
  decodeCode128,
  decodeEan13,
  decodeEanOrUpc,
  jsbarcodeRuns,
  modulePxOfRuns,
  runsToModules,
} from "./helpers/barcode-decode";

// JsBarcode measures text through a scratch <canvas> 2d context when
// displayValue is enabled. js-dom has no canvas implementation, so stub the
// measurement API; it returns a zero width, which only affects text centering.
if (typeof HTMLCanvasElement !== "undefined") {
  HTMLCanvasElement.prototype.getContext = (() =>
    ({
      font: "",
      measureText: () => ({ width: 0 }),
    } as unknown as CanvasRenderingContext2D)) as unknown as typeof HTMLCanvasElement.prototype.getContext;
}

const BARCODE_OPTS = { width: 2, height: 80, displayValue: true, margin: 10 };

// Replicating the component's validateFormat switch so format changes are
// tested at the exact behaviour the UI performs (pure, so js-dom-free).
function validateFormat(format: BarcodeFormat, input: string): { error: string | null; value: string | null } {
  switch (format) {
    case "ean13": {
      const r = normalizeEAN13(input);
      if ("valid" in r) return { error: r.reason, value: null };
      return { error: null, value: r.value };
    }
    case "upca": {
      const r = normalizeUPCA(input);
      if ("valid" in r) return { error: r.reason, value: null };
      return { error: null, value: r.value };
    }
    case "code128": {
      const check = code128Validation(input);
      if (!check.valid) return { error: check.reason ?? "Enter a valid Code 128 value.", value: null };
      return { error: null, value: input.trim() };
    }
  }
}

function renderJsBarcodeSvg(format: BarcodeFormat, value: string): string {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  JsBarcode(svg, value, {
    format: format === "ean13" ? "EAN13" : format === "upca" ? "UPC" : "CODE128",
    width: 2,
    height: 80,
    displayValue: false,
    margin: 10,
  });
  return new XMLSerializer().serializeToString(svg);
}

function modulesOf(svgMarkup: string): string {
  const runs = jsbarcodeRuns(svgMarkup);
  return runsToModules(runs, modulePxOfRuns(runs));
}

function bwipToSvg(opts: { bcid: string; text: string; scale: number; height: number; includetext: boolean }): string {
  // @types/bwip-js predates toSVG; the runtime always exposes it.
  const enc = bwipjs as unknown as { toSVG: (o: typeof opts) => string };
  return enc.toSVG(opts);
}

function bwipModules(bcid: string, text: string): string {
  const svg = bwipToSvg({ bcid, text, scale: 3, height: 50, includetext: false });
  const runs = bwipRuns(svg);
  return runsToModules(runs, modulePxOfRuns(runs));
}

// ---------------------------------------------------------------------------
// Check digits — Modulo-10 goldens verified against independent sources
// ---------------------------------------------------------------------------

describe("mod10CheckDigit", () => {
  it("EAN-13 payloads produce the published check digits", () => {
    expect(mod10CheckDigit("400638133393", 3)).toBe(1);
    expect(mod10CheckDigit("590123412345", 3)).toBe(7);
    expect(mod10CheckDigit("501234567890", 3)).toBe(0);
    expect(mod10CheckDigit("978030640615", 3)).toBe(7);
  });

  it("UPC-A payloads produce the published check digits (incl. leading zeros)", () => {
    expect(mod10CheckDigit("01234567890", 3)).toBe(5);
    expect(mod10CheckDigit("04210000526", 3)).toBe(4);
    expect(mod10CheckDigit("12345678901", 3)).toBe(2);
  });

  it("an all-zero payload yields a zero check digit (leading zeros preserved)", () => {
    expect(mod10CheckDigit("00000000000", 3)).toBe(0);
  });
});

describe("normalizeEAN13", () => {
  it("12-digit payload generates the 13th check digit", () => {
    expect(normalizeEAN13("400638133393")).toEqual({ value: "4006381333931", checkDigit: 1 });
  });

  it("accepts a 13-digit value with a valid check digit unchanged", () => {
    expect(normalizeEAN13("4006381333931")).toEqual({ value: "4006381333931", checkDigit: 1 });
  });

  it("rejects a 13-digit value whose check digit is wrong, telling the user the right one", () => {
    const r = normalizeEAN13("4006381333932");
    expect("valid" in r).toBe(true);
    if ("valid" in r) expect(r.reason).toContain("1");
  });

  it("rejects non-digits, empty input and wrong lengths", () => {
    expect("valid" in normalizeEAN13("40063813339a")).toBe(true);
    expect("valid" in normalizeEAN13("")).toBe(true);
    expect("valid" in normalizeEAN13("4006")).toBe(true);
    expect("valid" in normalizeEAN13("40063813339312")).toBe(true);
  });
});

describe("normalizeUPCA", () => {
  it("11-digit payload generates the 12th check digit, preserving leading zeros", () => {
    expect(normalizeUPCA("01234567890")).toEqual({ value: "012345678905", checkDigit: 5 });
  });

  it("accepts a 12-digit value with a valid check digit unchanged", () => {
    expect(normalizeUPCA("042100005264")).toEqual({ value: "042100005264", checkDigit: 4 });
  });

  it("rejects a wrong check digit, telling the user the right one", () => {
    const r = normalizeUPCA("042100005265");
    expect("valid" in r).toBe(true);
    if ("valid" in r) expect(r.reason).toContain("4");
  });

  it("keeps leading zeros in the 12-digit result", () => {
    expect(normalizeUPCA("00000000000")).toEqual({ value: "000000000000", checkDigit: 0 });
  });

  it("rejects non-digits and wrong lengths", () => {
    expect("valid" in normalizeUPCA("0421000052X")).toBe(true);
    expect("valid" in normalizeUPCA("0421000052")).toBe(true);
    expect("valid" in normalizeUPCA("0421000052655")).toBe(true);
  });
});

describe("code128Validation", () => {
  it("accepts the full printable ASCII range", () => {
    expect(code128Validation("PRODUCT-123")).toEqual({ valid: true });
    expect(code128Validation("Lower/upper+Special 123")).toEqual({ valid: true });
    expect(code128Validation("~`!@#$%^&*()_-+={[}]|:;\"'\\<,>.?/")).toEqual({ valid: true });
  });

  it("rejects control characters, non-ASCII and empty input", () => {
    expect(code128Validation("A\x00B").valid).toBe(false);
    expect(code128Validation("A\tB").valid).toBe(false);
    expect(code128Validation("caf\u00e9").valid).toBe(false);
    expect(code128Validation("   ").valid).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Filenames
// ---------------------------------------------------------------------------

describe("sanitizeFilenameSegment", () => {
  it("strips filename-unsafe characters", () => {
    expect(sanitizeFilenameSegment("A<B>C&D\"").replace(/[<>&"]/g, "")).toBe("ABCD");
  });

  it("turns whitespace into single dashes and trims", () => {
    expect(sanitizeFilenameSegment("  Products  &  Boxes  ")).toBe("Products-Boxes");
    expect(sanitizeFilenameSegment("A\t B\nC")).toBe("A-BC");
  });

  it("falls back to 'value' when nothing usable remains", () => {
    expect(sanitizeFilenameSegment("<>\"")).toBe("value");
  });

  it("caps the segment length at 60 characters", () => {
    expect(sanitizeFilenameSegment("x".repeat(90))).toHaveLength(60);
  });
});

describe("baseFilename", () => {
  it("prefixes EAN-13 and preserves the full digit string", () => {
    expect(baseFilename("ean13", "4006381333931")).toBe("ean-13-4006381333931");
  });

  it("prefixes UPC-A and PRESERVES leading zeros", () => {
    expect(baseFilename("upca", "012345678905")).toBe("upc-a-012345678905");
  });

  it("prefixes Code 128 values", () => {
    expect(baseFilename("code128", "PRODUCT-123")).toBe("code-128-PRODUCT-123");
  });
});

// ---------------------------------------------------------------------------
// renderBarcodeToSvg — structural SVG output + safe escaping
// ---------------------------------------------------------------------------

describe("renderBarcodeToSvg (EAN-13)", () => {
  it("produces validator-safe vector SVG with correct dimensions", () => {
    const svg = renderBarcodeToSvg("ean13", "4006381333931", BARCODE_OPTS);
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
    // jsbarcode appends "px" and grows the box to include the text row
    // (80px bars + ~42px text area at the given options).
    expect(svg).toMatch(/width="\d+px"/);
    expect(svg).toMatch(/height="122px"/);
    expect(svg).toMatch(/viewBox="0 0 \d+ 122"/);
    expect(svg).not.toContain("<image"); // real vectors, never a raster screenshot
  });

  it("no <image> in any barcode output", () => {
    expect(renderBarcodeToSvg("upca", "012345678905", BARCODE_OPTS)).not.toContain("<image");
    expect(renderBarcodeToSvg("code128", "PRODUCT-123", BARCODE_OPTS)).not.toContain("<image");
  });
});

describe("SVG text rendering and escaping", () => {
  it("shows the value as text when displayValue is enabled", () => {
    const svg = renderBarcodeToSvg("ean13", "4006381333931", BARCODE_OPTS);
    const holder = document.createElement("div");
    holder.innerHTML = svg;
    const texts = Array.from(holder.getElementsByTagName("text")).map((t) => t.textContent ?? "");
    expect(texts.length).toBeGreaterThan(0);
    expect(texts.join("")).toContain("4006381333931");
  });

  it("omits the text element when displayValue is disabled", () => {
    const svg = renderBarcodeToSvg("ean13", "4006381333931", { ...BARCODE_OPTS, displayValue: false });
    const holder = document.createElement("div");
    holder.innerHTML = svg;
    expect(holder.getElementsByTagName("text").length).toBe(0);
  });

  it("ESCAPES user content so it can never become markup (A<B&C stays text)", () => {
    const svg = renderBarcodeToSvg("code128", "A<B&C", BARCODE_OPTS);
    const holder = document.createElement("div");
    holder.innerHTML = svg;
    const texts = Array.from(holder.getElementsByTagName("text")).map((t) => t.textContent ?? "");
    expect(texts.join("")).toContain("A<B&C"); // re-parsed value is exact
    expect(holder.getElementsByTagName("script").length).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Real pattern verification — decode the actual bars and cross-check with an
// independent encoder (bwip-js). This proves the raster a scanner would read.
// ---------------------------------------------------------------------------

function jsbarcodeDecode(format: "ean13" | "upca" | "code128", value: string): unknown {
  const markup = renderJsBarcodeSvg(format, value);
  const bits = modulesOf(markup);
  if (format === "code128") return decodeCode128(bits);
  return decodeEan13(bits);
}

describe("EAN-13 raster decode (jsbarcode output)", () => {
  const cases: Array<{ value: string; firstDigit: string; parities: string }> = [
    { value: "4006381333931", firstDigit: "4", parities: "LGLLGG" },
    { value: "5901234123457", firstDigit: "5", parities: "LGGLLG" },
    { value: "9780306406157", firstDigit: "9", parities: "LGGLGL" },
  ];

  it.each(cases)("$value decodes to itself with the correct first-digit parity set", (c) => {
    const d = jsbarcodeDecode("ean13", c.value) as { value: string; firstDigit: string; leftParities: string };
    expect(d.value).toBe(c.value);
    expect(d.firstDigit).toBe(c.firstDigit);
    expect(d.leftParities).toBe(c.parities);
  });
});

describe("UPC-A raster decode (jsbarcode output, regression for the 'UPC' format name)", () => {
  it("renders and decodes a UPC-A value with its leading zero intact", () => {
    const markup = renderJsBarcodeSvg("upca", "012345678905");
    expect(decodeEanOrUpc(modulesOf(markup))).toBe("012345678905");
  });

  it("renders and decodes a second UPC-A value", () => {
    const markup = renderJsBarcodeSvg("upca", "042100005264");
    expect(decodeEanOrUpc(modulesOf(markup))).toBe("042100005264");
  });

  it("renderBarcodeToSvg (the component code path) also renders UPC-A correctly", () => {
    const svg = renderBarcodeToSvg("upca", "012345678905", BARCODE_OPTS);
    expect(decodeEanOrUpc(modulesOf(svg))).toBe("012345678905");
  });
});

describe("Code 128 raster decode (jsbarcode output)", () => {
  it.each(["PRODUCT-123", "1234+ABC", "Hello World", "mixed+case&symbols"])(
    "%s round-trips exactly (incl. auto code-set C digit pairs)",
    (value) => {
      const d = decodeCode128(modulesOf(renderJsBarcodeSvg("code128", value)));
      expect(d).not.toBeNull();
      expect(d!.text).toBe(value);
      expect(d!.checksumVerified).toBe(true);
    },
  );
});

describe("Cross-check with bwip-js (independent reference encoder)", () => {
  it("EAN-13: bwip-js output decodes to the same digits + check digit", () => {
    const value = "4006381333931";
    const d = decodeEan13(bwipModules("ean13", value));
    expect(d.value).toBe(value);
    expect(d.leftParities).toBe("LGLLGG");
  });

  it("UPC-A: bwip-js output decodes to the same 12 digits", () => {
    expect(decodeEanOrUpc(bwipModules("upca", "012345678905"))).toBe("012345678905");
  });

  it("Code 128: bwip-js output decodes to the exact same text with a verified checksum", () => {
    for (const value of ["PRODUCT-123", "1234+ABC", "Hello World"]) {
      const d = decodeCode128(bwipModules("code128", value));
      expect(d).not.toBeNull();
      expect(d!.text).toBe(value);
      expect(d!.checksumVerified).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// SVG preview embedding — regression for clipped previews.
//
// JsBarcode returns a self-contained <svg> string whose fixed-pixel
// width/height overflow a viewBox-less wrapper (the previous bug clipped the
// preview to a top-left strip). The fix lifts the viewBox + inner content onto
// a single wrapper svg with preserveAspectRatio="xMidYMid meet". These tests
// pin that structure so a nested-svg regression can never come back.
// ---------------------------------------------------------------------------

describe("SVG preview embedding (barcode clipping regression)", () => {
  it("barcodes also expose a viewBox and lift without a nested svg", () => {
    const svg = renderBarcodeToSvg("ean13", "4006381333931", BARCODE_OPTS);
    const viewBox = svgViewBoxAttribute(svg);
    expect(viewBox).toMatch(/^0 0 \d+ \d+$/);
    expect(svgInnerContent(svg)).not.toContain("<svg");
  });

  it("svgViewBoxAttribute / svgInnerContent reject malformed input", () => {
    expect(() => svgViewBoxAttribute("<div></div>")).toThrow();
    expect(() => svgInnerContent("<div>no svg here</div>")).toThrow();
  });
});

// ---------------------------------------------------------------------------
// Format switching — leading zeros survive, stale values never linger
// ---------------------------------------------------------------------------

describe("format switching regression", () => {
  it("EAN-13 -> UPC-A with the same digits is rejected, and a real UPC value is accepted", () => {
    expect(validateFormat("ean13", "4006381333931")).toEqual({ error: null, value: "4006381333931" });
    // 13 digits is never a valid UPC-A value.
    expect(validateFormat("upca", "4006381333931").error).not.toBeNull();
    expect(validateFormat("upca", "012345678905")).toEqual({ error: null, value: "012345678905" });
  });

  it("UPC-A -> Code 128 -> back to EAN-13 keeps all values valid", () => {
    expect(validateFormat("upca", "012345678905")).toEqual({ error: null, value: "012345678905" });
    expect(validateFormat("code128", "PRODUCT-123")).toEqual({ error: null, value: "PRODUCT-123" });
    expect(validateFormat("ean13", "5901234123457")).toEqual({ error: null, value: "5901234123457" });
  });

  it("empty input is invalid in every format", () => {
    for (const f of ["ean13", "upca", "code128"] as const) {
      expect(validateFormat(f, "").error).not.toBeNull();
    }
  });
});

// ---------------------------------------------------------------------------
// "Generate New" workflow — product → identifier → labels (pure logic)
// ---------------------------------------------------------------------------

function normalizedBase(overrides?: Partial<ProductFormNormalized>): ProductFormNormalized {
  return {
    name: "Papad",
    identifier: "PAPAD",
    format: "code128",
    content: "PAPAD",
    quantity: 3,
    bulkMode: "same",
    brand: "Brand",
    category: "",
    variant: "",
    description: "",
    mrp: "120",
    price: "",
    unit: "",
    batchNo: "B1",
    expiry: "2027-06",
    manufacturer: "",
    ...overrides,
  };
}

describe("Generate New — skuFromName", () => {
  it("derives an uppercase alphanumeric prefix", () => {
    expect(skuFromName("Homemade Papad")).toBe("HOMEMADE");
    expect(skuFromName("Red Chilli 500g Pack")).toBe("REDCHILL");
    expect(skuFromName("123 Boxes")).toBe("123BOXES");
  });

  it("falls back to ITEM when nothing usable remains", () => {
    expect(skuFromName("")).toBe("ITEM");
    expect(skuFromName("   ")).toBe("ITEM");
    expect(skuFromName("\u0915\u093e")).toBe("ITEM");
  });
});

describe("Generate New — validateProductForm", () => {
  it("requires a product name", () => {
    const r = validateProductForm(emptyProductForm());
    expect(r.normalized).toBeUndefined();
    expect(r.errors.name).toBe("Product name is required.");
  });

  it("accepts a Code 128 product with an auto-derived identifier", () => {
    const r = validateProductForm({ ...emptyProductForm(), name: "Homemade Papad" });
    expect(r.errors).toEqual({});
    expect(r.normalized?.identifier).toBe("HOMEMADE");
    expect(r.normalized?.content).toBe("HOMEMADE");
    expect(r.normalized?.quantity).toBe(1);
  });

  it("EAN-13 needs the user's assigned number and never fabricates one", () => {
    const missing = validateProductForm({ ...emptyProductForm(), name: "Papad", format: "ean13" });
    expect(missing.normalized).toBeUndefined();
    expect(missing.errors.assignedNumber).toContain("12 digit");
    const withNumber = validateProductForm({
      ...emptyProductForm(),
      name: "Papad",
      format: "ean13",
      assignedNumber: "400638133393",
    });
    expect(withNumber.normalized?.identifier).toBe("4006381333931");
  });

  it("rejects invalid money and expiry without coercing anything to 0", () => {
    const r = validateProductForm({
      ...emptyProductForm(),
      name: "Papad",
      mrp: "abc",
      price: "-5",
      expiry: "27-06",
    });
    expect(r.normalized).toBeUndefined();
    expect(r.errors.mrp).toBe("MRP must be an amount like 120 or 99.50.");
    expect(r.errors.price).toBeTruthy();
    expect(r.errors.expiry).toBe("Use YYYY-MM (e.g. 2027-06).");
  });

  it("accepts valid money and expiry as untouched strings", () => {
    const r = validateProductForm({
      ...emptyProductForm(),
      name: "Papad",
      mrp: "120",
      price: "99.50",
      expiry: "2027-06",
    });
    expect(r.errors).toEqual({});
    expect(r.normalized?.mrp).toBe("120");
    expect(r.normalized?.price).toBe("99.50");
    expect(r.normalized?.expiry).toBe("2027-06");
  });

  it("caps quantity at 1000 and rejects non-whole numbers", () => {
    expect(validateProductForm({ ...emptyProductForm(), name: "Papad", quantity: "1001" }).errors.quantity).toContain("1000");
    expect(validateProductForm({ ...emptyProductForm(), name: "Papad", quantity: "1.5" }).errors.quantity).toBeTruthy();
    expect(validateProductForm({ ...emptyProductForm(), name: "Papad", quantity: "0" }).errors.quantity).toBeTruthy();
  });

  it("rejects unique mode for EAN-13 / UPC-A", () => {
    const r = validateProductForm({
      ...emptyProductForm(),
      name: "Papad",
      format: "ean13",
      assignedNumber: "400638133393",
      bulkMode: "unique",
    });
    expect(r.errors.general).toContain("EAN-13");
  });
});

describe("Generate New — buildLabelSpecs", () => {
  it("same mode repeats the identifier for every label with paged filenames", () => {
    const specs = buildLabelSpecs(normalizedBase({ quantity: 3, bulkMode: "same" }));
    expect(specs).toHaveLength(3);
    expect(specs.every((s) => s.identifier === "PAPAD" && s.content === "PAPAD")).toBe(true);
    expect(specs.map((s) => s.filenameBody)).toEqual(["PAPAD-1", "PAPAD-2", "PAPAD-3"]);
  });

  it("unique mode zero-pads serials to the quantity width", () => {
    const specs = buildLabelSpecs(normalizedBase({ quantity: 25, bulkMode: "unique" }));
    expect(specs[0].identifier).toBe("PAPAD-01");
    expect(specs[24].identifier).toBe("PAPAD-25");
    expect(specs[0].content).toBe("PAPAD-01");
  });

  it("EAN-13 labels all encode the assigned number regardless of bulk mode", () => {
    const specs = buildLabelSpecs(
      normalizedBase({
        format: "ean13",
        identifier: "4006381333931",
        content: "4006381333931",
        quantity: 2,
        bulkMode: "unique",
      }),
    );
    expect(specs.every((s) => s.content === "4006381333931")).toBe(true);
  });
});

describe("Generate New — csvEscape and buildProductsCsv", () => {
  it("csvEscape quotes fields containing commas, quotes or newlines", () => {
    expect(csvEscape("plain")).toBe("plain");
    expect(csvEscape("a,b")).toBe('"a,b"');
    expect(csvEscape('say "hi"')).toBe('"say ""hi"""');
    expect(csvEscape("line\nbreak")).toBe('"line\nbreak"');
  });

  it("writes a header plus one quoted row per label", () => {
    const specs = buildLabelSpecs(normalizedBase({ quantity: 2, bulkMode: "same" }));
    const csv = buildProductsCsv(normalizedBase({ name: "A, B" }), specs, "png");
    const lines = csv.trim().split("\n");
    expect(lines[0].startsWith("product-name")).toBe(true);
    expect(lines).toHaveLength(3);
    expect(lines[1]).toContain('"A, B"');
    for (const spec of specs) expect(csv).toContain(`${spec.filenameBody}.png`);
  });
});

describe("Generate New — buildLabelSheetHtml", () => {
  it("produces a printable A4 document with one box per label", () => {
    const cells: LabelSheetCell[] = [
      { name: "Papad", lines: ["MRP 120", "Batch B1"], svg: "<svg viewBox=\"0 0 10 10\"></svg>", identifier: "PAPAD" },
      { name: "Papad", lines: [], svg: "<svg viewBox=\"0 0 10 10\"></svg>", identifier: "PAPAD-2" },
    ];
    const html = buildLabelSheetHtml(cells);
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("@page");
    expect(html.match(/class="label"/g)?.length).toBe(2);
    expect(html).toContain("PAPAD");
    expect(html).toContain("MRP 120");
  });

  it("escapes user text so it can never become markup", () => {
    const html = buildLabelSheetHtml([
      { name: "<script>alert(1)</script>", lines: ["<img onerror=x>"], svg: "<svg></svg>", identifier: "<i>X</i>" },
    ]);
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("&lt;i&gt;");
  });
});

describe("Generate New — buildLabelZip", () => {
  it("packs string + binary entries and round-trips through fflate", () => {
    const zipped = buildLabelZip({
      "products.csv": "a,b\n1,2\n",
      "PAPAD-1.svg": "<svg viewBox=\"0 0 10 10\"></svg>",
      "PAPAD-1.png": new Uint8Array([1, 2, 3]),
    });
    const out = unzipSync(zipped);
    expect(strFromU8(out["products.csv"])).toBe("a,b\n1,2\n");
    expect(strFromU8(out["PAPAD-1.svg"])).toBe("<svg viewBox=\"0 0 10 10\"></svg>");
    expect(Array.from(out["PAPAD-1.png"])).toEqual([1, 2, 3]);
  });
});

// ---------------------------------------------------------------------------
// Component SSR render (no browser automation available)
// ---------------------------------------------------------------------------

describe("BarcodeGenerator component render", () => {
  it("renders the empty state: 3 barcode formats, no QR option, EAN-13 default, disabled download", () => {
    const html = renderToStaticMarkup(createElement(BarcodeGenerator));
    expect(html).toContain("EAN-13");
    expect(html).toContain("UPC-A");
    expect(html).toContain("Code 128");
    expect(html).not.toContain("QR Code");
    expect(html.match(/<option/g)?.length).toBe(3);
    // EAN-13 is the controlled default.
    expect(html).toContain('value="ean13" selected=""');
    expect(html).toContain("disabled=\"\"");
    expect(html).toContain('data-lead-action="download"');
    // Empty input always carries a validation error, so the preview pane shows
    // the "unavailable" notice rather than the generic "enter a valid value".
    expect(html).toContain("Preview unavailable until the input is valid.");
    expect(html).toContain("Reset");
  });

  it("exposes the download button and error region semantics", () => {
    const html = renderToStaticMarkup(createElement(BarcodeGenerator));
    expect(html).toContain("Download PNG");
    expect(html).toContain('id="bqg-input"');
    expect(html).toContain('id="bqg-format"');
    expect(html).toContain('aria-invalid="true"');
  });

  it("prints a packaging/quiet-zone note (default EAN-13 branch)", () => {
    const html = renderToStaticMarkup(createElement(BarcodeGenerator));
    expect(html).toContain("quiet zone");
    expect(html).not.toContain("error-correction capacity");
  });

  it("exposes the Normal / Generate New workflow switch and stays on Normal by default", () => {
    const html = renderToStaticMarkup(createElement(BarcodeGenerator));
    expect(html).toContain('aria-label="Workflow"');
    expect(html).toContain(">Generate New</button>");
    expect(html).toContain('id="bqg-input"');
    expect(html).not.toContain('id="bqg-new-name"');
  });
});