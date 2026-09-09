/**
 * Core, framework-free logic for the Barcode Generator.
 *
 * Everything here is pure and DOM-free so it is directly unit-testable in
 * Node. Check-digit algorithms are implemented here (not in JSX) and verified
 * against independently known values in the test suite.
 *
 * Barcode values are ALWAYS treated as strings — never converted to
 * JavaScript numbers — so leading zeros (e.g. UPC-A "012345678905") are
 * preserved exactly.
 */

import JsBarcode from "jsbarcode";
import { strToU8, zipSync } from "fflate";

export type BarcodeFormat = "ean13" | "upca" | "code128";

export interface BarcodeSetOptions {
  width: number;
  height: number;
  displayValue: boolean;
  /** Quiet zone (margin) around the barcode in barcode units. */
  margin: number;
}

// ---------------------------------------------------------------------------
// Check digits — EAN-13 and UPC-A use the same Modulo-10 algorithm with a
// 3·sum pattern applied to alternating positions.
// ---------------------------------------------------------------------------

/**
 * Compute the Modulo-10 check digit for the given payload string using the
 * weighting pattern used by EAN-13 and UPC-A.
 *
 * @param payload digits only (any length); the digit used from the right.
 * @param oddWeight weight to apply to the rightmost digit position.
 */
export function mod10CheckDigit(payload: string, oddWeight: 1 | 3): number {
  let sum = 0;
  const n = payload.length;
  for (let i = n - 1; i >= 0; i--) {
    const digit = payload.charCodeAt(i) - 48;
    // Rightmost digit uses `oddWeight`; weights alternate from there.
    const weight = (n - 1 - i) % 2 === 0 ? oddWeight : oddWeight === 3 ? 1 : 3;
    sum += digit * weight;
  }
  return (10 - (sum % 10)) % 10;
}

/**
 * Calculate the EAN-13 check digit from a 12-digit payload.
 * Returns -1 if the payload is not exactly 12 digits.
 */
export function calculateEAN13CheckDigit(payload: string): number {
  if (!/^[0-9]{12}$/.test(payload)) return -1;
  // EAN-13 weights the digits from the right (position 1) as 3.
  return mod10CheckDigit(payload, 3);
}

/**
 * Validate a value as EAN-13.
 * Accepts a 12-digit payload (returns the 13-digit value with the calculated
 * check digit) or a 13-digit value whose supplied check digit validates.
 * Returns `{ valid: false, reason }` with a user-facing message otherwise.
 */
export function normalizeEAN13(
  input: string,
): { value: string; checkDigit: number } | { valid: false; reason: string } {
  const trimmed = input.trim();
  if (trimmed === "") {
    return { valid: false, reason: "Enter 12 digits to generate an EAN-13 barcode, or a complete 13-digit value." };
  }
  if (!/^[0-9]+$/.test(trimmed)) {
    return { valid: false, reason: "EAN-13 contains digits only." };
  }
  if (trimmed.length === 12) {
    const checkDigit = calculateEAN13CheckDigit(trimmed);
    return { value: trimmed + checkDigit, checkDigit };
  }
  if (trimmed.length === 13) {
    const expected = calculateEAN13CheckDigit(trimmed.slice(0, 12));
    const supplied = Number(trimmed[12]);
    if (expected === supplied) {
      return { value: trimmed, checkDigit: supplied };
    }
    return {
      valid: false,
      reason: `The check digit is invalid — it should be ${expected} for this EAN-13 value.`,
    };
  }
  return {
    valid: false,
    reason:
      "Enter exactly 12 or 13 digits. A 12-digit payload generates its check digit; a 13-digit value must include a valid check digit.",
  };
}

/**
 * Calculate the UPC-A check digit from an 11-digit payload.
 * Returns -1 if the payload is not exactly 11 digits.
 */
export function calculateUPCACheckDigit(payload: string): number {
  if (!/^[0-9]{11}$/.test(payload)) return -1;
  // UPC-A weights the digits from the right (position 1) as 3.
  return mod10CheckDigit(payload, 3);
}

