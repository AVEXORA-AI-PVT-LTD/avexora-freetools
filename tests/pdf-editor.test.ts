import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import {
  PDF_EDITOR_MAX_PAGES,
  buildEditedPdf,
  clamp,
  colorsForItems,
  createElementId,
  elementFromTextItem,
  extractColorRuns,
  hexToRgb,
  isPdfSigned,
  makeElement,
  sanitizeEditedFilename,
  textItemBBox,
  wrapText,
  type PdfEditorElement,
  type PdfSourceTextItem,
} from "@/tools/compute/pdf/pdf-editor";
import { PdfEditorError } from "@/tools/compute/pdf/pdf-editor";

/* ---------------------------------------------------------------------------
 * Fixture helpers — the editor works on the exact same coordinate space pdf-lib
 * draws in (PDF user space, origin bottom-left), so the tests build real PDFs
 * with pdf-lib and validate placement math against them.
 * ------------------------------------------------------------------------- */

async function makeFixture(): Promise<Uint8Array> {
  const src = await PDFDocument.create();
  const font = await src.embedFont(StandardFonts.Helvetica);
  const p1 = src.addPage([612, 792]);
  p1.drawText("Hello Avenue Tools", { x: 80, y: 700, size: 24, font, color: rgb(0, 0, 0) });
  p1.drawRectangle({ x: 60, y: 300, width: 240, height: 120, color: rgb(0.8, 0.3, 0.2) });
  const p2 = src.addPage([400, 700]);
  p2.drawText("Page two", { x: 30, y: 660, size: 20, font });
  return src.save();
}

async function extractTextItems(bytes: Uint8Array, pageNumber: number) {
  const doc = await pdfjs.getDocument({ data: bytes.slice(), useSystemFonts: false }).promise;
  const page = await doc.getPage(pageNumber);
  const content = await page.getTextContent();
  return { page, items: content.items };
}

/**
 * pdf-lib does not expose a public encrypt API, so this hand-builds a small
 * classic-tabbed, encrypted PDF (with a real /Encrypt dictionary) that
 * `PDFDocument.load` will reject unless ignoreEncryption is set.
 */
function makeEncryptedBytes(): Uint8Array {
  const hex = "0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF";
  const objects = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    "2 0 obj\n<< /Type /Pages /Kids [ 3 0 R ] /Count 1 >>\nendobj\n",
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] /Resources << >> /Contents 4 0 R >>\nendobj\n",
    "4 0 obj\n<< /Length 0 >>\nstream\n\nendstream\nendobj\n",
    `5 0 obj\n<< /Filter /Standard /V 2 /R 3 /Length 128 /O <${hex}> /U <${hex}> /P -44 >>\nendobj\n`,
  ];
  const offsets: number[] = [];
  let body = "%PDF-1.4\n";
  for (const obj of objects) {
    offsets.push(body.length);
    body += obj;
  }
  const xrefAt = body.length;
  let xref = "xref\n";
  xref += "0 6\n";
  xref += "0000000000 65535 f \n";
  for (const off of offsets) {
    xref += `${String(off).padStart(10, "0")} 00000 n \n`;
  }
  xref += `trailer\n<< /Size 6 /Root 1 0 R /Encrypt 5 0 R >>\n`;
  xref += `startxref\n${xrefAt}\n%%EOF\n`;
  return new TextEncoder().encode(body + xref);
}

/* --------------------------------------------------------------------------- */

