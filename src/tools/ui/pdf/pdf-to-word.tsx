"use client";

import { useState } from "react";
import type { PDFDocumentProxy, TextItem } from "pdfjs-dist/types/src/display/api";
import { downloadBytes, PdfPicker, primaryBtn, usePdfFile } from "./pdf-shared";

/**
 * Extracts the text of each page (via pdf.js) and rebuilds it as an editable
 * .docx (via the `docx` library). This preserves reading order and rough
 * line breaks but NOT complex layout, tables, columns or images — an honest
 * "basic conversion" rather than a promise of pixel-perfect reflow, since
 * that requires the source PDF to be a paid, licensed OCR/layout engine.
 *
 * Both libraries are loaded lazily so their combined weight is never shipped
 * to any other tool page.
 */

let pdfjsPromise: Promise<typeof import("pdfjs-dist")> | null = null;
function getPdfJs(): Promise<typeof import("pdfjs-dist")> {
  pdfjsPromise ??= import("pdfjs-dist").then((m) => {
    m.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    return m;
  });
  return pdfjsPromise;
}

/** Groups text items into rough lines by grouping items that share a y-position. */
async function extractPageLines(pdf: PDFDocumentProxy, pageIndex: number): Promise<string[]> {
  const page = await pdf.getPage(pageIndex + 1);
  const content = await page.getTextContent();
  const lines: string[] = [];
  let currentY: number | null = null;
  let current: string[] = [];

  for (const raw of content.items) {
    if (!("str" in raw)) continue;
    const item = raw as TextItem;
    const y = item.transform[5];
    if (currentY === null || Math.abs(y - currentY) > 2) {
      if (current.length > 0) lines.push(current.join(" "));
      current = [item.str];
      currentY = y;
    } else {
      current.push(item.str);
    }
  }
  if (current.length > 0) lines.push(current.join(" "));
  return lines.map((l) => l.trim()).filter(Boolean);
}

export function PdfToWord() {
  const { file, pageCount, error, setError, pick } = usePdfFile();
  const [busy, setBusy] = useState(false);

  const convert = async () => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const pdfjs = await getPdfJs();
      const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;

      const { Document, Packer, Paragraph, PageBreak } = await import("docx");
      const paragraphs: InstanceType<typeof Paragraph>[] = [];
      let extractedAny = false;

      for (let i = 0; i < doc.numPages; i++) {
        const lines = await extractPageLines(doc, i);
        if (lines.length > 0) extractedAny = true;
        if (i > 0) {
          paragraphs.push(new Paragraph({ children: [new PageBreak()] }));
        }
        for (const line of lines) {
          paragraphs.push(new Paragraph({ text: line }));
        }
      }

      if (!extractedAny) {
        setError(
          "No selectable text was found in this PDF — it's likely a scanned image rather than real text, which this tool can't convert. Try an OCR tool first.",
        );
        return;
      }

      const wordDoc = new Document({ sections: [{ children: paragraphs }] });
      const blob = await Packer.toBlob(wordDoc);
      const bytes = new Uint8Array(await blob.arrayBuffer());
      downloadBytes(
        bytes,
        file.name.replace(/\.pdf$/i, "") + ".docx",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      );
    } catch {
      setError("Something went wrong while converting this PDF. Password-protected PDFs are not supported.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <PdfPicker file={file} pageCount={pageCount} onPick={pick} />

      <p className="text-xs text-slate-500">
        This extracts the real text of each page and rebuilds it as an editable Word document.
        Complex layouts, multi-column pages, tables and images are not preserved — for a
        scanned/image-only PDF, run an OCR tool first.
      </p>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void convert()}
          disabled={!file || busy}
          className={primaryBtn}
          data-lead-action="download"
        >
          {busy ? "Converting…" : "Convert to Word"}
        </button>
        {!file && <span className="text-xs text-slate-500">Choose a PDF above first.</span>}
      </div>
    </div>
  );
}

export default PdfToWord;
