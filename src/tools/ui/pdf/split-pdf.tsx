"use client";

import { useEffect, useState } from "react";
import { PdfPicker, inputCls, labelCls, primaryBtn, secondaryBtn, usePdfFile } from "./pdf-shared";
import {
  useAuthDownload,
  useRestoredDownload,
} from "@/components/account/use-auth-download";

export default function SplitPdf() {
  const { download } = useAuthDownload();
  const { restored } = useRestoredDownload();
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultFilename, setResultFilename] = useState<string>("");
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [extraFiles, setExtraFiles] = useState<{ blob: Blob; filename: string }[]>([]);

  const [splitAt, setSplitAt] = useState("");
  const [busy, setBusy] = useState(false);
  const { file, pageCount, error, setError, pick } = usePdfFile();

  useEffect(() => {
    if (!restored) return;
    queueMicrotask(() => {
      setResultUrl(URL.createObjectURL(restored.blob));
      setResultFilename(restored.filename);
      setResultBlob(restored.blob);
      setExtraFiles(restored.extras ?? []);
    });
  }, [restored]);

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
      const parts: { blob: Blob; filename: string }[] = [];
      for (const [name, indices] of [
        [`${base}-part1.pdf`, Array.from({ length: at }, (_, i) => i)],
        [`${base}-part2.pdf`, Array.from({ length: pageCount - at }, (_, i) => at + i)],
      ] as const) {
        const out = await PDFDocument.create();
        const pages = await out.copyPages(src, [...indices]);
        pages.forEach((p) => out.addPage(p));
        parts.push({ blob: new Blob([(await out.save()) as BlobPart], { type: "application/pdf" }), filename: name });
      }
      setResultUrl(URL.createObjectURL(parts[0].blob));
      setResultFilename(parts[0].filename);
      setResultBlob(parts[0].blob);
      setExtraFiles(parts.slice(1));
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
      {!resultUrl ? (
        <button type="button" onClick={split} disabled={!file || busy} className={primaryBtn}>
          {busy ? "Splitting…" : "Split PDF"}
        </button>
      ) : (
        <div className="space-y-2">
          <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800" role="status">
            PDF split — review the parts, then download.
          </p>
          <div className="flex flex-wrap gap-3">
            {resultUrl && resultBlob && (
              <button
                type="button"
                onClick={() => void download([{ blob: resultBlob, filename: resultFilename }, ...extraFiles])}
                className={primaryBtn}
                data-lead-action="download"
              >
                Download both parts
              </button>
            )}
            <button
              type="button"
              onClick={() => { pick(null); setResultUrl(null); setResultBlob(null); setExtraFiles([]); }}
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