describe("pdf-editor compute — text item geometry", () => {
  it("maps a horizontal glyph run into an axis-aligned user-space box", () => {
    const box = textItemBBox({
      str: "Hello",
      transform: [12, 0, 0, 12, 100, 200],
      width: 60,
      height: 12,
      fontName: "g_d0_f1",
    });
    expect(box.x).toBeCloseTo(100);
    expect(box.y).toBeCloseTo(212);
    expect(box.width).toBeCloseTo(60);
    expect(box.height).toBeCloseTo(12);
  });

  it("handles a page whose /Rotate is 90° (transform swaps axes)", () => {
    const box = textItemBBox({
      str: "Rot",
      transform: [0, 12, -12, 0, 300, 200],
      width: 30,
      height: 12,
      fontName: "g_d0_f1",
    });
    expect(box.width).toBeGreaterThan(0);
    expect(box.height).toBeGreaterThan(0);
    expect(box.x).toBeLessThan(300);
  });

  it("extracts text geometry and a font style from a real page", async () => {
    const bytes = await makeFixture();
    const { items } = await extractTextItems(bytes, 1);
    const itemsWithText = items.filter((i) => (i as { str: string }).str.trim() !== "");
    expect(itemsWithText.length).toBeGreaterThan(0);
    const first = itemsWithText[0] as {
      str: string;
      transform: number[];
      width: number;
      height: number;
      fontName: string;
    };
    const el = elementFromTextItem("el-1", 1, first);
    expect(el.pageNumber).toBe(1);
    expect(el.source).toBe("extracted");
    expect(el.text.length).toBeGreaterThan(0);
    // The fixture draws 24pt text at x=80, so the box must sit inside the page.
    expect(el.x).toBeGreaterThanOrEqual(0);
    expect(el.width).toBeGreaterThan(5);
    expect(el.height).toBeGreaterThan(5);
    expect(el.fontSize).toBeGreaterThanOrEqual(8);
  });

  it("infers weight and style from Adobe font names", () => {
    const boldItalic = elementFromTextItem("el-a", 1, {
      str: "x",
      transform: [12, 0, 0, 12, 0, 12],
      width: 6,
      height: 12,
      fontName: "g_d1_f2",
    });
    expect(boldItalic.weight).toBe("normal");
    const named = elementFromTextItem("el-b", 1, {
      str: "x",
      transform: [12, 0, 0, 12, 0, 12],
      width: 6,
      height: 12,
      fontName: "BoldItalic",
    });
    expect(named.weight).toBe("bold");
    expect(named.italic).toBe(true);
  });
});

describe("pdf-editor compute — wrap, helpers, defaults", () => {
  it("wraps words to the estimated max character width per line", () => {
    const lines = wrapText("one two three four five", 120, 12, "sans");
    expect(lines.length).toBeGreaterThan(1);
    expect(lines.flat().join(" ").replace(/\s+/g, " ")).toBe(
      "one two three four five",
    );
  });

  it("respects explicit line breaks", () => {
    expect(wrapText("alpha\nbeta", 9999, 12, "sans")).toEqual(["alpha", "beta"]);
  });

  it("splits over-long unbroken words", () => {
    const lines = wrapText("antidisestablishmentarianism", 60, 12, "sans");
    expect(lines.length).toBeGreaterThan(1);
    expect(lines.join("")).toBe("antidisestablishmentarianism");
  });

  it("clamps and converts colors", () => {
    expect(clamp(5, 0, 3)).toBe(3);
    expect(hexToRgb("#010203")).toEqual({ r: 1, g: 2, b: 3 });
    expect(hexToRgb("#123")).toEqual({ r: 17, g: 34, b: 51 });
    expect(hexToRgb("nonsense")).toEqual({ r: 0, g: 0, b: 0 });
  });

  it("creates new elements sized and centered on a page", () => {
    const el = makeElement("heading", 1, { width: 612, height: 792 });
    expect(el.kind).toBe("heading");
    expect(el.source).toBe("new");
    expect(el.fontSize).toBeGreaterThan(0);
    expect(el.x).toBeGreaterThanOrEqual(0);
    expect(el.y).toBeGreaterThan(0);
    expect(el.x + el.width).toBeLessThanOrEqual(612 + 1);
    expect(el.y).toBeLessThanOrEqual(792 + 1);
    expect(el.id).toMatch(/^el-/);
    expect(createElementId()).not.toBe(el.id);
  });

  it("sanitizes filenames", () => {
    expect(sanitizeEditedFilename("Contract Final.pdf")).toBe("edited-Contract-Final.pdf");
    expect(sanitizeEditedFilename("../weird/name!.pdf")).toBe("edited-..weirdname.pdf");
  });
});

