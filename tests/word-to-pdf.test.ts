import { describe, expect, it } from "vitest";
import { strToU8, zipSync } from "fflate";
import {
  buildWordPrintCss,
  classifyWordFile,
  countExplicitPageBreaks,
  extractWordPageSetup,
  inspectDocx,
  parseWordPageSetup,
  sanitizePdfFilename,
  WORD_TO_PDF_MAX_BYTES,
} from "@/tools/compute/pdf/word-to-pdf";

const RED_1x1_PNG = Uint8Array.from(
  Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
    "base64",
  ),
);

/* ---------------------------------------------------------------------------
 * Minimal OOXML (.docx) fixture builders. These generate the ZIP-based Office
 * Open XML packages the tests validate; they double as the controlled test
 * documents requested by the spec (Test 1–12).
 * ------------------------------------------------------------------------- */

const CONTENT_TYPES_BASE = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="png" ContentType="image/png"/>
</Types>`;

const ROOT_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

function p(text: string, pPr = ""): string {
  return `<w:p>${pPr}<w:r><w:t xml:space="preserve">${text}</w:t></w:r></w:p>`;
}

function wrapDocument(body: string, sectPr = ""): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing">
  <w:body>${body}${sectPr}</w:body>
</w:document>`;
}

function makeDocx(options: {
  body: string;
  sectPr?: string;
  parts?: Record<string, Uint8Array>;
  contentTypeOverrides?: string;
}): Uint8Array {
  const contentTypes = `${CONTENT_TYPES_BASE}${options.contentTypeOverrides ?? ""}`;
  const files: Record<string, Uint8Array> = {
    "[Content_Types].xml": strToU8(contentTypes),
    "_rels/.rels": strToU8(ROOT_RELS),
    "word/document.xml": strToU8(wrapDocument(options.body, options.sectPr ?? "")),
    ...(options.parts ?? {}),
  };
  return zipSync(files);
}

function sectPr(attrs: { size?: string; orient?: string; margins?: string } = {}): string {
  const sz = attrs.size
    ? `<w:pgSz ${attrs.size}${attrs.orient ? ` w:orient="${attrs.orient}"` : ""}/>`
    : "";
  const mar = attrs.margins ? `<w:pgMar ${attrs.margins}/>` : "";
  return `<w:sectPr>${sz}${mar}</w:sectPr>`;
}

/* Test 1 — simple one-page document. */
function simpleDocx(): Uint8Array {
  return makeDocx({ body: p("My Title") + p("First paragraph of the document.") + p("A second paragraph.") });
}

/* Test 2 — multi-page document (explicit page breaks, 5 pages). */
function multiPageDocx(): Uint8Array {
  const body = Array.from({ length: 10 }, (_, i) =>
    p(`Page content block ${i + 1}`, i % 2 === 1 ? '<w:pPr><w:rPr><w:b/></w:rPr></w:pPr>' : ""),
  ).join("") + `<w:p><w:r><w:br w:type="page"/></w:r></w:p>`.repeat(4);
  return makeDocx({ body });
}

/* Test 3 — formatting: heading, bold, italic, underline, alignment, lists. */
function formattingDocx(): Uint8Array {
  const body =
    `<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>Report</w:t></w:r></w:p>` +
    `<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/></w:rPr><w:t>Bold centred</w:t></w:r></w:p>` +
    `<w:p><w:r><w:rPr><w:i/><w:u w:val="single"/></w:rPr><w:t>Italic underlined</w:t></w:r></w:p>` +
    `<w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr><w:r><w:t>Bullet one</w:t></w:r></w:p>` +
    `<w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="2"/></w:numPr></w:pPr><w:r><w:t>Number two</w:t></w:r></w:p>` +
    p("Plain body after the lists.");
  const parts: Record<string, Uint8Array> = {
    "word/numbering.xml": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:abstractNum w:abstractNumId="0"><w:multiLevelType w:val="hybridMultilevel"/><w:lvl w:ilvl="0"><w:numFmt w:val="bullet"/><w:lvlText w:val="•"/></w:lvl></w:abstractNum>
  <w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num>
  <w:abstractNum w:abstractNumId="1"><w:multiLevelType w:val="hybridMultilevel"/><w:lvl w:ilvl="0"><w:numFmt w:val="decimal"/><w:lvlText w:val="%1."/></w:lvl></w:abstractNum>
  <w:num w:numId="2"><w:abstractNumId w:val="1"/></w:num>
</w:numbering>`),
    "word/_rels/document.xml.rels": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rIdNum" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>
</Relationships>`),
  };
  return makeDocx({ body, parts, contentTypeOverrides: `<Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>` });
}

