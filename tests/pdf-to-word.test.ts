import { describe, expect, it } from "vitest";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { strFromU8, unzipSync } from "fflate";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import {
  buildDocx,
  convertPdfToWord,
  looksLikePdf,
  PDF_TO_WORD_MAX_BYTES,
  PDF_TO_WORD_MAX_PAGES,
  PdfJsApi,
  PdfToWordError,
  sanitizeDocxFilename,
} from "@/tools/compute/pdf/pdf-to-word";

const RED_1x1_PNG = Uint8Array.from(
  Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
    "base64",
  ),
);

type PageBuilder = (
  page: ReturnType<PDFDocument["addPage"]>,
  font: Awaited<ReturnType<PDFDocument["embedFont"]>>,
) => void | Promise<void>;

async function makePdf(pages: PageBuilder[], size: [number, number] = [400, 400]): Promise<Uint8Array> {
  const src = await PDFDocument.create();
  const font = await src.embedFont(StandardFonts.Helvetica);
  for (const build of pages) {
    await build(src.addPage(size), font);
  }
  return src.save();
}

function docText(docx: Uint8Array): string {
  const zip = unzipSync(docx);
  if (!zip["word/document.xml"]) {
    throw new Error("document.xml missing from the DOCX package");
  }
  return strFromU8(zip["word/document.xml"]);
}

function zipParts(docx: Uint8Array): string[] {
  return Object.keys(unzipSync(docx)).sort();
}

function textContents(xml: string): string[] {
  const out: string[] = [];
  for (const match of xml.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)) {
    out.push(match[1]);
  }
  return out;
}

const bullets = ["1. First", "2. Second", "3. Third"];

