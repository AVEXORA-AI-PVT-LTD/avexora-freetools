"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist";
import { PdfPicker, downloadBytes, panelCls, primaryBtn, secondaryBtn } from "./pdf-shared";

/**
 * Page-level PDF rotation with real per-page previews.
 *
 * Thumbnails are rendered with pdf.js from the actual PDF (low resolution, one
 * render per page) so a page's preview always reflects the rotation that will
 * be written to the output file — never a CSS-only mock. The output is still
 * produced by pdf-lib using the same page-level rotation model, so "Rotate
 * All" and per-page rotations map 1:1 onto the downloaded PDF.
 *
 * pdf.js is loaded lazily (only when this tool actually runs) so the ~1 MB
 * library is never shipped to other tool pages.
 */

const THUMB_MAX = 220;

let pdfjsPromise: Promise<typeof import("pdfjs-dist")> | null = null;
function getPdfJs(): Promise<typeof import("pdfjs-dist")> {
  pdfjsPromise ??= import("pdfjs-dist").then((m) => {
    m.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    return m;
  });
  return pdfjsPromise;
}

/** Renders one real page thumbnail, re-rendering only when rotation changes. */
function PageThumb({
  pdf,
  pageIndex,
  rotation,
}: {
  pdf: PDFDocumentProxy;
  pageIndex: number;
  rotation: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;
    const canvas = canvasRef.current;
    if (!canvas) return;

    let task: RenderTask | null = null;
    (async () => {
      const page = await pdf.getPage(pageIndex + 1);
      if (cancelled) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const base = page.getViewport({ scale: 1 });
      const scale = Math.min(1, THUMB_MAX / Math.max(base.width, base.height));
      const viewport = base.clone({ scale, rotation });
      canvas.width = Math.max(1, Math.round(viewport.width));
      canvas.height = Math.max(1, Math.round(viewport.height));
      task = page.render({ canvas, canvasContext: ctx, viewport });
      try {
        await task.promise;
      } catch {
        // Cancelled when a newer rotation superseded this render.
      }
    })();

    return () => {
      cancelled = true;
      task?.cancel();
    };
  }, [pdf, pageIndex, rotation]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="h-auto w-full rounded border border-slate-200 bg-white"
    />
  );
}

const arrowBtn =
  "inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-orange-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 disabled:opacity-40";

const halfTurnBtn =
  "inline-flex h-9 items-center justify-center rounded-md border border-slate-200 px-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:text-orange-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 disabled:opacity-40";

interface PageCardProps {
  pdf: PDFDocumentProxy;
  index: number;
  rotation: number;
  selected: boolean;
  onToggle: () => void;
  onRotate: (delta: number) => void;
}

function PageCard({ pdf, index, rotation, selected, onToggle, onRotate }: PageCardProps) {
  const pageNo = index + 1;
  return (
    <li
      className={
        selected
          ? "overflow-hidden rounded-lg border border-orange-500 bg-white ring-2 ring-orange-500"
          : "overflow-hidden rounded-lg border border-slate-200 bg-white"
      }
    >
      <div
        role="button"
        tabIndex={0}
        aria-pressed={selected}
        aria-label={`Select page ${pageNo}${rotation ? ` (currently rotated ${rotation}°)` : ""}`}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle();
          }
        }}
        className="block cursor-pointer p-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-500"
      >
        <PageThumb pdf={pdf} pageIndex={index} rotation={rotation} />
        <div className="mt-1.5 flex items-center justify-between gap-1 text-xs">
          <span className="font-medium text-slate-700">Page {pageNo}</span>
          <span
            className={
              rotation
                ? "rounded-full bg-orange-50 px-1.5 py-0.5 font-semibold text-orange-800"
                : "px-1.5 text-slate-400"
            }
          >
            {rotation ? `${rotation}°` : "0°"}
          </span>
          <span className="flex w-3 justify-center" aria-hidden="true">
            {selected ? (
              <span className="font-semibold text-orange-700">✓</span>
            ) : (
              <span className="text-slate-300">○</span>
            )}
          </span>
        </div>
      </div>
      <div className="flex items-center justify-center gap-1.5 border-t border-slate-100 bg-slate-50/50 p-1.5">
        <button type="button" aria-label={`Rotate page ${pageNo} 90° anticlockwise`} onClick={() => onRotate(270)} className={arrowBtn}>
          <RotateSymbol dir="ccw" />
        </button>
        <button type="button" aria-label={`Rotate page ${pageNo} by 180°`} onClick={() => onRotate(180)} className={halfTurnBtn}>
          180°
        </button>
        <button type="button" aria-label={`Rotate page ${pageNo} 90° clockwise`} onClick={() => onRotate(90)} className={arrowBtn}>
          <RotateSymbol dir="cw" />
        </button>
      </div>
    </li>
  );
}

function RotateSymbol({ dir }: { dir: "cw" | "ccw" }) {
  return <span aria-hidden="true">{dir === "cw" ? "↻" : "↺"}</span>;
}

