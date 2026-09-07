"use client";

import { useRef, useState } from "react";

export { inputCls, labelCls, primaryBtn, secondaryBtn, iconBtn, panelCls } from "../ui-tokens";

export function downloadBytes(bytes: Uint8Array, filename: string, type = "application/pdf") {
  const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Parse a page-range string like "1-3, 5, 8-10" into zero-based page indices,
 * bounded by pageCount. Returns null when nothing valid was entered.
 */
export function parsePageRanges(input: string, pageCount: number): number[] | null {
  const indices = new Set<number>();
  for (const part of input.split(",")) {
    const p = part.trim();
    if (p === "") continue;
    const range = p.match(/^(\d+)\s*-\s*(\d+)$/);
    if (range) {
      const from = Number(range[1]);
      const to = Number(range[2]);
      if (from < 1 || to < from) return null;
      for (let n = from; n <= Math.min(to, pageCount); n++) indices.add(n - 1);
    } else if (/^\d+$/.test(p)) {
      const n = Number(p);
      if (n < 1) return null;
      if (n <= pageCount) indices.add(n - 1);
    } else {
      return null;
    }
  }
  return indices.size > 0 ? [...indices].sort((a, b) => a - b) : null;
}

export function usePdfFile() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pick = async (f: File | null) => {
    setError(null);
    setPageCount(null);
    setFile(f);
    if (!f) return;
    try {
      const { PDFDocument } = await import("pdf-lib");
      const doc = await PDFDocument.load(await f.arrayBuffer(), { ignoreEncryption: true });
      setPageCount(doc.getPageCount());
    } catch {
      setError("This file could not be read as a PDF. Password-protected PDFs are not supported.");
      setFile(null);
    }
  };

  return { file, pageCount, error, setError, pick };
}

export function PdfPicker({
  file,
  pageCount,
  onPick,
}: {
  file: File | null;
  pageCount: number | null;
  onPick: (file: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(e) => {
          onPick(e.target.files?.[0] ?? null);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="grid w-full gap-1.5 rounded-lg border-2 border-dashed border-slate-300 px-4 py-5 text-center text-sm text-slate-600 transition hover:border-indigo-400 hover:bg-indigo-50/40 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
      >
        <span aria-hidden="true" className="text-xl leading-none">📄</span>
        {file ? (
          <>
            <span className="truncate font-medium text-slate-800">{file.name}</span>
            <span className="text-xs text-slate-500">
              {pageCount !== null ? `${pageCount} page${pageCount === 1 ? "" : "s"}` : "PDF"} · click to change
            </span>
          </>
        ) : (
          <>
            <span className="font-medium text-slate-700">Click to choose a PDF</span>
            <span className="text-xs text-slate-400">
              Processed in your browser — the file never leaves your device.
            </span>
          </>
        )}
      </button>
    </div>
  );
}