/**
 * Validate a value as UPC-A.
 * Accepts an 11-digit payload (returns the 12-digit value with calculated
 * check digit) or a 12-digit value whose supplied check digit validates.
 */
export function normalizeUPCA(
  input: string,
): { value: string; checkDigit: number } | { valid: false; reason: string } {
  const trimmed = input.trim();
  if (trimmed === "") {
    return { valid: false, reason: "Enter 11 digits to generate a UPC-A check digit, or a complete 12-digit UPC-A value." };
  }
  if (!/^[0-9]+$/.test(trimmed)) {
    return { valid: false, reason: "UPC-A contains digits only." };
  }
  if (trimmed.length === 11) {
    const checkDigit = calculateUPCACheckDigit(trimmed);
    return { value: trimmed + checkDigit, checkDigit };
  }
  if (trimmed.length === 12) {
    const expected = calculateUPCACheckDigit(trimmed.slice(0, 11));
    const supplied = Number(trimmed[11]);
    if (expected === supplied) {
      return { value: trimmed, checkDigit: supplied };
    }
    return {
      valid: false,
      reason: `The check digit is invalid — it should be ${expected} for this UPC-A value.`,
    };
  }
  return {
    valid: false,
    reason:
      "Enter exactly 11 or 12 digits. An 11-digit payload generates its check digit; a 12-digit value must include a valid check digit.",
  };
}

// ---------------------------------------------------------------------------
// Code 128 — character-set validation (kept pure for testing).
// ---------------------------------------------------------------------------

/**
 * The full printable ASCII set, which maps 1-to-1 onto Code 128's encoding
 * (codes 32–126). JsBarcode's Code 128 encoder accepts these plus a few
 * control escape sequences; we accept plain text + a small set of useful
 * punctuation and reject NUL/control bytes and characters outside ASCII.
 */
export function code128Validation(input: string): { valid: boolean; reason?: string } {
  if (input.trim() === "") {
    return { valid: false, reason: "Enter a value to encode as a Code 128 barcode." };
  }
  if ([...input].some((ch) => ch.charCodeAt(0) < 32 || ch.charCodeAt(0) > 126)) {
    return {
      valid: false,
      reason: "Code 128 supports printable ASCII characters only (no control characters or non-ASCII symbols).",
    };
  }
  return { valid: true };
}

// ---------------------------------------------------------------------------
// Rendering helpers (string builders; require a DOM).
// ---------------------------------------------------------------------------

/**
 * Render a barcode as a standalone, validator-safe SVG string via JsBarcode's
 * SVG renderer. The output is genuine vector SVG (never a screenshot of the
 * canvas). User-controlled text is inserted by the library through
 * `createTextNode`, and `XMLSerializer` escapes it on serialisation — so no
 * raw user input can become markup.
 */
export function renderBarcodeToSvg(
  format: BarcodeFormat,
  value: string,
  opts: BarcodeSetOptions,
): string {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  // JsBarcode registers UPC-A under the format name "UPC" (not "UPCA").
  JsBarcode(svg, value, {
    format: format === "ean13" ? "EAN13" : format === "upca" ? "UPC" : "CODE128",
    width: opts.width,
    height: opts.height,
    displayValue: opts.displayValue,
    margin: opts.margin,
    background: "#ffffff",
    lineColor: "#000000",
  });
  return new XMLSerializer().serializeToString(svg);
}

// ---------------------------------------------------------------------------
// Filename sanitisation + download helpers (client-only).
// ---------------------------------------------------------------------------

/** Strip characters that are unsafe in filenames. Keeps letters, digits and a small safe set. */
export function sanitizeFilenameSegment(input: string): string {
  const slug = input
    .replace(/[<>&"'/\\:\*\?"\|]/g, "")
    .replace(/[^\x20-\x7E]/g, "")
    .trim()
    .replace(/\s+/g, "-");
  return slug.replace(/-+/g, "-").slice(0, 60) || "value";
}

/** Base filename from format + value, e.g. ean-13-4006381333931. */
export function baseFilename(format: BarcodeFormat, value: string): string {
  const prefix = format === "ean13" ? "ean-13" : format === "upca" ? "upc-a" : "code-128";
  const seg = sanitizeFilenameSegment(value);
  return `${prefix}-${seg}`;
}

