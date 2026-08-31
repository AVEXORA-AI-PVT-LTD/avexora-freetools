"use client";

import { useState } from "react";
import { PdfPicker, downloadBytes, inputCls, labelCls, primaryBtn, usePdfFile } from "./pdf-shared";

export default function WatermarkPdf() {
  const { file, pageCount, error, setError, pick } = usePdfFile();
  const [text, setText] = useState("CONFIDENTIAL");
  const [opacity, setOpacity] = useState("30");
  const [busy, setBusy] = useState(false);

  const apply = async () => {
    if (!file || !text.trim()) {
      setError("Enter the watermark text.");
      return;
    }
    const opacityNum = Number(opacity);
    if (opacity.trim() === "" || !Number.isFinite(opacityNum) || opacityNum < 0 || opacityNum > 100) {
      setError("Enter a valid opacity between 0 and 100.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { PDFDocument, rgb, degrees, StandardFonts } = await import("pdf-lib");
      const doc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
      const font = await doc.embedFont(StandardFonts.HelveticaBold);
      const alpha = Math.min(Math.max(opacityNum / 100, 0.05), 1);
      const size = 48;

      for (const page of doc.getPages()) {
        const { width, height } = page.getSize();
        const textWidth = font.widthOfTextAtSize(text, size);
        page.drawText(text, {
          x: width / 2 - textWidth / 2,
          y: height / 2,
          size,
          font,
          color: rgb(0.5, 0.5, 0.5),
          opacity: alpha,
          rotate: degrees(45),
        });
      }
      downloadBytes(await doc.save(), file.name.replace(/\.pdf$/i, "") + "-watermarked.pdf");
    } catch {
      setError("Something went wrong while adding the watermark.");
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
            <label htmlFor="wm-text" className={labelCls}>Watermark text</label>
            <input id="wm-text" type="text" className={inputCls} value={text}
              onChange={(e) => setText(e.target.value)} placeholder="CONFIDENTIAL" />
          </div>
          <div>
            <label htmlFor="wm-opacity" className={labelCls}>Opacity (%)</label>
            <input id="wm-opacity" type="number" min={5} max={100} className={inputCls}
              value={opacity} onChange={(e) => setOpacity(e.target.value)} />
          </div>
        </div>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="button" onClick={apply} disabled={!file || busy} className={primaryBtn} data-lead-action="download">
        {busy ? "Applying…" : "Add watermark & download"}
      </button>
    </div>
  );
}