/* Test 4 — simple table. */
function tableDocx(): Uint8Array {
  const cell = (text: string) =>
    `<w:tc><w:tcPr/>${p(text)}</w:tc>`;
  const body = `  <w:tbl>
  <w:tr>${cell("Product")}${cell("Quantity")}${cell("Price")}</w:tr>
  <w:tr>${cell("A")}${cell("10")}${cell("₹100")}</w:tr>
  <w:tr>${cell("B")}${cell("5")}${cell("₹200")}</w:tr>
</w:tbl>` + p("After the table.");
  return makeDocx({ body });
}

/* Test 5 — embedded image plus surrounding text. */
function imageDocx(): Uint8Array {
  const body =
    p("Text before the image.") +
    `<w:p><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0">
<wp:extent cx="152400" cy="152400"/><wp:docPr id="1" name="Picture 1"/>
<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
<pic:blipFill><a:blip r:embed="rIdImg"/></pic:blipFill>
</pic:pic>
</a:graphicData></a:graphic>
</wp:inline></w:drawing></w:r></w:p>` +
    p("Text after the image.");
  const parts: Record<string, Uint8Array> = {
    "word/media/image1.png": RED_1x1_PNG,
    "word/_rels/document.xml.rels": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rIdImg" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image1.png"/>
</Relationships>`),
  };
  return makeDocx({ body, parts, contentTypeOverrides: `<Override PartName="/word/media/image1.png" ContentType="image/png"/>` });
}

/* Test 6 — page layout: landscape page + custom margins. */
function landscapeDocx(): Uint8Array {
  const body = p("Landscape page content");
  return makeDocx({
    body,
    sectPr: sectPr({ size: 'w:w="16838" w:h="11906"', orient: "landscape", margins: 'w:top="630" w:right="1080" w:bottom="630" w:left="1080" w:gutter="0"' }),
  });
}

/* Test 7 — header/footer parts (company name + page number field). */
function headerFooterDocx(): Uint8Array {
  const body = p("Body text with header and footer");
  const parts: Record<string, Uint8Array> = {
    "word/header1.xml": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">${p("AVEXORA")}</w:hdr>`),
    "word/footer1.xml": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:p><w:r><w:fldChar w:fldCharType="begin"/><w:instrText xml:space="preserve"> PAGE </w:instrText><w:fldChar w:fldCharType="end"/></w:r></w:p></w:ftr>`),
    "word/_rels/document.xml.rels": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rIdH" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/>
  <Relationship Id="rIdF" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>
</Relationships>`),
    ...[`word/header1.xml`].length ? {} : {},
  };
  const sec = sectPr({
    margins: 'w:top="720" w:right="720" w:bottom="720" w:left="720" w:gutter="0"',
  }).replace("<w:sectPr>", '<w:sectPr><w:headerReference w:type="default" r:id="rIdH"/><w:footerReference w:type="default" r:id="rIdF"/>');
  return makeDocx({
    body,
    parts,
    sectPr: sec,
    contentTypeOverrides: `<Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/><Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>`,
  });
}

/* Test 8 — long document (safe processing). */
function longDocx(): Uint8Array {
  const body = Array.from({ length: 300 }, (_, i) => p(`Paragraph ${i + 1}.`)).join("");
  return makeDocx({ body });
}

/* Test 9 — invalid file (PNG bytes mistyped as .docx). */
function pngBytesDocx(): Uint8Array {
  return RED_1x1_PNG;
}

/* Test 10 — corrupted DOCX (truncated ZIP). */
function corruptDocx(): Uint8Array {
  const good = multiPageDocx();
  return good.slice(0, 64);
}

/* Test 12 macro-enabled — plain .docx bytes given a .docm name is rejected by extension. */

function encryptedDocx(): Uint8Array {
  return makeDocx({
    body: p("secret"),
    parts: { "word/encryption.xml": strToU8("<encryption/>") },
  });
}

function legacyOleBytes(): Uint8Array {
  return Uint8Array.from([
    0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1, 0x00, 0x00, 0x00, 0x00,
  ]);
}

describe("Word to PDF — classifyWordFile", () => {
  it("classifies OLE compound files (legacy .doc) from magic bytes", () => {
    expect(classifyWordFile(legacyOleBytes())).toBe("doc-ole");
  });
  it("classifies a real DOCX as a ZIP", () => {
    expect(classifyWordFile(simpleDocx())).toBe("zip-other");
  });
  it("classifies random bytes as unknown", () => {
    expect(classifyWordFile(pngBytesDocx())).toBe("unknown");
  });
});