// ---------------------------------------------------------------------------
// SVG preview extraction.
//
// The barcode library returns a fully self-contained `<svg>` string (with its
// own `width`/`height`/`viewBox`). Injecting it INSIDE a
// second `<svg>` wrapper would clip it: the nested element's fixed-pixel
// dimensions overflow the wrapper's (viewBox-less, ~288×150) viewport and the
// root svg hides the overflow — so only a top-left corner of the code would be
// visible.
//
// The fix: render the generated code as the SINGLE preview `<svg>` by lifting
// its `viewBox` and inner content onto a wrapper we control with CSS, plus
// `preserveAspectRatio="xMidYMid meet"` so the whole code (quiet zone
// included) always stays square, centered and never clipped at any size.
// ---------------------------------------------------------------------------

/** Extract the `viewBox="x y w h"` value from a standalone SVG string. */
export function svgViewBoxAttribute(svg: string): string {
  const m = /viewBox="([^"]+)"/.exec(svg);
  if (!m) throw new Error("SVG has no viewBox");
  return m[1];
}

/** Extract the inner markup of a standalone `<svg>...</svg>` string. */
export function svgInnerContent(svg: string): string {
  const open = svg.indexOf(">");
  const close = svg.lastIndexOf("</svg>");
  if (open === -1 || close === -1 || close < open) throw new Error("SVG wrapper not found");
  return svg.slice(open + 1, close);
}

// ---------------------------------------------------------------------------
// "Generate New" workflow — product → identifier → barcode.
//
// This is browser-only generation. A barcode encodes an IDENTIFIER; it does
// not register a product number, and it does NOT synchronise with a shopkeeper
// database. The UI must say so explicitly (see the note copy in the component).
// ---------------------------------------------------------------------------

export type GeneratorMode = "normal" | "new";
export type BulkMode = "same" | "unique";

/** Maximum labels per bulk batch — keeps the browser responsive. */
export const MAX_BULK_QTY = 1000;
/** Number of label cards rendered live; the rest are in the ZIP/CSV/sheet. */
export const BULK_PREVIEW_COUNT = 6;
export const PRODUCT_NAME_MAX = 120;
export const SKU_MAX = 40;

export interface ProductForm {
  name: string;
  sku: string;
  format: BarcodeFormat;
  /** Assigned product number (EAN-13 / UPC-A only). Never invented here. */
  assignedNumber: string;
  brand: string;
  category: string;
  variant: string;
  description: string;
  mrp: string;
  price: string;
  unit: string;
  batchNo: string;
  expiry: string; // YYYY-MM
  manufacturer: string;
  quantity: string;
  bulkMode: BulkMode;
}

export interface ProductFormNormalized {
  name: string;
  /** Human-facing product identifier (SKU, or the assigned EAN/UPC number). */
  identifier: string;
  format: BarcodeFormat;
  /** The value actually encoded (SKU or the validated number). */
  content: string;
  quantity: number;
  bulkMode: BulkMode;
  brand: string;
  category: string;
  variant: string;
  description: string;
  mrp: string;
  price: string;
  unit: string;
  batchNo: string;
  expiry: string;
  manufacturer: string;
}

export interface ProductFormErrors {
  name?: string;
  sku?: string;
  assignedNumber?: string;
  quantity?: string;
  mrp?: string;
  price?: string;
  expiry?: string;
  general?: string;
}

export interface LabelSpec {
  format: BarcodeFormat;
  /** Human-readable product id shown on the label (SKU or EAN/UPC number). */
  identifier: string;
  /** Exact value the barcode encodes. */
  content: string;
  index: number; // 0-based
  total: number;
  /** Unique, filename-safe base (identifier + zero-padded sequence). */
  filenameBody: string;
}

/** Empty form for the "Generate New" workflow (Code 128 + 1 label by default). */
export function emptyProductForm(): ProductForm {
  return {
    name: "",
    sku: "",
    format: "code128",
    assignedNumber: "",
    brand: "",
    category: "",
    variant: "",
    description: "",
    mrp: "",
    price: "",
    unit: "",
    batchNo: "",
    expiry: "",
    manufacturer: "",
    quantity: "1",
    bulkMode: "same",
  };
}