describe("PDF to Word — convertPdfToWord", () => {
  it("converts a simple one-page PDF into a valid, editable DOCX", async () => {
    const bytes = await makePdf([
      (page, font) => {
        page.drawText("My Report", { x: 40, y: 360, size: 24, font, color: rgb(0, 0, 0) });
        page.drawText("The quick brown fox jumps over the lazy dog.", {
          x: 40,
          y: 300,
          size: 12,
          font,
          color: rgb(0, 0, 0),
        });
        page.drawText("A second paragraph that stands alone.", {
          x: 40,
          y: 240,
          size: 12,
          font,
          color: rgb(0, 0, 0),
        });
      },
    ]);

    const res = await convertPdfToWord(bytes, pdfjs);
    expect(res.pageCount).toBe(1);
    expect(res.textChars).toBeGreaterThan(0);
    expect(res.scannedPages).toBe(0);
    expect(res.imagesSkipped).toBe(0);
    expect(res.warnings).toEqual([]);

    expect(new TextDecoder().decode(res.docx.slice(0, 2))).toBe("PK");
    const parts = zipParts(res.docx);
    for (const required of [
      "[Content_Types].xml",
      "_rels/.rels",
      "word/document.xml",
      "word/styles.xml",
      "word/settings.xml",
      "word/_rels/document.xml.rels",
      "docProps/core.xml",
      "docProps/app.xml",
    ]) {
      expect(parts).toContain(required);
    }

    const xml = docText(res.docx);
    const texts = textContents(xml);
    expect(texts).toContain("My Report");
    expect(texts).toContain("The quick brown fox jumps over the lazy dog.");
    expect(texts).toContain("A second paragraph that stands alone.");
    expect(xml).toContain('xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"');
    expect(xml).toContain("w:sectPr");
  });

  it("preserves page order with a page break between pages", async () => {
    const bytes = await makePdf(
      [1, 2, 3].map((n) => (page, font) => {
        page.drawText(`Chapter ${n}`, { x: 40, y: 360, size: 24, font });
        page.drawText(`Content belonging to page ${n}.`, { x: 40, y: 300, size: 12, font });
      }),
    );

    const res = await convertPdfToWord(bytes, pdfjs);
    expect(res.pageCount).toBe(3);
    const xml = docText(res.docx);
    expect((xml.match(/w:type="page"/g) ?? []).length).toBe(2);
    const texts = textContents(xml);
    const indexOf = (t: string) => texts.indexOf(t);
    expect(indexOf("Chapter 1")).toBeGreaterThan(-1);
    expect(indexOf("Chapter 1")).toBeLessThan(indexOf("Chapter 2"));
    expect(indexOf("Chapter 2")).toBeLessThan(indexOf("Chapter 3"));
  });

  it("maps large text to Word heading styles by relative size", async () => {
    const bytes = await makePdf([
      (page, font) => {
        page.drawText("Chapter Title", { x: 40, y: 360, size: 24, font });
        page.drawText("Section Subtitle", { x: 40, y: 320, size: 16, font });
        page.drawText("Normal body copy.", { x: 40, y: 280, size: 12, font });
      },
    ]);

    const xml = docText((await convertPdfToWord(bytes, pdfjs)).docx);
    expect(xml).toContain('w:pStyle w:val="Heading1"');
    expect(xml).toContain('w:pStyle w:val="Heading2"');
    expect((xml.match(/w:pStyle w:val="Heading3"/g) ?? []).length).toBe(0);
  });

  it("turns numbered lists into hanging-indent list paragraphs", async () => {
    const bytes = await makePdf([
      (page, font) => {
        bullets.forEach((b, i) => page.drawText(b, { x: 50, y: 300 - i * 24, size: 12, font }));
      },
    ]);

    const xml = docText((await convertPdfToWord(bytes, pdfjs)).docx);
    expect(xml).toContain('w:ind w:left="360" w:hanging="360"');
    const texts = textContents(xml);
    expect(texts.some((t) => t.startsWith("1."))).toBe(true);
    expect(texts.some((t) => t.startsWith("2."))).toBe(true);
    expect(texts.some((t) => t.startsWith("3."))).toBe(true);
  });

  it("merges consecutive close lines into a single paragraph", async () => {
    const bytes = await makePdf([
      (page, font) => {
        page.drawText("The quick brown fox", { x: 40, y: 300, size: 12, font });
        page.drawText("jumps over the lazy dog.", { x: 40, y: 290, size: 12, font });
      },
    ]);

    const xml = docText((await convertPdfToWord(bytes, pdfjs)).docx);
    expect(xml).toContain("The quick brown fox jumps over the lazy dog.");
  });

  it("reconstructs simple aligned-column tables as real Word tables", async () => {
    const rows = [
      ["Product", "Qty", "Price"],
      ["Widget", "2", "500"],
      ["Gadget", "5", "1200"],
      ["Totals", "7", "1700"],
    ];
    const xs = [40, 140, 240];
    const bytes = await makePdf([
      (page, font) => {
        rows.forEach((row, ri) => {
          row.forEach((cell, ci) => page.drawText(cell, { x: xs[ci], y: 360 - ri * 22, size: 12, font }));
        });
      },
    ]);

    const xml = docText((await convertPdfToWord(bytes, pdfjs)).docx);
    expect(xml).toContain("<w:tbl>");
    const texts = textContents(xml);
    for (const cell of ["Product", "Widget", "500", "Totals", "1700"]) {
      expect(texts).toContain(cell);
    }
  });

  it("centres text that is visually centred on the page", async () => {
    const label = "Centered Heading";
    const bytes = await makePdf([
      async (page, font) => {
        const width = (font as unknown as { widthOfTextAtSize: (t: string, s: number) => number }).widthOfTextAtSize(
          label,
          20,
        );
        page.drawText(label, { x: (400 - width) / 2, y: 360, size: 20, font });
        page.drawText("Left aligned body.", { x: 20, y: 300, size: 12, font });
      },
    ]);

    const xml = docText((await convertPdfToWord(bytes, pdfjs)).docx);
    expect(xml).toContain('<w:jc w:val="center"');
  });

  it("reports scanned/image-only pages instead of silently dropping them", async () => {
    const src = await PDFDocument.create();
    const font = await src.embedFont(StandardFonts.Helvetica);
    const png = await src.embedPng(RED_1x1_PNG);
    const page1 = src.addPage([200, 300]);
    page1.drawImage(png, { x: 10, y: 10, width: 40, height: 40 });
    const page2 = src.addPage([200, 300]);
    page2.drawText("Real text page.", { x: 10, y: 200, size: 12, font });
    const bytes = await src.save();

    const res = await convertPdfToWord(bytes, pdfjs);
    expect(res.scannedPages).toBe(1);
    expect(res.imagesSkipped).toBe(0);
    expect(res.warnings.some((w) => /scanned|image-based/i.test(w))).toBe(true);
    expect(docText(res.docx)).toContain("Real text page.");
  });

  it("detects and reports an image embedded alongside text", async () => {
    const src = await PDFDocument.create();
    const font = await src.embedFont(StandardFonts.Helvetica);
    const png = await src.embedPng(RED_1x1_PNG);
    const page = src.addPage([200, 200]);
    page.drawImage(png, { x: 10, y: 10, width: 40, height: 40 });
    page.drawText("Image and text page.", { x: 10, y: 120, size: 12, font });
    const bytes = await src.save();

    const res = await convertPdfToWord(bytes, pdfjs);
    expect(res.imagesSkipped).toBeGreaterThan(0);
    expect(res.warnings.some((w) => /image/i.test(w))).toBe(true);
    expect(docText(res.docx)).toContain("Image and text page.");
  });

  it("throws a friendly error for password-protected PDFs", async () => {
    const stub: PdfJsApi = {
      getDocument: () =>
        ({
          promise: Promise.reject(Object.assign(new Error("Wrong password"), { name: "PasswordException" })),
        }) as unknown as ReturnType<PdfJsApi["getDocument"]>,
    };
    const headerBytes = new TextEncoder().encode("%PDF-1.7");
    await expect(convertPdfToWord(headerBytes, stub)).rejects.toThrow(PdfToWordError);
    await expect(convertPdfToWord(headerBytes, stub)).rejects.toThrow(/password/i);
  });

  it("rejects files that are not PDFs", async () => {
    await expect(convertPdfToWord(new Uint8Array([1, 2, 3, 4, 5]), pdfjs)).rejects.toThrow(PdfToWordError);
    await expect(convertPdfToWord(new Uint8Array([1, 2, 3, 4, 5]), pdfjs)).rejects.toThrow(/valid PDF/);
  });

  it("rejects PDFs with nothing readable in them", async () => {
    const src = await PDFDocument.create();
    const bytes = await src.save();
    await expect(convertPdfToWord(bytes, pdfjs)).rejects.toThrow(PdfToWordError);
    await expect(convertPdfToWord(bytes, pdfjs)).rejects.toThrow(/no readable text|no pages/);
  });

  it("rejects damaged PDFs with a clear message", async () => {
    const garbage = new TextEncoder().encode("%PDF-1.4\n%%EOF\ngarbage-not-a-real-pdf");
    await expect(convertPdfToWord(garbage, pdfjs)).rejects.toThrow(PdfToWordError);
    await expect(convertPdfToWord(garbage, pdfjs)).rejects.toThrow(/damaged/);
  });

  it("enforces the byte-size limit", async () => {
    const big = new Uint8Array(PDF_TO_WORD_MAX_BYTES + 1);
    big.set(new TextEncoder().encode("%PDF-"));
    await expect(convertPdfToWord(big, pdfjs)).rejects.toThrow(/too large/);
  });

  it("enforces the page-count limit", async () => {
    const src = await PDFDocument.create();
    for (let i = 0; i < PDF_TO_WORD_MAX_PAGES + 1; i++) {
      src.addPage([100, 100]);
    }
    const bytes = await src.save();
    await expect(convertPdfToWord(bytes, pdfjs)).rejects.toThrow(/200-page limit/);
  });

  it("reports conversion status through the callback", async () => {
    const bytes = await makePdf([
      (page, font) => page.drawText("Status check.", { x: 40, y: 300, size: 12, font }),
    ]);
    const statuses: string[] = [];
    await convertPdfToWord(bytes, pdfjs, (s) => statuses.push(s));
    expect(statuses).toContain("Reading PDF…");
    expect(statuses).toContain("Building Word document…");
  });
});