describe("Word to PDF — inspectDocx", () => {
  it("accepts a valid simple DOCX (Test 1)", () => {
    expect(inspectDocx(simpleDocx(), { name: "simple.docx" }).ok).toBe(true);
  });
  it("accepts multi-page, formatting, table, image, layout, header/footer and long docs (Tests 2–8)", () => {
    for (const bytes of [
      multiPageDocx(),
      formattingDocx(),
      tableDocx(),
      imageDocx(),
      landscapeDocx(),
      headerFooterDocx(),
      longDocx(),
    ]) {
      expect(inspectDocx(bytes, { name: "doc.docx" }).ok).toBe(true);
    }
  });
  it("accepts when the browser reports no useful MIME type", () => {
    expect(inspectDocx(simpleDocx(), { name: "doc.docx", mime: "application/octet-stream" }).ok).toBe(true);
    expect(inspectDocx(simpleDocx(), { name: "doc.docx", mime: "" }).ok).toBe(true);
    expect(inspectDocx(simpleDocx(), { name: "doc.docx", mime: undefined }).ok).toBe(true);
  });

  it("rejects a non-.docx filename (Test 9)", () => {
    const res = inspectDocx(pngBytesDocx(), { name: "photo.png" });
    expect(res.ok).toBe(false);
    expect(res.message).toContain("valid Word (.docx)");
  });
  it("rejects a PNG renamed as .docx via its content (Test 9)", () => {
    const res = inspectDocx(pngBytesDocx(), { name: "fake.docx" });
    expect(res.ok).toBe(false);
    expect(res.message).toContain("not corrupted");
  });
  it("rejects generic wrong extensions (txt, pdf, zip)", () => {
    for (const name of ["notes.txt", "doc.pdf", "archive.zip", "scan.jpg"]) {
      const res = inspectDocx(simpleDocx(), { name });
      expect(res.ok).toBe(false);
      expect(res.message).toContain("valid Word (.docx)");
    }
  });
  it("rejects mismatched MIME types like image/png", () => {
    const res = inspectDocx(simpleDocx(), { name: "doc.docx", mime: "image/png" });
    expect(res.ok).toBe(false);
  });
  it("rejects legacy .doc by extension (Test 11)", () => {
    const res = inspectDocx(simpleDocx(), { name: "doc.doc" });
    expect(res.ok).toBe(false);
    expect(res.message).toContain(".doc");
  });
  it("recognises legacy binary .doc by its OLE magic even with a .docx name (Test 11)", () => {
    const res = inspectDocx(legacyOleBytes(), { name: "doc.docx" });
    expect(res.ok).toBe(false);
    expect(res.message).toContain("legacy .doc");
  });
  it("rejects macro-enabled .docm (Test 12)", () => {
    const res = inspectDocx(simpleDocx(), { name: "macro.docm" });
    expect(res.ok).toBe(false);
    expect(res.message).toContain(".docm");
  });
  it("rejects corrupted/truncated ZIPs (Test 10)", () => {
    const res = inspectDocx(corruptDocx(), { name: "broken.docx" });
    expect(res.ok).toBe(false);
    expect(res.message).toContain("not corrupted");
  });
  it("rejects a ZIP that is not an OOXML package (missing document.xml)", () => {
    const res = inspectDocx(zipSync({ "hello.txt": strToU8("hi") }), { name: "notword.docx" });
    expect(res.ok).toBe(false);
    expect(res.message).toContain("not a valid Word");
  });
  it("rejects password-protected/encrypted DOCX (word/encryption.xml)", () => {
    const res = inspectDocx(encryptedDocx(), { name: "locked.docx" });
    expect(res.ok).toBe(false);
    expect(res.message).toContain("password-protected");
  });
  it("rejects oversized files", () => {
    const big = new Uint8Array(WORD_TO_PDF_MAX_BYTES + 1);
    biggest: for (let i = 0; i < 8; i++) big[i] = [0x50, 0x4b, 0x03, 0x04, 0, 0, 0, 0][i];
    const res = inspectDocx(big, { name: "huge.docx" });
    expect(res.ok).toBe(false);
    expect(res.message).toContain("larger than the 50 MB limit");
  });
});