describe("pdf-editor compute — buildEditedPdf", () => {
  const sansLoader = async (): Promise<Uint8Array> => {
    const p = join(process.cwd(), "public", "pdfjs-standard-fonts", "LiberationSans-Regular.ttf");
    return new Uint8Array(readFileSync(p));
  };

  it("adds new text without touching existing page content", async () => {
    const bytes = await makeFixture();
    const element: PdfEditorElement = {
      id: "el-new",
      pageNumber: 1,
      kind: "text",
      source: "new",
      text: "Added line",
      x: 100,
      y: 500,
      width: 120,
      height: 16,
      fontSize: 16,
      font: "sans",
      fallbackFont: "sans",
      weight: "normal",
      italic: false,
      color: "#111827",
      align: "left",
      lineHeight: 1.25,
      removed: false,
    };
    const out = await buildEditedPdf(bytes, [element], { fontLoader: sansLoader });
    expect(out.length).toBeGreaterThan(bytes.length);
    const doc = await PDFDocument.load(out, { ignoreEncryption: true });
    expect(doc.getPageCount()).toBe(2);
  });

  it("redraws a replaced extracted-text area over a cover rect", async () => {
    const bytes = await makeFixture();
    const { items } = await extractTextItems(bytes, 1);
    const item = items.find(
      (i) => (i as { str: string }).str.includes("Hello"),
    ) as { str: string; transform: number[]; width: number; height: number; fontName: string };
    expect(item).toBeDefined();
    const replaced = elementFromTextItem("el-replace", 1, item);
    replaced.text = "Replaced headline";
    const out = await buildEditedPdf(bytes, [replaced], { fontLoader: sansLoader });
    const doc = await PDFDocument.load(out, { ignoreEncryption: true });
    expect(doc.getPageCount()).toBe(2);
  });

  it("covers an area when an extracted element is removed", async () => {
    const bytes = await makeFixture();
    const { items } = await extractTextItems(bytes, 1);
    const item = items.find(
      (i) => (i as { str: string }).str.includes("Hello"),
    ) as { str: string; transform: number[]; width: number; height: number; fontName: string };
    const removed = elementFromTextItem("el-rm", 1, item);
    removed.removed = true;
    removed.text = "";
    const out = await buildEditedPdf(bytes, [removed], { fontLoader: sansLoader });
    const doc = await PDFDocument.load(out, { ignoreEncryption: true });
    expect(doc.getPageCount()).toBe(2);
  });

  it("draws standard-font text (serif) without a font loader", async () => {
    const bytes = await makeFixture();
    const element: PdfEditorElement = {
      id: "el-serif",
      pageNumber: 2,
      kind: "heading",
      source: "new",
      text: "Serif heading",
      x: 40,
      y: 640,
      width: 200,
      height: 30,
      fontSize: 22,
      font: "serif",
      fallbackFont: "serif",
      weight: "bold",
      italic: false,
      color: "#1d4ed8",
      align: "center",
      lineHeight: 1.15,
      removed: false,
    };
    const out = await buildEditedPdf(bytes, [element]);
    const doc = await PDFDocument.load(out, { ignoreEncryption: true });
    expect(doc.getPageCount()).toBe(2);
  });

  it("rejects an edit aimed at a page that does not exist", async () => {
    const bytes = await makeFixture();
    const element: PdfEditorElement = {
      id: "el-bad",
      pageNumber: 9,
      kind: "text",
      source: "new",
      text: "x",
      x: 10,
      y: 10,
      width: 20,
      height: 12,
      fontSize: 12,
      font: "sans",
      fallbackFont: "sans",
      weight: "normal",
      italic: false,
      color: "#111827",
      align: "left",
      lineHeight: 1.25,
      removed: false,
    };
    await expect(buildEditedPdf(bytes, [element], { fontLoader: sansLoader })).rejects.toThrowError(
      PdfEditorError,
    );
    try {
      await buildEditedPdf(bytes, [element], { fontLoader: sansLoader });
      expect.unreachable("should have thrown");
    } catch (err) {
      expect((err as PdfEditorError).code).toBe("bad-page");
    }
  });

  it("refuses password-protected PDFs", async () => {
    const bytes = makeEncryptedBytes();
    try {
      await buildEditedPdf(bytes, []);
      expect.unreachable("should have thrown");
    } catch (err) {
      expect((err as PdfEditorError).code).toBe("encrypted");
    }
  });

  it("rotates drawn text correctly on a /Rotate 90 page", async () => {
    const src = await PDFDocument.create();
    const font = await src.embedFont(StandardFonts.Helvetica);
    const p = src.addPage([612, 792]);
    p.setRotation(degrees(90));
    p.drawText("Sideways page", { x: 200, y: 200, size: 20, font });
    const bytes = await src.save();
    const element: PdfEditorElement = {
      id: "el-rot",
      pageNumber: 1,
      kind: "text",
      source: "new",
      text: "Overlay marker",
      x: 120,
      y: 660,
      width: 160,
      height: 20,
      fontSize: 16,
      font: "sans",
      fallbackFont: "sans",
      weight: "bold",
      italic: false,
      color: "#b45309",
      align: "left",
      lineHeight: 1.25,
      removed: false,
    };
    const out = await buildEditedPdf(bytes, [element], { fontLoader: sansLoader });
    const doc = await PDFDocument.load(out, { ignoreEncryption: true });
    expect(doc.getPageCount()).toBe(1);
    expect(PDF_EDITOR_MAX_PAGES).toBe(200);
  });
});

