"use client";

import { useEffect, useState } from "react";
import { PdfPicker, inputCls, labelCls, primaryBtn, secondaryBtn, usePdfFile } from "./pdf-shared";
import {
  useAuthDownload,
  useRestoredDownload,
} from "@/components/account/use-auth-download";

export default function WatermarkPdf() {
  const { downloadOne } = useAuthDownload();
  const { restored } = useRestoredDownload();
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultFilename, setResultFilename] = useState<string>("");
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);

  const [text, setText] = useState("CONFIDENTIAL");
  const [opacity, setOpacity] = useState("30");
  const [busy, setBusy] = useState(false);
  const { file, pageCount, error, setError, pick } = usePdfFile();

  useEffect(() => {
    if (!restored) return;
    queueMicrotask(() => {
      setResultUrl(URL.createObjectURL(restored.blob));
      setResultFilename(restored.filename);
      setResultBlob(restored.blob);
    });
  }, [restored]);

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
      const bytes = await doc.save();
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
      setResultUrl(URL.createObjectURL(blob));
      setResultFilename(file.name.replace(/\.pdf$/i, "") + "-watermarked.pdf");
      setResultBlob(blob);
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
      {!resultUrl ? (
        <button type="button" onClick={apply} disabled={!file || busy} className={primaryBtn}>
          {busy ? "Applying…" : "Add watermark"}
        </button>
      ) : (
        <div className="space-y-2">
          <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800" role="status">
            Watermark added — review it, then download.
          </p>
          <div className="flex flex-wrap gap-3">
            {resultUrl && resultBlob && (
              <button
                type="button"
                onClick={() => void downloadOne(resultBlob, resultFilename)}
                className={primaryBtn}
                data-lead-action="download"
              >
                Download PDF
              </button>
            )}
            <button
              type="button"
              onClick={() => { pick(null); setResultUrl(null); setResultBlob(null); }}
              className={secondaryBtn}
            >
              Start over
            </button>
          </div>
        </div>
      )}
    </div>
  );
}