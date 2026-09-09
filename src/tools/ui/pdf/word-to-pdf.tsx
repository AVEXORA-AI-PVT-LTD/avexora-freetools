"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { iconBtn, primaryBtn, secondaryBtn } from "./pdf-shared";
import {
  buildWordPrintCss,
  extractWordPageSetup,
  inspectDocx,
  sanitizePdfFilename,
  WORD_PAGE_DEFAULTS,
  WORD_TO_PDF_MAX_BYTES,
  WORD_TO_PDF_MAX_PAGES,
} from "@/tools/compute/pdf/word-to-pdf";

const DOCX_ACCEPT =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx";

function formatBytes(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export default function WordToPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    fileName: string;
    outName: string;
    sizeBytes: number;
    pageCount: number;
  } | null>(null);
  const [pageSetup, setPageSetup] = useState(WORD_PAGE_DEFAULTS);
  const [currentPage, setCurrentPage] = useState(1);
  const [dragging, setDragging] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const previewShellRef = useRef<HTMLDivElement>(null);
  const pageElsRef = useRef<HTMLElement[]>([]);
  const bytesRef = useRef<Uint8Array | null>(null);

  const clearPreview = useCallback(() => {
    pageElsRef.current = [];
    setCurrentPage(1);
    if (previewShellRef.current) previewShellRef.current.innerHTML = "";
  }, []);

  const fitPreview = useCallback(() => {
    const shell = previewShellRef.current;
    if (!shell) return;
    const usable = shell.clientWidth - 48;
    const sections = shell.querySelectorAll<HTMLElement>("section.docx");
    for (let i = 0; i < sections.length; i++) {
      const el = sections[i];
      const natural = el.offsetWidth;
      const scale = Math.min(1, usable / natural);
      el.style.zoom = scale < 1 ? String(scale) : "";
    }
  }, []);

  useEffect(() => {
    window.addEventListener("resize", fitPreview);
    return () => window.removeEventListener("resize", fitPreview);
  }, [fitPreview]);

  const restoreTitle = useCallback((original: string) => {
    document.title = original;
  }, []);

  const pick = async (f: File | null) => {
    setError(null);
    setBusy(false);
    setStatus(null);
    setResult(null);
    bytesRef.current = null;
    clearPreview();
    setFile(null);
    if (!f) return;

    if (f.size > WORD_TO_PDF_MAX_BYTES) {
      setError(
        `This document is ${formatBytes(f.size)} — larger than the 50 MB limit for conversion. Please try a smaller file.`,
      );
      return;
    }

    setStatus("Reading Word document…");
    try {
      const bytes = new Uint8Array(await f.arrayBuffer());
      const inspected = inspectDocx(bytes, { name: f.name, mime: f.type });
      if (!inspected.ok) {
        if (inspected.message) setError(inspected.message);
        setStatus(null);
        return;
      }
      const setup = await extractWordPageSetup(bytes);
      setFile(f);
      setPageSetup(setup);
      bytesRef.current = bytes;
      setStatus(null);
    } catch {
      setError(
        "This Word document could not be read. Please verify that the file is not corrupted and try again.",
      );
      setStatus(null);
    }
  };

  const convert = async () => {
    if (!file || !bytesRef.current) return;
    setBusy(true);
    setError(null);
    setResult(null);
    pageElsRef.current = [];
    setCurrentPage(1);
    setStatus("Reading Word document…");
    try {
      await new Promise((r) => setTimeout(r, 20));
      setStatus("Rendering document…");
      const shell = previewShellRef.current;
      if (!shell) throw new Error("preview unavailable");
      const { renderAsync } = await import("docx-preview");
      await renderAsync(bytesRef.current, shell, undefined, {
        className: "docx",
        inWrapper: true,
        hideWrapperOnPrint: true,
        breakPages: true,
        ignoreLastRenderedPageBreak: false,
        renderHeaders: true,
        renderFooters: true,
        renderFootnotes: true,
        renderEndnotes: true,
        useBase64URL: true,
      });

      const pages = Array.from(shell.querySelectorAll("section.docx")) as HTMLElement[];
      if (pages.length > WORD_TO_PDF_MAX_PAGES) {
        shell.innerHTML = "";
        setError(
          `This document renders ${pages.length} pages, which is more than the ${WORD_TO_PDF_MAX_PAGES}-page limit for conversion. Please try a smaller document.`,
        );
        setBusy(false);
        setStatus(null);
        return;
      }

      pageElsRef.current = pages;
      setCurrentPage(1);
      fitPreview();
      setStatus("Preparing PDF…");
      await new Promise((r) => setTimeout(r, 20));
      setResult({
        fileName: file.name,
        outName: sanitizePdfFilename(file.name),
        sizeBytes: file.size,
        pageCount: pages.length,
      });
    } catch {
      setError("Something went wrong while rendering this document. Please try another file.");
    } finally {
      setBusy(false);
      setStatus(null);
    }
  };

  const previewGo = (dir: 1 | -1) => {
    const shell = previewShellRef.current;
    if (!shell || pageElsRef.current.length === 0) return;
    const target = Math.min(pageElsRef.current.length - 1, Math.max(0, currentPage - 1 + dir));
    setCurrentPage(target + 1);
    const el = pageElsRef.current[target];
    const top = el.getBoundingClientRect().top - shell.getBoundingClientRect().top + shell.scrollTop;
    shell.scrollTo({ top: Math.max(0, top - 8), behavior: "smooth" });
  };

  const download = () => {
    if (!result) return;
    const previous = document.title;
    document.title = result.outName;
    let restored = false;
    const restore = () => {
      if (restored) return;
      restored = true;
      restoreTitle(previous);
    };
    window.addEventListener("afterprint", restore, { once: true });
    window.setTimeout(restore, 3000);
    window.print();
  };

  const reset = () => {
    restoreTitle(document.title);
    setBusy(false);
    setStatus(null);
    setError(null);
    setResult(null);
    setFile(null);
    setDragging(false);
    bytesRef.current = null;
    pageElsRef.current = [];
    setCurrentPage(1);
    setPageSetup(WORD_PAGE_DEFAULTS);
    if (previewShellRef.current) previewShellRef.current.innerHTML = "";
  };

  const printCss = buildWordPrintCss(pageSetup);

  return (
    <div className="space-y-4">
      <style dangerouslySetInnerHTML={{ __html: printCss }} />

      <div>
        <input
          ref={inputRef}
          type="file"
          accept={DOCX_ACCEPT}
          className="hidden"
          aria-label="Upload a Word (.docx) document"
          onChange={(e) => {
            pick(e.target.files?.[0] ?? null);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            pick(e.dataTransfer.files?.[0] ?? null);
          }}
          className={`grid w-full gap-1.5 rounded-lg border-2 border-dashed px-4 py-5 text-center text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 ${
            dragging
              ? "border-orange-500 bg-orange-50"
              : "border-slate-300 bg-white text-slate-600 hover:border-orange-400 hover:bg-orange-50/40"
          }`}
        >
          <span aria-hidden="true" className="text-xl leading-none">📄</span>
          {file ? (
            <>
              <span className="truncate font-medium text-slate-800">{file.name}</span>
              <span className="text-xs text-slate-500">
                {formatBytes(file.size)} · click to change
              </span>
            </>
          ) : (
            <>
              <span className="font-medium text-slate-700">
                Click to choose a Word document, or drag &amp; drop it here
              </span>
              <span className="text-xs text-slate-400">
                Supported format: .docx — processed entirely in your browser, files never leave
                your device.
              </span>
            </>
          )}
        </button>
      </div>

      <p role="status" aria-live="polite" className="h-5 text-sm text-slate-500">
        {status ?? ""}
      </p>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {file && !busy && !result && (
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={convert}
            className={primaryBtn}
            disabled={!file || busy}
          >
            {busy ? "Converting…" : "Convert to PDF"}
          </button>
          <button type="button" onClick={reset} className={secondaryBtn}>
            Start over
          </button>
        </div>
      )}

      {(busy || result) && (
        <div className="space-y-2">
          <div className="flex items-center justify-between print:hidden">
            <span className="text-sm font-medium text-slate-700">Preview</span>
            {result && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Previous page"
                  onClick={() => previewGo(-1)}
                  disabled={currentPage <= 1}
                  className={iconBtn}
                >
                  ←
                </button>
                <span className="text-xs tabular-nums text-slate-500">
                  {currentPage} / {result.pageCount}
                </span>
                <button
                  type="button"
                  aria-label="Next page"
                  onClick={() => previewGo(1)}
                  disabled={currentPage >= result.pageCount}
                  className={iconBtn}
                >
                  →
                </button>
              </div>
            )}
          </div>
          <div
            ref={previewShellRef}
            id="wp-print"
            className="wp-preview max-h-[70vh] overflow-auto rounded-lg border border-slate-200 bg-slate-100"
            aria-label="Document preview"
          />
        </div>
      )}

      {result && !busy && (
        <div className="space-y-3">
          <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800" role="status">
            <span className="font-semibold">Conversion complete.</span>{" "}
            <span className="block">
              {result.fileName} · {result.pageCount} page{result.pageCount === 1 ? "" : "s"}
            </span>
          </p>
          <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
            Output filename: <span className="font-medium text-slate-900">{result.outName}</span>
          </div>
          <div className="flex flex-wrap gap-3 print:hidden">
            <button type="button" onClick={download} className={primaryBtn}>
              Download PDF
            </button>
            <button type="button" onClick={reset} className={secondaryBtn}>
              Start over
            </button>
          </div>
          <p className="rounded-lg bg-amber-50 p-3 text-xs leading-relaxed text-amber-800 print:hidden">
            “Download PDF” opens your browser&apos;s print dialog with the document pre-set to the
            right page size — choose <strong>Save as PDF</strong> as the destination to keep the
            file. The PDF is generated entirely on your device; nothing is uploaded.
          </p>
        </div>
      )}
    </div>
  );
}