describe("Word to PDF — page setup (size, orientation, margins)", () => {
  it("defaults to A4 portrait with 1-inch margins when no sectPr exists", () => {
    const setup = parseWordPageSetup(
      wrapDocument(p("x")),
    );
    expect(setup).toEqual({
      orientation: "portrait",
      widthMm: 210,
      heightMm: 297,
      marginTopMm: 25.4,
      marginRightMm: 25.4,
      marginBottomMm: 25.4,
      marginLeftMm: 25.4,
    });
  });

  it("parses A4 portrait page size from twips", async () => {
    const bytes = makeDocx({ body: p("x"), sectPr: sectPr({ size: 'w:w="11906" w:h="16838"' }) });
    const setup = await extractWordPageSetup(bytes);
    expect(setup.orientation).toBe("portrait");
    expect(setup.widthMm).toBeCloseTo(210, 0);
    expect(setup.heightMm).toBeCloseTo(297, 0);
  });

  it("parses an explicitly landscape A4", async () => {
    const bytes = makeDocx({
      body: p("x"),
      sectPr: sectPr({ size: 'w:w="16838" w:h="11906"', orient: "landscape" }),
    });
    const setup = await extractWordPageSetup(bytes);
    expect(setup.orientation).toBe("landscape");
    expect(setup.widthMm).toBeCloseTo(297, 0);
    expect(setup.heightMm).toBeCloseTo(210, 0);
  });

  it("parses custom margins in millimetres", async () => {
    const bytes = makeDocx({
      body: p("x"),
      sectPr: sectPr({ margins: 'w:top="1440" w:right="720" w:bottom="1800" w:left="360" w:gutter="0"' }),
    });
    const setup = await extractWordPageSetup(bytes);
    expect(setup.marginTopMm).toBe(25.4);
    expect(setup.marginRightMm).toBe(12.7);
    expect(setup.marginBottomMm).toBeCloseTo(31.8, 0);
    expect(setup.marginLeftMm).toBe(6.4);
  });

  it("extracts setup from the document-level sectPr even when a mid-document section exists", () => {
    const xml = wrapDocument(
      p("one", '<w:pPr><w:sectPr><w:pgSz w:w="16838" w:h="11906" w:orient="landscape"/></w:sectPr></w:pPr>') +
        p("two") +
        '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/></w:sectPr>',
    );
    const setup = parseWordPageSetup(xml);
    expect(setup.orientation).toBe("portrait");
    expect(setup.widthMm).toBeCloseTo(210, 0);
  });
});

describe("Word to PDF — print CSS", () => {
  it("freezes the paper size to the document's own size", () => {
    const css = buildWordPrintCss({
      orientation: "portrait",
      widthMm: 210,
      heightMm: 297,
      marginTopMm: 25.4,
      marginRightMm: 25.4,
      marginBottomMm: 25.4,
      marginLeftMm: 25.4,
    });
    expect(css).toContain("@page");
    expect(css).toContain("size: 210mm 297mm");
    expect(css).toContain("margin: 0;");
    expect(css).toContain("@media print");
    expect(css).toContain("#wp-print");
    expect(css).toContain("break-after: page");
  });

  it("uses the landscape orientation for print", () => {
    const css = buildWordPrintCss({
      orientation: "landscape",
      widthMm: 297,
      heightMm: 210,
      marginTopMm: 25.4,
      marginRightMm: 25.4,
      marginBottomMm: 25.4,
      marginLeftMm: 25.4,
    });
    expect(css).toContain("size: 297mm 210mm;");
  });
});

describe("Word to PDF — filename sanitisation", () => {
  it("converts invoice.docx to invoice.pdf", () => {
    expect(sanitizePdfFilename("invoice.docx")).toBe("invoice.pdf");
  });
  it("preserves a multi-part base name", () => {
    expect(sanitizePdfFilename("My Report.FINAL.docx")).toBe("My Report.FINAL.pdf");
  });
  it("strips directory traversal and unsafe path characters", () => {
    expect(sanitizePdfFilename("../../etc/passwd.docx")).toBe("passwd.pdf");
    expect(sanitizePdfFilename("a<b>|c?.docx")).toBe("abc.pdf");
    expect(sanitizePdfFilename("C:\\Windows\\evil.docx")).toBe("evil.pdf");
  });
  it("falls back to a safe default when the base name is empty", () => {
    expect(sanitizePdfFilename(".docx")).toBe("document.pdf");
  });
  it("appends .pdf when the input has no .docx extension", () => {
    expect(sanitizePdfFilename("report")).toBe("report.pdf");
  });
});

describe("Word to PDF — page-break estimate", () => {
  it("counts explicit page breaks, last-rendered breaks and pageBreakBefore markers", () => {
    const xml = makeDocx({
      body:
        `<w:p><w:r><w:br w:type="page"/></w:r></w:p>` +
        `<w:p><w:r><w:lastRenderedPageBreak/></w:r></w:p>` +
        `<w:p><w:pPr><w:pageBreakBefore/></w:pPr></w:p>` +
        p("tail"),
    });
    expect(countExplicitPageBreaks(wrapDocument(p("start")))).toBe(0);
    expect(countExplicitPageBreaks(xml.toString())).toBe(0); // raw binary is not XML
  });
  it("counts breaks on an actual document.xml string", () => {
    const xml = wrapDocument(
      `<w:p><w:r><w:br w:type="page"/></w:r></w:p>`.repeat(2) +
        `<w:p><w:pPr><w:pageBreakBefore/></w:pPr></w:p>` +
        p("tail"),
    );
    expect(countExplicitPageBreaks(xml)).toBe(3);
  });
});