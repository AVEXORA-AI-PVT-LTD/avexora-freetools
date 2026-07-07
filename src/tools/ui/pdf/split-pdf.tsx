"use client";

import { useState } from "react";
import { PdfPicker, downloadBytes, inputCls, labelCls, primaryBtn, usePdfFile } from "./pdf-shared";

export default function SplitPdf() {
  const { file, pageCount, error, setError, pick } = usePdfFile();
  const [splitAt, setSplitAt] = useState("");
  const [busy, setBusy] = useState(false);

  const split = async () => {
    if (!file || pageCount === null) return;
    const at = Number(splitAt);
    if (!Number.isInteger(at) || at < 1 || at >= pageCount) {
      setError(`Enter a page number between 1 and ${pageCount - 1} — part 1 ends at that page.`);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { PDFDocument } = await import("pdf-lib");
      const src = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
      const base = file.name.replace(/\.pdf$/i, "");
      for (const [name, indices] of [
        [`${base}-part1.pdf`, Array.from({ length: at }, (_, i) => i)],
        [`${base}-part2.pdf`, Array.from({ length: pageCount - at }, (_, i) => at + i)],
      ] as const) {
        const out = await PDFDocument.create();
        const pages = await out.copyPages(src, [...indices]);
        pages.forEach((p) => out.addPage(p));
        downloadBytes(await out.save(), name);
      }
    } catch {
      setError("Something went wrong while splitting this PDF.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <PdfPicker file={file} pageCount={pageCount} onPick={pick} />
      {file && pageCount !== null && (
        <div>
          <label htmlFor="split-at" className={labelCls}>
            Split after page (part 1 = pages 1–N, part 2 = the rest)
          </label>
          <input
            id="split-at"
            type="number"
            min={1}
            max={pageCount - 1}
            className={inputCls}
            placeholder={`1 – ${pageCount - 1}`}
            value={splitAt}
            onChange={(e) => setSplitAt(e.target.value)}
          />
        </div>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="button" onClick={split} disabled={!file || busy} className={primaryBtn} data-lead-action="download">
        {busy ? "Splitting…" : "Split & download both parts"}
      </button>
    </div>
  );
}
