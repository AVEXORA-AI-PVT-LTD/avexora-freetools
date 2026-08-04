"use client";

import { useState } from "react";
import { PdfPicker, downloadBytes, labelCls, inputCls, primaryBtn, usePdfFile } from "./pdf-shared";
import { describeOutcome, type RecompressResult } from "./pdf-recompress";

const MODES = {
  lossless: {
    label: "Lossless — structure only",
    hint: "Repacks the file and strips metadata. Never touches a pixel, and on an image-heavy PDF usually saves very little.",
    images: null,
  },
  balanced: {
    label: "Balanced — re-encode images",
    hint: "Re-encodes embedded JPEGs at high quality, keeping their original dimensions. Usually the right choice.",
    images: { quality: 0.75, maxEdge: Infinity },
  },
  strong: {
    label: "Strong — re-encode and shrink images",
    hint: "Also caps images at 1600px on the longest edge. Best for scans destined for screen or email, not for print.",
    images: { quality: 0.6, maxEdge: 1600 },
  },
} as const;

type Mode = keyof typeof MODES;

export default function CompressPdf() {
  const { file, pageCount, error, setError, pick } = usePdfFile();
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<Mode>("balanced");
  const [report, setReport] = useState<{ text: string; good: boolean } | null>(null);

  const chooseFile = (f: File | null) => {
    setReport(null);
    pick(f);
  };

  const compress = async () => {
    if (!file) return;
    setBusy(true);
    setError(null);
    setReport(null);
    try {
      const { PDFDocument } = await import("pdf-lib");
      const doc = await PDFDocument.load(await file.arrayBuffer(), {
        ignoreEncryption: true,
        updateMetadata: false,
      });

      doc.setTitle("");
      doc.setAuthor("");
      doc.setSubject("");
      doc.setKeywords([]);
      doc.setProducer("");
      doc.setCreator("");

      let images: RecompressResult | null = null;
      const settings = MODES[mode].images;
      if (settings) {
        const { recompressImages } = await import("./pdf-recompress");
        images = await recompressImages(doc, settings);
      }

      const bytes = await doc.save({ useObjectStreams: true });
      const saved = file.size - bytes.length;
      setReport({
        text: describeOutcome(file.size, bytes.length, images),
        good: saved > 0 && saved / file.size >= 0.01,
      });

      // Handing back a file that is bigger than the one they gave us would be a
      // strange thing to call compression.
      if (bytes.length < file.size) {
        downloadBytes(bytes, file.name.replace(/\.pdf$/i, "") + "-compressed.pdf");
      }
    } catch {
      setError("Something went wrong while compressing this PDF.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <PdfPicker file={file} pageCount={pageCount} onPick={chooseFile} />

      <div>
        <label className={labelCls} htmlFor="compress-mode">
          Compression
        </label>
        <select
          id="compress-mode"
          className={inputCls}
          value={mode}
          onChange={(e) => {
            setMode(e.target.value as Mode);
            setReport(null);
          }}
        >
          {(Object.keys(MODES) as Mode[]).map((key) => (
            <option key={key} value={key}>
              {MODES[key].label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-slate-500">{MODES[mode].hint}</p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {report && (
        <p
          className={
            report.good
              ? "rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800"
              : "rounded-lg bg-amber-50 p-3 text-sm text-amber-900"
          }
        >
          {report.text}
        </p>
      )}

      <button
        type="button"
        onClick={compress}
        disabled={!file || busy}
        className={primaryBtn}
        data-lead-action="download"
      >
        {busy ? "Compressing…" : "Compress & download"}
      </button>
    </div>
  );
}