/* ---------------------------------------------------------------------------
 * Text colour detection, original-font reuse and signature detection.
 * ------------------------------------------------------------------------- */

describe("pdf-editor compute — text colour detection", () => {
  const g = (u: string) => [{ unicode: u }];

  const opCodes = {
    showText: pdfjs.OPS.showText,
    showSpacedText: pdfjs.OPS.showSpacedText,
    nextLineShowText: pdfjs.OPS.nextLineShowText,
    nextLineSetSpacingShowText: pdfjs.OPS.nextLineSetSpacingShowText,
    setFillRGBColor: pdfjs.OPS.setFillRGBColor,
    setFillGray: pdfjs.OPS.setFillGray,
    setFillCMYKColor: pdfjs.OPS.setFillCMYKColor,
    setFillColor: pdfjs.OPS.setFillColor,
    setFillColorSpace: pdfjs.OPS.setFillColorSpace,
  };

  it("records the fill colour active at each show-text operator", () => {
    const runs = extractColorRuns(
      [
        pdfjs.OPS.setFillRGBColor,
        pdfjs.OPS.showText,
        pdfjs.OPS.setFillGray,
        pdfjs.OPS.showText,
        pdfjs.OPS.showText,
      ],
      [["#ff0000"], [g("Hi")], [0.5], [g("bye")], [g("now")]],
      opCodes,
    );
    expect(runs).toEqual([
      { text: "Hi", color: "#ff0000" },
      { text: "bye", color: "#808080" },
      { text: "now", color: "#808080" },
    ]);
  });

  it("aligns colour runs back to the raw text items by character consumption", () => {
    const colors = colorsForItems(
      [
        { text: "Hello", color: "#112233" },
        { text: " world", color: "#445566" },
      ],
      [
        { str: "Hello", transform: [1, 0, 0, 1, 0, 0], width: 30, height: 12 },
        { str: "world", transform: [1, 0, 0, 1, 0, 0], width: 30, height: 12 },
      ],
    );
    expect(colors).toEqual(["#112233", "#445566"]);
  });

  it("recovers a real page's text colour from its operator list", async () => {
    const src = await PDFDocument.create();
    const font = await src.embedFont(StandardFonts.Helvetica);
    const p = src.addPage([612, 792]);
    p.drawText("Coloured text", { x: 80, y: 700, size: 20, font, color: rgb(0.2, 0.53, 0.82) });
    const bytes = await src.save();
    const doc = await pdfjs.getDocument({ data: bytes.slice(), useSystemFonts: false }).promise;
    const page = await doc.getPage(1);
    const content = await page.getTextContent();
    const items = content.items as unknown[];
    const { fnArray, argsArray } = await page.getOperatorList();
    const colors = colorsForItems(
      extractColorRuns(fnArray, argsArray, opCodes),
      content.items as unknown as PdfSourceTextItem[],
    );
    const idx = items.findIndex((i) => ((i as { str?: string }).str ?? "").trim() === "Coloured text");
    expect(idx).toBeGreaterThanOrEqual(0);
    expect(idx).toBeLessThan(colors.length);
    // pdf-lib writes "0.2 0.53 0.82 rg"; pdf.js normalises to the hex "#3387d1".
    expect(colors[idx]).toBe("#3387d1");
  });
});

describe("pdf-editor compute — original font reuse", () => {
  const liberationPath = join(
    process.cwd(),
    "public",
    "pdfjs-standard-fonts",
    "LiberationSans-Regular.ttf",
  );
  const throwingLoader = async (): Promise<Uint8Array> => {
    throw new Error("original-font reuse should make the loader unnecessary");
  };

  it("marks extracted elements as using the original font and re-embeds their program", async () => {
    const liberation = new Uint8Array(readFileSync(liberationPath));
    const src = await PDFDocument.create();
    src.registerFontkit(fontkit);
    const font = await src.embedFont(liberation, { subset: false });
    const p = src.addPage([612, 792]);
    p.drawText("Reuse this line", { x: 80, y: 700, size: 24, font });
    const bytes = await src.save();
    const { items } = await extractTextItems(bytes, 1);
    const item = items.find((i) =>
      ((i as { str?: string }).str ?? "").includes("Reuse"),
    ) as { str: string; transform: number[]; width: number; height: number; fontName: string };
    expect(item).toBeDefined();
    const el = elementFromTextItem("el-reuse", 1, item);
    expect(el.font).toBe("original");
    expect(el.fallbackFont).toContain("sans");
    el.text = "Replaced text";
    const out = await buildEditedPdf(bytes, [el], { fontLoader: throwingLoader });
    expect(out.length).toBeGreaterThan(0);
    const plain = await pdfjs.getDocument({ data: out.slice(), useSystemFonts: false }).promise;
    const page = await plain.getPage(1);
    const after = (await page.getTextContent()).items
      .map((i) => (i as { str?: string }).str ?? "")
      .join("");
    expect(after).toContain("Replaced text");
  });

  it("reuses a standard-14 base font (Helvetica) without any loader", async () => {
    const bytes = await makeFixture();
    const { items } = await extractTextItems(bytes, 1);
    const item = items.find((i) =>
      ((i as { str?: string }).str ?? "").includes("Hello"),
    ) as { str: string; transform: number[]; width: number; height: number; fontName: string };
    const el = elementFromTextItem("el-std", 1, item);
    el.text = "Shipped quietly";
    const out = await buildEditedPdf(bytes, [el], { fontLoader: throwingLoader });
    expect(out.length).toBeGreaterThan(0);
    const doc = await PDFDocument.load(out, { ignoreEncryption: true });
    expect(doc.getPageCount()).toBe(2);
  });
});

