"use client";

import { useEffect, useState } from "react";
import { PdfPicker, primaryBtn, secondaryBtn, usePdfFile } from "./pdf-shared";
import {
  useAuthDownload,
  useRestoredDownload,
} from "@/components/account/use-auth-download";

function fmtSize(bytes: number): string {
  return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(2)} MB` : `${Math.round(bytes / 1024)} KB`;
}

export default function CompressPdf() {
  const { downloadOne } = useAuthDownload();
  const { restored } = useRestoredDownload();
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultFilename, setResultFilename] = useState<string>("compressed.pdf");
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);

  const { file, pageCount, error, setError, pick } = usePdfFile();
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState<string | null>(null);

  useEffect(() => {
    if (!restored) return;
    queueMicrotask(() => {
      setResultUrl(URL.createObjectURL(restored.blob));
      setResultFilename(restored.filename);
      setResultBlob(restored.blob);
    });
  }, [restored]);

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
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
      setResultUrl(URL.createObjectURL(blob));
      setResultFilename(file.name.replace(/\.pdf$/i, "") + "-compressed.pdf");
      setResultBlob(blob);
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
      {!resultUrl ? (
        <button type="button" onClick={compress} disabled={!file || busy} className={primaryBtn}>
          {busy ? "Compressing…" : "Compress PDF"}
        </button>
      ) : (
        <div className="space-y-2">
          {!report && (
            <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800" role="status">
              Compressed PDF ready — review it, then download.
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            {resultUrl && resultBlob && (
              <button
                type="button"
                onClick={() => void downloadOne(resultBlob, resultFilename)}
                className={primaryBtn}
                data-lead-action="download"
              >
                Download Compressed PDF
              </button>
            )}
            <button
              type="button"
              onClick={() => { pick(null); setResultUrl(null); setResultBlob(null); setReport(null); }}
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