describe("PDF to Word — buildDocx", () => {
  it("produces a complete OOXML package", () => {
    const docx = buildDocx([{ type: "paragraph", text: "Hello world", align: "left", list: false }]);
    const parts = zipParts(docx);
    for (const required of [
      "[Content_Types].xml",
      "_rels/.rels",
      "word/document.xml",
      "word/styles.xml",
      "word/settings.xml",
      "docProps/core.xml",
      "docProps/app.xml",
    ]) {
      expect(parts).toContain(required);
    }
    const xml = docText(docx);
    expect(xml).toContain("Hello world");
    expect(xml).toContain("w:sectPr");
  });

  it("escapes XML-special characters in text", () => {
    const xml = docText(buildDocx([{ type: "paragraph", text: 'R&D <so> & "quotes"', align: "left", list: false }]));
    expect(xml).toContain("R&amp;D &lt;so&gt; &amp; &quot;quotes&quot;");
  });

  it("emits explicit page breaks", () => {
    const docx = buildDocx([{ type: "paragraph", text: "one", align: "left", list: false }, { type: "pagebreak" }]);
    expect(docText(docx)).toContain('<w:br w:type="page"/>');
  });

  it("emits a centered heading with its style", () => {
    const xml = docText(
      buildDocx([{ type: "heading", level: 1, text: "Title", align: "center" }]),
    );
    expect(xml).toContain('w:pStyle w:val="Heading1"');
    expect(xml).toContain('<w:jc w:val="center"');
  });
});

describe("PDF to Word — helpers", () => {
  it("looksLikePdf checks the %PDF- magic header", () => {
    expect(looksLikePdf(new TextEncoder().encode("%PDF-1.7"))).toBe(true);
    expect(looksLikePdf(new TextEncoder().encode("not a pdf"))).toBe(false);
    expect(looksLikePdf(new Uint8Array([0, 1, 2]))).toBe(false);
  });

  it("sanitizeDocxFilename strips paths, unsafe characters and dangles a .pdf/.docx suffix", () => {
    expect(sanitizeDocxFilename("report.pdf")).toBe("report.docx");
    expect(sanitizeDocxFilename("my/report:final.pdf")).toBe("my_report_final.docx");
    expect(sanitizeDocxFilename('scan "v2".PDF')).toBe("scan _v2_.docx");
    expect(sanitizeDocxFilename("already.docx")).toBe("already.docx");
    expect(sanitizeDocxFilename("")).toBe("converted-document.docx");
    const long = `${"a".repeat(250)}.pdf`;
    expect(sanitizeDocxFilename(long).length).toBeLessThanOrEqual(125);
  });
});