describe("pdf-editor compute — untouched content preservation", () => {
  it("keeps other graphics and pages byte-identical in behaviour", async () => {
    const bytes = await makeFixture();
    const { items } = await extractTextItems(bytes, 1);
    const item = items.find((i) =>
      ((i as { str?: string }).str ?? "").includes("Hello"),
    ) as { str: string; transform: number[]; width: number; height: number; fontName: string };
    const el = elementFromTextItem("el-keep", 1, item);
    el.text = "Edited headline";

    const out = await buildEditedPdf(bytes, [el], {
      fontLoader: async () => {
        const p = join(process.cwd(), "public", "pdfjs-standard-fonts", "LiberationSans-Regular.ttf");
        return new Uint8Array(readFileSync(p));
      },
    });
    const doc = await pdfjs.getDocument({ data: out.slice(), useSystemFonts: false }).promise;

    // Page 2 was not edited and must keep its text.
    const page2 = await doc.getPage(2);
    const page2Text = (await page2.getTextContent()).items
      .map((i) => (i as { str?: string }).str ?? "")
      .join("");
    expect(page2Text).toContain("Page two");

    // The rectangle (no relation to the edit) must still be painted on page 1.
    const page1 = await doc.getPage(1);
    const { fnArray, argsArray } = await page1.getOperatorList();
    const rectFillIdx = fnArray.findIndex(
      (fn, i) =>
        fn === pdfjs.OPS.setFillRGBColor &&
        argsArray[i]?.[0] === "#cc4c33", // rgb(0.8, 0.3, 0.2) as pdf.js sees it
    );
    expect(rectFillIdx).toBeGreaterThanOrEqual(0);
  });

  it("returns false for an unsigned PDF and true for an AcroForm signature field", async () => {
    const bytes = await makeFixture();
    expect(await isPdfSigned(bytes)).toBe(false);

    const signed = makeSignedBytes();
    expect(await isPdfSigned(signed)).toBe(true);
  });
});

/** Hand-rolled PDF that carries an AcroForm with a /Sig field. */
function makeSignedBytes(): Uint8Array {
  const objects = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R /AcroForm 5 0 R >>\nendobj\n",
    "2 0 obj\n<< /Type /Pages /Kids [ 3 0 R ] /Count 1 >>\nendobj\n",
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] /Resources << >> /Contents 4 0 R >>\nendobj\n",
    "4 0 obj\n<< /Length 0 >>\nstream\n\nendstream\nendobj\n",
    "5 0 obj\n<< /Fields [ 6 0 R ] /SigFlags 3 >>\nendobj\n",
    "6 0 obj\n<< /Type /Annot /Subtype /Widget /Rect [0 0 100 40] /FT /Sig /T (sig1) >>\nendobj\n",
  ];
  const offsets: number[] = [];
  let body = "%PDF-1.4\n";
  for (const obj of objects) {
    offsets.push(body.length);
    body += obj;
  }
  const xrefAt = body.length;
  let xref = "xref\n";
  xref += "0 7\n";
  xref += "0000000000 65535 f \n";
  for (const off of offsets) {
    xref += `${String(off).padStart(10, "0")} 00000 n \n`;
  }
  xref += `trailer\n<< /Size 7 /Root 1 0 R >>\n`;
  xref += `startxref\n${xrefAt}\n%%EOF\n`;
  return new TextEncoder().encode(body + xref);
}