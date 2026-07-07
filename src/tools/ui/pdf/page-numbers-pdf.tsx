"use client";

import { useState } from "react";
import { PdfPicker, downloadBytes, inputCls, labelCls, primaryBtn, usePdfFile } from "./pdf-shared";

const POSITIONS = {
  "bottom-center": "Bottom centre",
  "bottom-right": "Bottom right",
  "top-right": "Top right",
} as const;

export default function PageNumbersPdf() {
  const { file, pageCount, error, setError, pick } = usePdfFile();
  const [position, setPosition] = useState<keyof typeof POSITIONS>("bottom-center");
  const [startAt, setStartAt] = useState("1");
  const [busy, setBusy] = useState(false);

  const apply = async () => {
    if (!file) return;
    const start = Number(startAt);
    if (!Number.isInteger(start) || start < 0) {
      setError("Enter a starting number of 0 or more.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { PDFDocument, rgb, StandardFonts } = await import("pdf-lib");
      const doc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const size = 10;
      const margin = 28;

      doc.getPages().forEach((page, i) => {
        const label = String(start + i);
        const { width } = page.getSize();
        const textWidth = font.widthOfTextAtSize(label, size);
        const x =
          position === "bottom-center" ? width / 2 - textWidth / 2 : width - margin - textWidth;
        const y = position === "top-right" ? page.getSize().height - margin : margin - 8;
        page.drawText(label, { x, y, size, font, color: rgb(0.3, 0.3, 0.3) });
      });
      downloadBytes(await doc.save(), file.name.replace(/\.pdf$/i, "") + "-numbered.pdf");
    } catch {
      setError("Something went wrong while adding page numbers.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <PdfPicker file={file} pageCount={pageCount} onPick={pick} />
      {file && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="pn-position" className={labelCls}>Position</label>
            <select id="pn-position" className={inputCls} value={position}
              onChange={(e) => setPosition(e.target.value as keyof typeof POSITIONS)}>
              {Object.entries(POSITIONS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="pn-start" className={labelCls}>Start numbering at</label>
            <input id="pn-start" type="number" min={0} className={inputCls} value={startAt}
              onChange={(e) => setStartAt(e.target.value)} />
          </div>
        </div>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="button" onClick={apply} disabled={!file || busy} className={primaryBtn} data-lead-action="download">
        {busy ? "Adding…" : "Add page numbers & download"}
      </button>
    </div>
  );
}
