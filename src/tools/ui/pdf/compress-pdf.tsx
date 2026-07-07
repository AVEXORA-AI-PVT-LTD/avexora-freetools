"use client";

import { useState } from "react";
import { PdfPicker, downloadBytes, primaryBtn, usePdfFile } from "./pdf-shared";

function fmtSize(bytes: number): string {
  return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(2)} MB` : `${Math.round(bytes / 1024)} KB`;
}

export default function CompressPdf() {
  const { file, pageCount, error, setError, pick } = usePdfFile();
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState<string | null>(null);

  const compress = async () => {
    if (!file) return;
    setBusy(true);
    setError(null);
    setReport(null);
    try {
      const { PDFDocument } = await import("pdf-lib");
      const src = await PDFDocument.load(await file.arrayBuffer(), {
        ignoreEncryption: true,
        updateMetadata: false,
      });
      // Strip document metadata and re-save with object streams — a lossless
      // structural compression; embedded images are not re-encoded.
      src.setTitle("");
      src.setAuthor("");
      src.setSubject("");
      src.setKeywords([]);
      src.setProducer("");
      src.setCreator("");
      const bytes = await src.save({ useObjectStreams: true });
      const saved = file.size - bytes.length;
      setReport(
        saved > 0
          ? `Compressed from ${fmtSize(file.size)} to ${fmtSize(bytes.length)} (${Math.round((saved / file.size) * 100)}% smaller).`
          : `This PDF is already tightly packed — the structural pass saved nothing further (output ${fmtSize(bytes.length)}). Image-heavy PDFs need image re-encoding, which this lossless tool doesn't do.`,
      );
      downloadBytes(bytes, file.name.replace(/\.pdf$/i, "") + "-compressed.pdf");
    } catch {
      setError("Something went wrong while compressing this PDF.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <PdfPicker file={file} pageCount={pageCount} onPick={pick} />
      {error && <p className="text-sm text-red-600">{error}</p>}
      {report && <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{report}</p>}
      <button type="button" onClick={compress} disabled={!file || busy} className={primaryBtn} data-lead-action="download">
        {busy ? "Compressing…" : "Compress & download"}
      </button>
    </div>
  );
}
