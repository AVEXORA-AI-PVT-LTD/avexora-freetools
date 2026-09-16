import { strToU8, zipSync } from "fflate";
import type * as PdfJs from "pdfjs-dist";

export const PDF_TO_WORD_MAX_BYTES = 50 * 1024 * 1024;
export const PDF_TO_WORD_MAX_PAGES = 200;

/** Fatal, user-facing conversion errors carry a friendly message. */
export class PdfToWordError extends Error {}

export type WordAlignment = "left" | "center" | "right";

export type DocBlock =
  | { type: "heading"; level: 1 | 2 | 3; text: string; align: WordAlignment }
  | { type: "paragraph"; text: string; align: WordAlignment; list: boolean }
  | { type: "table"; rows: string[][] }
  | { type: "pagebreak" };

export interface PdfToWordResult {
  /** Final .docx bytes. */
  docx: Uint8Array;
  pageCount: number;
  textChars: number;
  imagesSkipped: number;
  scannedPages: number;
  warnings: string[];
}

export type PdfToWordStatusFn = (status: string) => void;

/** The subset of the pdf.js API this converter needs (testable with a stub). */
export interface PdfJsApi {
  getDocument(params: { data: Uint8Array; isEvalSupported?: boolean }): PdfJs.PDFDocumentLoadingTask;
}

interface RawItem {
  text: string;
  x: number;
  /** Text baseline in PDF user space (origin bottom-left). */
  base: number;
  /** Top of the run in top-down coordinates. */
  y: number;
  w: number;
  size: number;
}

interface Line {
  items: RawItem[];
  text: string;
  size: number;
  base: number;
  y: number;
  h: number;
  minX: number;
  maxX: number;
}

/** Image paint operators in the pdf.js operator stream (v5 numeric ids). */
const IMAGE_OPS = new Set([83, 84, 85, 86, 87, 88, 89]);

const HEADER_MAGIC = "%PDF-";

export function looksLikePdf(head: Uint8Array): boolean {
  if (head.length < 5) return false;
  for (let i = 0; i < 5; i++) if (head[i] !== HEADER_MAGIC.charCodeAt(i)) return false;
  return true;
}