/** Derive a stable SKU prefix from a product name (e.g. "Homemade Papad" → "HOMEMADE"). */
export function skuFromName(name: string): string {
  const letters = name
    .replace(/[^a-zA-Z0-9]+/g, "")
    .toUpperCase()
    .slice(0, 8);
  return letters === "" ? "ITEM" : letters;
}

/**
 * Validate the product form. Returns field-level errors (never silently
 * converting invalid numbers to 0), or a normalised form whose `identifier`
 * and `content` are the values that will actually be encoded.
 */
export function validateProductForm(
  form: ProductForm,
): { errors: ProductFormErrors; normalized?: ProductFormNormalized } {
  const errors: ProductFormErrors = {};
  const fmt = form.format;
  const name = form.name.trim();
  if (name === "") {
    errors.name = "Product name is required.";
  } else if (name.length > PRODUCT_NAME_MAX) {
    errors.name = `Keep the product name under ${PRODUCT_NAME_MAX} characters.`;
  }

  let identifier = "";
  let content = "";
  if (fmt === "ean13" || fmt === "upca") {
    const r = fmt === "ean13" ? normalizeEAN13(form.assignedNumber.trim()) : normalizeUPCA(form.assignedNumber.trim());
    if ("valid" in r) {
      errors.assignedNumber = r.reason;
    } else {
      identifier = r.value;
      content = r.value;
    }
  } else {
    const sku = form.sku.trim();
    if (sku.length > SKU_MAX) {
      errors.sku = `Keep the SKU under ${SKU_MAX} characters.`;
    } else if (sku !== "" && !code128Validation(sku).valid) {
      errors.sku = "SKU must use printable ASCII letters, digits or symbols (like PAPAD-001).";
    }
    identifier = (sku || skuFromName(name)).toUpperCase().slice(0, SKU_MAX);
    if (identifier === "") errors.sku = "Enter a SKU or a product name so an identifier can be built.";
    content = identifier;
  }

  for (const key of ["mrp", "price"] as const) {
    const v = form[key].trim();
    if (v === "") continue;
    if (!/^(0|[1-9]\d{0,6})(\.\d{1,2})?$/.test(v)) {
      errors[key] = key === "mrp" ? "MRP must be an amount like 120 or 99.50." : "Selling price must be an amount like 120 or 99.50.";
    }
  }

  const expiry = form.expiry.trim();
  if (expiry !== "" && !/^\d{4}-(0[1-9]|1[0-2])$/.test(expiry)) {
    errors.expiry = "Use YYYY-MM (e.g. 2027-06).";
  }

  const qtyRaw = form.quantity.trim();
  const qty = qtyRaw === "" || !/^\d+$/.test(qtyRaw) ? NaN : parseInt(qtyRaw, 10);
  if (!Number.isInteger(qty) || qty < 1 || qty > MAX_BULK_QTY) {
    errors.quantity = `Quantity must be a whole number between 1 and ${MAX_BULK_QTY}.`;
  }

  if (form.bulkMode === "unique" && (fmt === "ean13" || fmt === "upca")) {
    errors.general =
      "EAN-13 and UPC-A represent one product number — every package of the same product shares the same barcode. Use “Same product barcode”, or switch to Code 128 for unique per-item codes.";
  }

  if (Object.keys(errors).length > 0) return { errors };

  return {
    errors,
    normalized: {
      name,
      identifier,
      format: fmt,
      content,
      quantity: qty,
      bulkMode: form.bulkMode,
      brand: form.brand.trim(),
      category: form.category.trim(),
      variant: form.variant.trim(),
      description: form.description.trim(),
      mrp: form.mrp.trim(),
      price: form.price.trim(),
      unit: form.unit.trim(),
      batchNo: form.batchNo.trim(),
      expiry,
      manufacturer: form.manufacturer.trim(),
    },
  };
}

/**
 * Expand a normalised product into `quantity` label specs.
 * - "same": every label encodes the same identifier/number (retail packages).
 * - "unique": each label gets a zero-padded serial (Code 128 only — the
 *   validator already rejects unique mode for EAN-13/UPC-A).
 */