export function RotatePdf() {
  const [file, setFile] = useState<File | null>(null);
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [rotations, setRotations] = useState<number[]>([]);
  const [selected, setSelected] = useState<boolean[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "failed">("idle");

  const load = useCallback(async (f: File) => {
    setError(null);
    setStatus("loading");
    setPdf(null);
    try {
      const pdfjs = await getPdfJs();
      const doc = await pdfjs.getDocument({ data: await f.arrayBuffer() }).promise;
      setPdf(doc);
      setPageCount(doc.numPages);
      setRotations(Array(doc.numPages).fill(0));
      setSelected(Array(doc.numPages).fill(false));
      setStatus("ready");
    } catch {
      setStatus("failed");
      setError("This file could not be read as a PDF. Password-protected PDFs are not supported.");
    }
  }, []);

  const pick = (f: File | null) => {
    setFile(f);
    if (!f) {
      setPdf(null);
      setPageCount(0);
      setRotations([]);
      setSelected([]);
      setStatus("idle");
      return;
    }
    void load(f);
  };

  const rotateAll = (delta: number) =>
    setRotations((prev) => prev.map((r) => (r + delta) % 360));

  const rotatePages = (indices: number[], delta: number) =>
    setRotations((prev) => {
      const next = prev.slice();
      for (const i of indices) next[i] = (next[i] + delta) % 360;
      return next;
    });

  const selectedIndices = useMemo(
    () => selected.flatMap((s, i) => (s ? [i] : [])),
    [selected],
  );
  const selectedCount = selectedIndices.length;
  const rotatedCount = useMemo(() => rotations.filter((r) => r !== 0).length, [rotations]);

  const toggleSelect = (i: number) =>
    setSelected((prev) => {
      const next = prev.slice();
      next[i] = !next[i];
      return next;
    });

  const resetAll = () => setRotations((prev) => prev.map(() => 0));

  const apply = async () => {
    if (!file) return;
    if (rotatedCount === 0) {
      setError("Choose rotations first — use the toolbar for all pages, or a page's own controls for single pages.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { PDFDocument, degrees } = await import("pdf-lib");
      const src = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
      rotations.forEach((r, i) => {
        if (!r) return;
        const page = src.getPage(i);
        page.setRotation(degrees((page.getRotation().angle + r) % 360));
      });
      downloadBytes(await src.save(), file.name.replace(/\.pdf$/i, "") + "-rotated.pdf");
    } catch {
      setError("Something went wrong while rotating this PDF.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <PdfPicker file={file} pageCount={pageCount > 0 ? pageCount : null} onPick={pick} />

      {file && status === "loading" && (
        <p className="flex items-center gap-2 text-sm text-slate-500">
          <span aria-hidden="true">⏳</span> Reading pages…
        </p>
      )}

      {status === "ready" && pdf && (
        <>
          <div className={`${panelCls} p-3 sm:p-4`}>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className="text-sm font-medium text-slate-800">Rotate all pages</span>
              <div className="flex items-center gap-2">
                <button type="button" aria-label="Rotate all pages 90° anticlockwise" onClick={() => rotateAll(270)} className={secondaryBtn}>
                  <RotateSymbol dir="ccw" /> 90°
                </button>
                <button type="button" aria-label="Rotate all pages by 180°" onClick={() => rotateAll(180)} className={secondaryBtn}>
                  180°
                </button>
                <button type="button" aria-label="Rotate all pages 90° clockwise" onClick={() => rotateAll(90)} className={secondaryBtn}>
                  90° <RotateSymbol dir="cw" />
                </button>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <span className="text-xs text-slate-500">{rotatedCount} of {pageCount} rotated</span>
                <button type="button" onClick={resetAll} className={secondaryBtn}>
                  Reset all
                </button>
              </div>
            </div>

            {selectedCount > 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 pt-2">
                <span className="text-sm font-medium text-slate-800">
                  Rotate {selectedCount} selected page{selectedCount === 1 ? "" : "s"}
                </span>
                <div className="flex items-center gap-2">
                  <button type="button" aria-label="Rotate selected pages 90° anticlockwise" onClick={() => rotatePages(selectedIndices, 270)} className={secondaryBtn}>
                    <RotateSymbol dir="ccw" /> 90°
                  </button>
                  <button type="button" aria-label="Rotate selected pages by 180°" onClick={() => rotatePages(selectedIndices, 180)} className={secondaryBtn}>
                    180°
                  </button>
                  <button type="button" aria-label="Rotate selected pages 90° clockwise" onClick={() => rotatePages(selectedIndices, 90)} className={secondaryBtn}>
                    90° <RotateSymbol dir="cw" />
                  </button>
                </div>
                <button type="button" onClick={() => setSelected((prev) => prev.map(() => false))} className="text-sm font-medium text-slate-500 hover:text-slate-700">
                  Clear selection
                </button>
              </div>
            )}
          </div>

          <p className="text-xs text-slate-500">
            Click a page to select it, then rotate the whole selection together — or use each
            page&apos;s own ⟲ / 180° / ⟳ controls. Previews update to match the saved PDF.
          </p>

          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {Array.from({ length: pageCount }, (_, i) => (
              <PageCard
                key={i}
                pdf={pdf}
                index={i}
                rotation={rotations[i]}
                selected={selected[i]}
                onToggle={() => toggleSelect(i)}
                onRotate={(delta) => rotatePages([i], delta)}
              />
            ))}
          </ul>
        </>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={apply}
          disabled={busy || rotatedCount === 0}
          className={primaryBtn}
          data-lead-action="download"
        >
          {busy ? "Rotating…" : "Rotate & download"}
        </button>
        {rotatedCount === 0 && (
          <span className="text-xs text-slate-500">Apply rotations above, then download.</span>
        )}
      </div>
    </div>
  );
}