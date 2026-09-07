"use client";

import { useState } from "react";
import {
  PdfPicker,
  downloadBytes,
  inputCls,
  labelCls,
  parsePageRanges,
  primaryBtn,
  usePdfFile,
} from "./pdf-shared";

/**
 * Shared shell for the three range-based page tools: remove, extract, rotate.
 * Each mode differs only in how the selected pages are applied.
 */
function RangeTool({
  mode,
  rangeLabel,
  actionLabel,
  suffix,
}: {
  mode: "remove" | "extract";
  rangeLabel: string;
  actionLabel: string;
  suffix: string;
}) {
  const { file, pageCount, error, setError, pick } = usePdfFile();
  const [ranges, setRanges] = useState("");
  const [busy, setBusy] = useState(false);

  const run = async () => {
    if (!file || pageCount === null) return;
    const selected = parsePageRanges(ranges, pageCount);
    if (!selected) {
      setError('Enter pages like "2, 4-6".');
      return;
    }
    if (mode === "remove" && selected.length >= pageCount) {
      setError("You can't remove every page — at least one must remain.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { PDFDocument } = await import("pdf-lib");
      const src = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
      const keep =
        mode === "extract"
          ? selected
          : Array.from({ length: pageCount }, (_, i) => i).filter((i) => !selected.includes(i));
      const out = await PDFDocument.create();
      const pages = await out.copyPages(src, keep);
      pages.forEach((p) => out.addPage(p));
      downloadBytes(await out.save(), file.name.replace(/\.pdf$/i, "") + suffix);
    } catch {
      setError("Something went wrong while processing this PDF.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <PdfPicker file={file} pageCount={pageCount} onPick={pick} />
      {file && pageCount !== null && (
        <div>
          <label htmlFor="page-ranges" className={labelCls}>
            {rangeLabel} (1–{pageCount}, e.g. &quot;2, 4-6&quot;)
          </label>
          <input
            id="page-ranges"
            type="text"
            className={inputCls}
            placeholder="2, 4-6"
            value={ranges}
            onChange={(e) => setRanges(e.target.value)}
          />
        </div>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="button" onClick={run} disabled={!file || busy} className={primaryBtn} data-lead-action="download">
        {busy ? "Working…" : actionLabel}
      </button>
    </div>
  );
}

export function PdfPageRemover() {
  return (
    <RangeTool
      mode="remove"
      rangeLabel="Pages to remove"
      actionLabel="Remove pages & download"
      suffix="-removed.pdf"
    />
  );
}

export function ExtractPdfPages() {
  return (
    <RangeTool
      mode="extract"
      rangeLabel="Pages to extract"
      actionLabel="Extract pages & download"
      suffix="-extracted.pdf"
    />
  );
}

export function ReorderPdfPages() {
  const { file, pageCount, error, setError, pick } = usePdfFile();
  const [order, setOrder] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);

  const pickWithOrder = async (f: File | null) => {
    await pick(f);
    setOrder([]);
  };
  // Initialize order once the page count is known.
  if (pageCount !== null && order.length !== pageCount) {
    setOrder(Array.from({ length: pageCount }, (_, i) => i));
  }

  const move = (i: number, dir: -1 | 1) =>
    setOrder((prev) => {
      const next = [...prev];
      const j = i + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const run = async () => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const { PDFDocument } = await import("pdf-lib");
      const src = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
      const out = await PDFDocument.create();
      const pages = await out.copyPages(src, order);
      pages.forEach((p) => out.addPage(p));
      downloadBytes(await out.save(), file.name.replace(/\.pdf$/i, "") + "-reordered.pdf");
    } catch {
      setError("Something went wrong while reordering this PDF.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <PdfPicker file={file} pageCount={pageCount} onPick={pickWithOrder} />
      {order.length > 0 && (
        <ul className="max-h-80 divide-y divide-slate-100 overflow-auto rounded-lg border border-slate-200">
          {order.map((pageIndex, i) => (
            <li key={pageIndex} className="flex items-center gap-2 px-3 py-2 text-sm">
              <span className="w-16 text-slate-400">Slot {i + 1}</span>
              <span className="min-w-0 flex-1">Page {pageIndex + 1}</span>
              <button type="button" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}
                className="rounded px-2 py-1 text-slate-500 hover:bg-slate-100 disabled:opacity-30">↑</button>
              <button type="button" aria-label="Move down" disabled={i === order.length - 1} onClick={() => move(i, 1)}
                className="rounded px-2 py-1 text-slate-500 hover:bg-slate-100 disabled:opacity-30">↓</button>
            </li>
          ))}
        </ul>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="button" onClick={run} disabled={!file || busy} className={primaryBtn} data-lead-action="download">
        {busy ? "Reordering…" : "Apply new order & download"}
      </button>
    </div>
  );
}