export function buildLabelSpecs(normalized: ProductFormNormalized): LabelSpec[] {
  const { quantity, bulkMode, format, identifier } = normalized;
  const width = String(Math.max(quantity, 1)).length;
  const specs: LabelSpec[] = [];
  const unique = bulkMode === "unique" && format === "code128";
  for (let i = 0; i < quantity; i++) {
    let id = identifier;
    if (unique) id = `${identifier}-${String(i + 1).padStart(width, "0")}`;
    let content = id;
    if (format === "ean13" || format === "upca") content = normalized.content;
    const seq = String(i + 1).padStart(width, "0");
    specs.push({
      format,
      identifier: id,
      content,
      index: i,
      total: quantity,
      filenameBody: `${sanitizeFilenameSegment(id)}-${seq}`,
    });
  }
  return specs;
}

// ---------------------------------------------------------------------------
// Bulk outputs — CSV, printable label sheet, ZIP.
// ---------------------------------------------------------------------------

/** Escape one CSV field per RFC 4180. */
export function csvEscape(value: string): string {
  const s = String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Build the `products.csv` mapping rows for a generated batch. */
export function buildProductsCsv(normalized: ProductFormNormalized, specs: LabelSpec[], ext: string): string {
  const header = [
    "product-name",
    "sku",
    "identifier",
    "barcode-type",
    "encoded-value",
    "generated-file",
    "brand",
    "category",
    "variant",
    "description",
    "mrp",
    "selling-price",
    "unit",
    "batch-no",
    "expiry",
    "manufacturer",
  ];
  const rows = specs.map((spec) =>
    [
      normalized.name,
      spec.identifier,
      spec.identifier,
      spec.format,
      spec.content,
      `${spec.filenameBody}.${ext}`,
      normalized.brand,
      normalized.category,
      normalized.variant,
      normalized.description,
      normalized.mrp,
      normalized.price,
      normalized.unit,
      normalized.batchNo,
      normalized.expiry,
      normalized.manufacturer,
    ]
      .map(csvEscape)
      .join(","),
  );
  return [header.map(csvEscape).join(","), ...rows].join("\n") + "\n";
}

/** HTML-escape text for the printable sheet. */
export function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export interface LabelSheetCell {
  name: string;
  lines: string[];
  svg: string;
  identifier: string;
}

/** Build a print-friendly A4 label sheet containing every generated label. */
export function buildLabelSheetHtml(cells: LabelSheetCell[]): string {
  const style = `
@page { size: A4; margin: 10mm; }
* { box-sizing: border-box; }
body { font-family: Arial, Helvetica, sans-serif; margin: 0; }
.sheet { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6mm; }
.label { border: 1px solid #222; border-radius: 3mm; padding: 4mm; break-inside: avoid; page-break-inside: avoid; text-align: center; }
.label .name { font-weight: 700; font-size: 12px; }
.label .meta { font-size: 10px; color: #222; }
.label svg { width: 60mm; height: auto; margin: 3mm auto; display: block; }
.label .code-text { font-size: 11px; letter-spacing: 0.6px; }`.trim();
  const cellsHtml = cells
    .map(
      (cell) =>
        `<div class="label">` +
        `<div class="name">${escapeHtml(cell.name)}</div>` +
        cell.lines.map((line) => `<div class="meta">${escapeHtml(line)}</div>`).join("") +
        cell.svg +
        `<div class="code-text">${escapeHtml(cell.identifier)}</div>` +
        `</div>`,
    )
    .join("\n");
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/><title>Product labels</title><style>${style}</style></head>
<body><div class="sheet">${cellsHtml}</div></body></html>`;
}

/** Pack label files + CSV into a single in-memory ZIP (via fflate). */
export function buildLabelZip(files: Record<string, string | Uint8Array>): Uint8Array {
  const entries: Record<string, Uint8Array> = {};
  for (const [name, content] of Object.entries(files)) {
    entries[name] = typeof content === "string" ? strToU8(content) : content;
  }
  return zipSync(entries, { level: 0 });
}