export function sanitizeDocxFilename(name: string): string {
  const base = name.replace(/\.(pdf|docx)$/i, "");
  const cleaned = base
    .replace(/[\\/:*?"<>|\u0000-\u001f\u007f]/g, "_")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
  return (cleaned || "converted-document") + ".docx";
}

function xmlEscape(text: string): string {
  let out = "";
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    if (c === 0x9 || c === 0xa || c === 0xd || (c >= 0x20 && c <= 0xd7ff) || (c >= 0xe000 && c <= 0xfffd)) {
      const ch = text[i];
      out += ch === "&" ? "&amp;" : ch === "<" ? "&lt;" : ch === ">" ? "&gt;" : ch === '"' ? "&quot;" : ch;
    }
  }
  return out;
}

const jc = (a: WordAlignment) => (a === "left" ? "" : `<w:jc w:val="${a}"/>`);

function paragraphXml(text: string, heading: 0 | 1 | 2 | 3, align: WordAlignment, list: boolean): string {
  const pPr: string[] = [];
  if (heading > 0) pPr.push(`<w:pStyle w:val="Heading${heading}"/>`);
  if (list) pPr.push(`<w:ind w:left="360" w:hanging="360"/>`);
  pPr.push('<w:spacing w:before="80" w:after="80"/>');
  pPr.push(jc(align));
  return `<w:p><w:pPr>${pPr.join("")}</w:pPr><w:r><w:t xml:space="preserve">${xmlEscape(text)}</w:t></w:r></w:p>`;
}

function tableXml(rows: string[][]): string {
  const cols = Math.max(...rows.map((r) => r.length), 1);
  const colW = Math.round(9600 / cols);
  const grid = `<w:tblGrid>${Array.from({ length: cols }, () => `<w:gridCol w:w="${colW}"/>`).join("")}</w:tblGrid>`;
  const border =
    '<w:tblBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:left w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:right w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:insideV w:val="single" w:sz="4" w:space="0" w:color="auto"/></w:tblBorders>';
  const trs = rows
    .map((r) => {
      const cells = Array.from({ length: cols }, (_, i) => {
        const cellText = i < r.length ? r[i] : "";
        return `<w:tc><w:tcPr><w:tcW w:w="${colW}" w:type="dxa"/></w:tcPr><w:p><w:r><w:t xml:space="preserve">${xmlEscape(cellText)}</w:t></w:r></w:p></w:tc>`;
      }).join("");
      return `<w:tr>${cells}</w:tr>`;
    })
    .join("");
  return `<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/>${border}</w:tblPr>${grid}${trs}</w:tbl><w:p/>`;
}

const CONTTYPES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>`;

const RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>`;

function documentXml(blocks: DocBlock[]): string {
  const body = blocks
    .map((b) => {
      switch (b.type) {
        case "heading":
          return paragraphXml(b.text, b.level, b.align, false);
        case "paragraph":
          return paragraphXml(b.text, 0, b.align, b.list);
        case "table":
          return tableXml(b.rows);
        case "pagebreak":
          return '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
      }
    })
    .join("");
  const sect =
    '<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/><w:cols w:space="708"/><w:docGrid w:linePitch="360"/></w:sectPr>';
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:body>${body}${sect}</w:body></w:document>`;
}

const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:eastAsia="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/><w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="160" w:line="259" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="240" w:after="120"/><w:outlineLvl w:val="0"/></w:pPr><w:rPr><w:b/><w:sz w:val="32"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="200" w:after="100"/><w:outlineLvl w:val="1"/></w:pPr><w:rPr><w:b/><w:sz w:val="28"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading3"><w:name w:val="heading 3"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="160" w:after="80"/><w:outlineLvl w:val="2"/></w:pPr><w:rPr><w:b/><w:sz w:val="26"/></w:rPr></w:style></w:styles>`;

const SETTINGS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:zoom w:percent="100"/><w:defaultTabStop w:val="720"/><w:compat><w:compatSetting w:name="compatibilityMode" w:uri="http://schemas.microsoft.com/office/word" w:val="15"/></w:compat></w:settings>`;

function coreXml(): string {
  const now = new Date().toISOString();
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>PDF to Word conversion</dc:title><dc:creator>Avex Tools</dc:creator><dc:description>Converted from PDF with the Avex Tools PDF to Word Converter. All processing happened in the browser and the file never left the device.</dc:description><dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created></cp:coreProperties>`;
}

function appXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>Avex Tools</Application><AppVersion>1.0</AppVersion><DocSecurity>0</DocSecurity><ScaleCrop>false</ScaleCrop></Properties>`;
}

/**
 * Package rebuilt content into a minimal, spec-valid Office Open XML (.docx)
 * ZIP containing only the parts Word / LibreOffice / Google Docs expect.
 */
export function buildDocx(blocks: DocBlock[]): Uint8Array {
  const files: Record<string, Uint8Array> = {
    "[Content_Types].xml": strToU8(CONTTYPES),
    "_rels/.rels": strToU8(RELS),
    "word/document.xml": strToU8(documentXml(blocks)),
    "word/styles.xml": strToU8(STYLES),
    "word/settings.xml": strToU8(SETTINGS),
    "word/_rels/document.xml.rels": strToU8(
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>',
    ),
    "docProps/core.xml": strToU8(coreXml()),
    "docProps/app.xml": strToU8(appXml()),
  };
  return zipSync(files, { level: 9 });
}

const LIST_PREFIX = /^\s*(?:[•·●◦▪▫▸–—*+✓✔→-]|\d{1,3}[.)]|[A-Za-z][.)]|\(\d+\)|\(\w\))\s+/;

function joinLineItems(items: RawItem[]): string {
  let out = "";
  let pendingSpace = false;
  let prevX = 0;
  let prevW = 0;
  let prevSize = 12;
  for (const it of items) {
    const t = it.text;
    if (t.trim() === "") {
      pendingSpace = true;
    } else {
      const gap = it.x - (prevX + prevW);
      const threshold = Math.max(prevSize, it.size) * 0.25;
      if (out !== "" && !/\s$/.test(out) && !/^\s/.test(t) && (pendingSpace || gap > threshold)) {
        out += " ";
      }
      out += t;
      pendingSpace = false;
    }
    prevX = it.x;
    prevW = it.w;
    prevSize = it.size;
  }
  return out.trimEnd();
}

function medianSize(items: RawItem[]): number {
  const sizes = items.map((i) => i.size).filter((s) => Number.isFinite(s) && s > 0);
  sizes.sort((a, b) => a - b);
  return sizes.length > 0 ? sizes[Math.floor(sizes.length / 2)] : 12;
}

/** Group text items into lines (clustered by baseline), ordered top-down. */
function buildLines(items: RawItem[]): Line[] {
  const lines: Line[] = [];
  for (const it of items) {
    let placed = false;
    for (const line of lines) {
      if (Math.abs(line.base - it.base) <= Math.max(line.h, it.size) * 0.4) {
        line.items.push(it);
        line.h = Math.max(line.h, it.size);
        placed = true;
        break;
      }
    }
    if (!placed) {
      lines.push({
        items: [it],
        text: "",
        size: it.size,
        base: it.base,
        y: it.y,
        h: it.size,
        minX: it.x,
        maxX: it.x + it.w,
      });
    }
  }
  for (const line of lines) {
    line.items.sort((a, b) => a.x - b.x);
    line.text = joinLineItems(line.items);
    line.size = medianSize(line.items);
    line.y = Math.min(...line.items.map((i) => i.y));
    line.minX = Math.min(...line.items.map((i) => i.x));
    line.maxX = Math.max(...line.items.map((i) => i.x + i.w));
  }
  return lines.sort((a, b) => a.y - b.y);
}

interface TableRun {
  startIndex: number;
  rows: string[][];
}

/**
 * Detect simple tabular layouts: rows whose text items fall into >= 2 stable
 * column-start clusters across 3+ consecutive lines. Returns null when the
 * evidence is not strong enough — multi-column prose must stay paragraphs.
 */
function detectTableRun(lines: Line[], start: number): TableRun | null {
  const bound = Math.min(lines.length, start + 40);
  const scan = lines.slice(start, bound);
  const contentAt = (l: Line): RawItem[] => l.items.filter((i) => i.text.trim() !== "");
  const starts = scan.flatMap((l) => contentAt(l).map((i) => i.x)).sort((a, b) => a - b);
  const clusters: { min: number; max: number }[] = [];
  for (const x of starts) {
    const last = clusters[clusters.length - 1];
    const tolerance = last ? Math.max(10, (last.max - last.min) * 0.5) : 10;
    if (last && x - last.max <= tolerance) {
      last.max = Math.max(last.max, x);
    } else {
      clusters.push({ min: x, max: x });
    }
  }
  if (clusters.length < 2) return null;

  const clusterOf = (x: number): number => {
    let best = 0;
    let bestDist = Infinity;
    clusters.forEach((c, i) => {
      const dist = x < c.min ? c.min - x : x > c.max ? x - c.max : 0;
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    });
    return best;
  };

  const isRow = (line: Line): number[] | null => {
    const covered = new Set(contentAt(line).map((i) => clusterOf(i.x)));
    if (covered.size < 2) return null;
    return [...covered].sort((a, b) => a - b);
  };

  const rows: { line: Line; cols: number[] }[] = [];
  let firstRowIndex = -1;
  for (let i = start; i < bound; i++) {
    const cols = isRow(lines[i]);
    if (cols) {
      if (rows.length === 0) firstRowIndex = i;
      rows.push({ line: lines[i], cols });
    } else {
      break;
    }
  }
  if (rows.length >= 3) {
    const first = rows[0];
    const ok = rows.every((r) => r.cols.join(",") === first.cols.join(","));
    if (ok) {
      const table = rows.map(({ line }) => {
        const cells = first.cols.map((col) => {
          const items = contentAt(line)
            .filter((it) => clusterOf(it.x) === col)
            .sort((a, b) => a.x - b.x);
          return joinLineItems(items);
        });
        return cells;
      });
      if (table.every((r) => r.some((c) => c.trim() !== ""))) {
        return { startIndex: firstRowIndex, rows: table };
      }
    }
  }
  return null;
}

function headingLevel(size: number, body: number): 0 | 1 | 2 | 3 {
  if (body <= 0) return 0;
  const ratio = size / body;
  if (ratio >= 1.45) return 1;
  if (ratio >= 1.22) return 2;
  if (ratio >= 1.08) return 3;
  return 0;
}

function lineAlign(line: Line, left: number, right: number): WordAlignment {
  const span = right - left;
  if (span <= 0) return "left";
  const lg = line.minX - left;
  const rg = right - line.maxX;
  if (rg < span * 0.18 && lg > span * 0.35) return "right";
  if (Math.abs(lg - rg) < span * 0.2 && lg > span * 0.12 && rg > span * 0.12) return "center";
  return "left";
}

/** Rebuild a page's lines into an ordered list of docx blocks. */
function pageBlocks(lines: Line[], bodySize: number, pageLeft: number, pageRight: number): DocBlock[] {
  const blocks: DocBlock[] = [];
  let i = 0;

  const flushParagraph = (para: { text: string; align: WordAlignment; list: boolean }) => {
    if (para.text.trim() === "") return;
    blocks.push({ type: "paragraph", text: para.text.trim(), align: para.align, list: para.list });
  };

  while (i < lines.length) {
    const table = detectTableRun(lines, i);
    if (table) {
      blocks.push({ type: "table", rows: table.rows });
      i = table.startIndex + table.rows.length;
      continue;
    }
    const line = lines[i];

    if (line.text.trim() === "") {
      i += 1;
      continue;
    }

    const level = headingLevel(line.size, bodySize);
    if (level > 0) {
      blocks.push({ type: "heading", level: level as 1 | 2 | 3, text: line.text.trim(), align: lineAlign(line, pageLeft, pageRight) });
      i += 1;
      continue;
    }

    if (LIST_PREFIX.test(line.text)) {
      blocks.push({ type: "paragraph", text: line.text.trim(), align: "left", list: true });
      i += 1;
      continue;
    }

    const para = { text: line.text, align: lineAlign(line, pageLeft, pageRight), list: false };
    let lastY = line.y;
    let lastH = line.h;
    i += 1;
    while (i < lines.length) {
      const next = lines[i];
      if (next.text.trim() === "") break;
      if (headingLevel(next.size, bodySize) > 0 || LIST_PREFIX.test(next.text)) break;
      if (detectTableRun(lines, i)) break;
      const verticalGap = next.y - (lastY + lastH);
      if (verticalGap > lastH * 1.15) break;
      para.text += " " + next.text;
      lastY = next.y;
      lastH = next.h;
      i += 1;
    }
    flushParagraph(para);
  }
  return blocks;
}

function modeSize(lines: Line[]): number {
  const counts = new Map<number, number>();
  for (const line of lines) {
    const key = Math.round(line.size * 2) / 2;
    counts.set(key, (counts.get(key) ?? 0) + line.text.trim().length);
  }
  let best = 12;
  let bestCount = -1;
  for (const [size, count] of counts) {
    if (count > bestCount) {
      best = size;
      bestCount = count;
    }
  }
  return best;
}

function friendlyLoadError(e: unknown, isPassword: boolean): string {
  if (isPassword) return "This PDF is password-protected and cannot be converted without access.";
  if (e instanceof Error && /(damaged|corrupt|invalid|decoding|format)/i.test(e.message)) {
    return "This PDF appears to be damaged or in an unsupported format and could not be read.";
  }
  return "This PDF could not be read. Please try a different file.";
}

/**
 * Convert a PDF (already in memory, client- or node-side) to editable .docx
 * bytes. Text, page order, headings, lists, alignment and simple tables are
 * reconstructed; embedded images are counted but not preserved in this build
 * (a documented limitation), and scanned/image-only pages are reported.
 */
export async function convertPdfToWord(
  data: ArrayBuffer | Uint8Array,
  pdf: PdfJsApi,
  onStatus?: PdfToWordStatusFn,
): Promise<PdfToWordResult> {
  const src = data instanceof Uint8Array ? data : new Uint8Array(data);
  const bytes = src.slice();
  if (!looksLikePdf(bytes)) {
    throw new PdfToWordError("This file doesn't look like a valid PDF. Please choose a PDF file.");
  }
  if (bytes.byteLength > PDF_TO_WORD_MAX_BYTES) {
    throw new PdfToWordError("This PDF is too large to process (over 50 MB). Please try a smaller file.");
  }

  onStatus?.("Reading PDF…");
  let doc: PdfJs.PDFDocumentProxy | null = null;
  try {
    doc = await pdf.getDocument({ data: bytes, isEvalSupported: false }).promise;
  } catch (e) {
    const name = e instanceof Error ? e.name : "";
    throw new PdfToWordError(friendlyLoadError(e, name === "PasswordException"));
  }

  if (doc.numPages === 0) {
    await doc.destroy();
    throw new PdfToWordError("This PDF contains no pages.");
  }
  if (doc.numPages > PDF_TO_WORD_MAX_PAGES) {
    await doc.destroy();
    throw new PdfToWordError(
      `This PDF has ${doc.numPages} pages, which is more than the ${PDF_TO_WORD_MAX_PAGES}-page limit for conversion.`,
    );
  }

  const pageCount = doc.numPages;

  const pages: { lines: Line[]; width: number }[] = [];
  const scannedPageNumbers: number[] = [];
  let imagesSkipped = 0;
  let textChars = 0;

  const statusBase = doc.numPages > 1 ? `Extracting text (1 of ${doc.numPages})…` : "Extracting text…";
  onStatus?.(statusBase);

  try {
    for (let p = 1; p <= doc.numPages; p++) {
      onStatus?.(doc.numPages > 1 ? `Extracting text (${p} of ${doc.numPages})…` : "Extracting text…");
      const page = await doc.getPage(p);
      try {
        const viewport = page.getViewport({ scale: 1 });
        const pageH = viewport.height;
        const tc = await page.getTextContent({ includeMarkedContent: false });
        const items: RawItem[] = [];
        for (const item of tc.items) {
          if (!("str" in item)) continue;
          const tr = item.transform as number[];
          const size = Number.isFinite(tr[0]) && tr[0] > 0 ? tr[0] : item.height;
          const text = item.str;
          if (text.trim() === "" && item.width <= 0) continue;
          items.push({
            text,
            x: tr[4],
            base: tr[5],
            y: pageH - (tr[5] + (item.height || size)),
            w: item.width,
            size,
          });
        }
        const op = await page.getOperatorList();
        const imageOps = op.fnArray.reduce((n, fn) => (IMAGE_OPS.has(fn) ? n + 1 : n), 0);
        const pageTextChars = items.reduce((n, it) => n + it.text.replace(/\s/g, "").length, 0);
        textChars += pageTextChars;
        if (imageOps > 0) {
          if (pageTextChars > 0) {
            imagesSkipped += imageOps;
          } else {
            scannedPageNumbers.push(p);
          }
        }
        const pageLines = buildLines(items);
        if (pageLines.length > 0) pages.push({ lines: pageLines, width: viewport.width || 0 });
      } finally {
        await page.cleanup();
      }
    }

    if (textChars === 0 && scannedPageNumbers.length === 0 && pages.length === 0) {
      throw new PdfToWordError("This PDF contains no readable text to convert.");
    }
  } finally {
    await doc.destroy();
  }

  const warnings: string[] = [];
  if (scannedPageNumbers.length > 0) {
    warnings.push(
      `Page${scannedPageNumbers.length === 1 ? "" : "s"} ${scannedPageNumbers.join(", ")} ${scannedPageNumbers.length === 1 ? "appears" : "appear"} to be scanned or image-based and has no extractable text, so it could not be converted.`,
    );
  }
  if (imagesSkipped > 0) {
    warnings.push(
      `${imagesSkipped} embedded ${imagesSkipped === 1 ? "image was" : "images were"} detected but could not be preserved in this build; the Word document contains the extracted text.`,
    );
  }

  onStatus?.("Building Word document…");
  const bodySize = modeSize(pages.flatMap((pg) => pg.lines));
  const blocks: DocBlock[] = [];
  for (let p = 0; p < pages.length; p++) {
    const { lines, width } = pages[p];
    const pageLeft = 0;
    const pageRight = width > 0 ? width : Math.max(...lines.map((l) => l.maxX));
    const pageBlocksOut = pageBlocks(lines, bodySize, pageLeft, pageRight);
    for (const b of pageBlocksOut) blocks.push(b);
    if (p < pages.length - 1) blocks.push({ type: "pagebreak" });
  }

  if (blocks.length === 0) {
    throw new PdfToWordError("This PDF contains no readable text to convert.");
  }

  const docx = buildDocx(blocks);
  return { docx, pageCount, textChars, imagesSkipped, scannedPages: scannedPageNumbers.length, warnings };
}