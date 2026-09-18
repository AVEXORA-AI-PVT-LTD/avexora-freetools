import { strFromU8, unzipSync } from "fflate";

/**
 * Word to PDF Converter — validation + metadata layer.
 *
 * Rendering is deliberately NOT done here: a DOCX is laid out by the
 * `docx-preview` renderer in the browser, then printed to a real, selectable
 * text PDF through the browser's print engine (the only layout engine capable
 * of a faithful DOCX → PDF rendering that ships with every runtime this site
 * is deployed to — Vercel serverless and the Docker standalone image, neither
 * of which can run a native office/Chromium binary). Everything in this module
 * is pure input validation, package inspection and page-metadata extraction,
 * so it is fully unit-testable without a DOM.
 */

export const WORD_TO_PDF_MAX_BYTES = 50 * 1024 * 1024;
/** Soft cap on rendered pages; enforced after rendering, generously sized. */
export const WORD_TO_PDF_MAX_PAGES = 500;

export class WordToPdfError extends Error {}

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/** Base name + ".pdf": `invoice.docx` → `invoice.pdf`, sanitized. */
export function sanitizePdfFilename(name: string): string {
  const base = name.replace(/^.*[\\/]/, "").replace(/\.docx$/i, "");
  const cleaned = base.replace(/[<>:"/\\|?*\u0000-\u001f]/g, "").replace(/\s+/g, " ").trim();
  return `${cleaned || "document"}.pdf`;
}

export type WordFileKind =
  | "docx"
  | "docm"
  | "doc-ole" // legacy binary .doc (OLE compound file)
  | "zip-other" // a ZIP but not a DOCX package
  | "unknown";

const OLE_MAGIC = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1];

export function classifyWordFile(bytes: Uint8Array): WordFileKind {
  if (bytes.length >= 8 && OLE_MAGIC.every((b, i) => bytes[i] === b)) return "doc-ole";
  const isZip =
    bytes.length >= 4 &&
    bytes[0] === 0x50 &&
    bytes[1] === 0x4b &&
    (bytes[2] === 0x03 ||
      bytes[2] === 0x05 ||
      bytes[2] === 0x07) &&
    (bytes[3] === 0x04 || bytes[3] === 0x06 || bytes[3] === 0x08);
  return isZip ? "zip-other" : "unknown";
}

export interface DocxInspection {
  ok: boolean;
  message?: string;
}

function mimeLooksWrong(mime: string | undefined): boolean {
  if (!mime || mime === DOCX_MIME || mime === "application/octet-stream" || mime === "application/zip") {
    return false;
  }
  return /^(image|video|audio)\//.test(mime) || mime === "application/pdf" || mime === "text/plain";
}

/**
 * Validate an uploaded DOCX without trusting the filename or browser MIME type
 * alone: checks the extension, the declared MIME (as a soft signal), the file
 * size, the ZIP/magic structure and finally the OOXML package contents
 * (`[Content_Types].xml`, `word/document.xml`, and encryption markers).
 * Returns `{ ok: false; message }` for every failure path; callers set the
 * message as the user-facing error.
 */
export function inspectDocx(
  bytes: Uint8Array,
  meta: { name?: string; mime?: string } = {},
): DocxInspection {
  const name = meta.name ?? "";
  const lower = name.toLowerCase();

  if (bytes.byteLength > WORD_TO_PDF_MAX_BYTES) {
    const mb = bytes.byteLength / (1024 * 1024);
    return {
      ok: false,
      message: `This document is ${mb.toFixed(1)} MB — larger than the 50 MB limit for conversion. Please try a smaller file.`,
    };
  }

  if (lower.endsWith(".docm")) {
    return {
      ok: false,
      message:
        "Macro-enabled Word documents (.docm) are not supported. Open the file in Word and save it as a regular .docx, then upload that version.",
    };
  }
  if (lower.endsWith(".doc")) {
    return {
      ok: false,
      message:
        "This appears to be a legacy .doc file. Only .docx Word documents are supported — open the file in Word (or Google Docs) and save it as .docx first.",
    };
  }
  if (name && !lower.endsWith(".docx")) {
    return {
      ok: false,
      message: "Please upload a valid Word (.docx) document.",
    };
  }

  if (mimeLooksWrong(meta.mime)) {
    return {
      ok: false,
      message: "Please upload a valid Word (.docx) document.",
    };
  }

  const kind = classifyWordFile(bytes);
  if (kind === "doc-ole") {
    return {
      ok: false,
      message:
        "This is a legacy .doc file (binary format). Only .docx Word documents are supported — open it in Word and choose “Save As → .docx”.",
    };
  }
  if (kind === "unknown") {
    return {
      ok: false,
      message:
        "This Word document could not be read. Please verify that the file is not corrupted and try again.",
    };
  }

  let zip: ReturnType<typeof unzipSync>;
  try {
    zip = unzipSync(bytes);
  } catch {
    return {
      ok: false,
      message:
        "This Word document could not be read. Please verify that the file is not corrupted and try again.",
    };
  }

  if (zip["word/encryption.xml"] || zip["EncryptedPackage"]) {
    return {
      ok: false,
      message:
        "This document is password-protected or encrypted, which cannot be converted here. Remove the password in Word and upload the unlocked .docx.",
    };
  }

  if (!zip["[Content_Types].xml"] || !zip["word/document.xml"]) {
    return {
      ok: false,
      message:
        "This file is not a valid Word (.docx) document. Please upload a valid Word (.docx) document.",
    };
  }

  return { ok: true };
}

export interface WordPageSetup {
  orientation: "portrait" | "landscape";
  widthMm: number;
  heightMm: number;
  marginTopMm: number;
  marginRightMm: number;
  marginBottomMm: number;
  marginLeftMm: number;
}

/** Word's defaults: A4 portrait, ~1″ margins everywhere. */
export const WORD_PAGE_DEFAULTS: WordPageSetup = {
  orientation: "portrait",
  widthMm: 210,
  heightMm: 297,
  marginTopMm: 25.4,
  marginRightMm: 25.4,
  marginBottomMm: 25.4,
  marginLeftMm: 25.4,
};

const TWIPS_PER_INCH = 1440;
const MM_PER_INCH = 25.4;

function twipsToMm(twips: number | undefined, fallbackMm: number): number {
  return typeof twips === "number" && Number.isFinite(twips)
    ? Math.round((twips / TWIPS_PER_INCH) * MM_PER_INCH * 10) / 10
    : fallbackMm;
}

/** Extract width/height from the LAST `w:pgSz` in a `w:sectPr` block. */
function parsePgSz(sectPr: string, setup: WordPageSetup): WordPageSetup {
  const m = sectPr.match(/<w:pgSz\b[^>]*\/>/);
  if (!m) return setup;
  const attr = (key: string) => {
    const a = m[0].match(new RegExp(`w:${key}="([\\d.]+)"`));
    return a ? Number(a[1]) : undefined;
  };
  const w = attr("w");
  const h = attr("h");
  const orient = m[0].match(/w:orient="([a-z]+)"/)?.[1];
  const widthMm = twipsToMm(w, setup.widthMm);
  const heightMm = twipsToMm(h, setup.heightMm);
  const landscape = orient === "landscape" || (orient !== "portrait" && widthMm > heightMm);
  return {
    ...setup,
    orientation: landscape ? "landscape" : "portrait",
    widthMm: landscape ? Math.max(widthMm, heightMm) : Math.min(widthMm, heightMm),
    heightMm: landscape ? Math.min(widthMm, heightMm) : Math.max(widthMm, heightMm),
  };
}

function parsePgMar(sectPr: string, setup: WordPageSetup): WordPageSetup {
  const m = sectPr.match(/<w:pgMar\b[^>]*\/>/);
  if (!m) return setup;
  const attr = (key: string) => {
    const a = m[0].match(new RegExp(`w:${key}="([\\d.]+)"`));
    return a ? Number(a[1]) : undefined;
  };
  return {
    ...setup,
    marginTopMm: twipsToMm(attr("top"), setup.marginTopMm),
    marginRightMm: twipsToMm(attr("right"), setup.marginRightMm),
    marginBottomMm: twipsToMm(attr("bottom"), setup.marginBottomMm),
    marginLeftMm: twipsToMm(attr("left"), setup.marginLeftMm),
  };
}

/**
 * Extract the document-level page setup (size, orientation, margins) from the
 * body-level `w:sectPr`, which defines the default (final) section layout.
 * Falls back to A4 portrait with 1″ margins.
 */
export function parseWordPageSetup(documentXml: string): WordPageSetup {
  let setup: WordPageSetup = { ...WORD_PAGE_DEFAULTS };
  const start = documentXml.lastIndexOf("<w:sectPr");
  if (start === -1) return setup;
  const end = documentXml.indexOf("</w:sectPr>", start);
  if (end === -1) return setup;
  const sectPr = documentXml.slice(start, end + "</w:sectPr>".length);
  setup = parsePgSz(sectPr, setup);
  setup = parsePgMar(sectPr, setup);
  return setup;
}

export async function extractWordPageSetup(bytes: Uint8Array): Promise<WordPageSetup> {
  let zip: ReturnType<typeof unzipSync>;
  try {
    zip = unzipSync(bytes);
  } catch {
    throw new WordToPdfError(
      "This Word document could not be read. Please verify that the file is not corrupted and try again.",
    );
  }
  const doc = zip["word/document.xml"];
  if (!doc) {
    throw new WordToPdfError("This file is not a valid Word (.docx) document.");
  }
  return parseWordPageSetup(strFromU8(doc));
}

/**
 * The print stylesheet used to turn the rendered DOCX preview into the PDF the
 * user downloads. Freezes the paper to the document's real size/orientation
 * (exact mm, zero @page margin because the DOCX pages already carry their own
 * margins), shows only the rendering region, and forces every rendered page to
 * land on exactly one printed sheet.
 */
export function buildWordPrintCss(setup: WordPageSetup): string {
  return [
    `@page {`,
    `  size: ${setup.widthMm}mm ${setup.heightMm}mm;`,
    `  margin: 0;`,
    `}`,
    `@media print {`,
    `  body * { visibility: hidden !important; }`,
    `  #wp-print, #wp-print * { visibility: visible !important; }`,
    `  #wp-print { position: absolute; top: 0; left: 0; }`,
    `  #wp-print .docx-wrapper { padding: 0 !important; background: transparent !important; }`,
    `  #wp-print section.docx {`,
    `    height: auto !important;`,
    `    overflow: visible !important;`,
    `    margin: 0 !important;`,
    `    box-shadow: none !important;`,
    `    zoom: 1 !important;`,
    `    break-after: page;`,
    `    page-break-after: always;`,
    `  }`,
    `}`,
  ].join("\n");
}

/** Count explicit page-break markers for an upper estimate of page count. */
export function countExplicitPageBreaks(documentXml: string): number {
  const breaks =
    (documentXml.match(/w:type="page"/g)?.length ?? 0) +
    (documentXml.match(/<w:pageBreakBefore\b/g)?.length ?? 0);
  return breaks;
}