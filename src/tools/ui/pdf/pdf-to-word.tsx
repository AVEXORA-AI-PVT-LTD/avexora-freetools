"use client";

import { useEffect, useRef, useState } from "react";
import { PdfPicker, primaryBtn, secondaryBtn, usePdfFile } from "./pdf-shared";
import {
  useAuthDownload,
  useRestoredDownload,
} from "@/components/account/use-auth-download";
import {
  convertPdfToWord,
  PdfToWordError,
  sanitizeDocxFilename,
} from "@/tools/compute/pdf/pdf-to-word";

let pdfjsPromise: Promise<typeof import("pdfjs-dist")> | null = null;
function getPdfJs(): Promise<typeof import("pdfjs-dist")> {
  pdfjsPromise ??= import("pdfjs-dist").then((m) => {
    m.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    return m;
  });
  return pdfjsPromise;
}

export default function PdfToWord() {
  const { downloadOne } = useAuthDownload();
  const { restored } = useRestoredDownload();
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultFilename, setResultFilename] = useState<string>("");
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);

  const { file, pageCount, error, setError, pick } = usePdfFile();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [result, setResult] = useState<{ filename: string; warnings: string[] } | null>(null);
  const statusRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (!restored) return;
    queueMicrotask(() => {
      setResultUrl(URL.createObjectURL(restored.blob));
      setResultFilename(restored.filename);
      setResultBlob(restored.blob);
      setResult({ filename: restored.filename, warnings: [] });
    });
  }, [restored]);

  const convert = async () => {
    if (!file) return;
    setBusy(true);
    setError(null);
    setStatus(null);
    setResult(null);
    try {
      const pdf = await getPdfJs();
      const res = await convertPdfToWord(await file.arrayBuffer(), pdf, setStatus);
      const filename = sanitizeDocxFilename(file.name);
      const blob = new Blob([res.docx as BlobPart], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
      setResultUrl(URL.createObjectURL(blob));
      setResultFilename(filename);
      setResultBlob(blob);
      setResult({ filename, warnings: res.warnings });
    } catch (e) {
      setError(
        e instanceof PdfToWordError
          ? e.message
          : "Something went wrong while converting this PDF. Please try another file.",
      );
    } finally {
      setBusy(false);
      setStatus(null);
    }
  };

  const reset = () => {
    setBusy(false);
    setStatus(null);
    setResult(null);
    setError(null);
    setResultUrl(null);
    setResultBlob(null);
    pick(null);
  };

  return (
    <div className="space-y-4">
      <PdfPicker file={file} pageCount={pageCount} onPick={pick} />

      <p
        ref={statusRef}
        role="status"
        aria-live="polite"
        className="h-5 text-sm text-slate-500"
      >
        {busy && status ? status : ""}
      </p>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {resultUrl && resultBlob && (
        <div className="space-y-2">
          {result && (
            <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
              Saved as <span className="font-medium">{result.filename}</span> — an editable Word
              document that preserves the text, page order, headings, lists, alignment and simple
              tables from your PDF.
            </p>
          )}
          {result?.warnings.map((w) => (
            <p key={w} className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
              {w}
            </p>
          ))}
          <button
            type="button"
            onClick={() => void downloadOne(resultBlob, resultFilename)}
            className={primaryBtn}
            data-lead-action="download"
          >
            Download Word Document
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={convert}
          disabled={!file || busy}
          className={primaryBtn}
        >
          {busy ? "Converting…" : "Convert to Word"}
        </button>
        {file && (
          <button type="button" onClick={reset} className={secondaryBtn}>
            Start over
          </button>
        )}
      </div>
    </div>
  );
}