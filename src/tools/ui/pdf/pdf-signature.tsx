"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  downloadBytes,
  iconBtn,
  inputCls,
  labelCls,
  primaryBtn,
  secondaryBtn,
} from "./pdf-shared";
import {
  PDF_SIGNATURE_MAX_BYTES,
  PDF_SIGNATURE_MAX_PAGES,
  SIG_DEFAULT_W_FRAC,
  SIG_MAX_FRAC,
  SIG_MIN_FRAC,
  buildSignedPdf,
  displayFracToPdfRect,
  inspectPdf,
  normalizeRotationDeg,
  sanitizeSignedFilename,
  signatureImageError,
  type PageMeta,
} from "@/tools/compute/pdf/pdf-signature";
import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";
import {
  SIGNATURE_NAME_MAX_LEN,
  SIGNATURE_STYLES,
  ensureSignFonts,
  rasterizeSignature,
  rasterizeUploadedSignature,
  signatureNameError,
} from "./signature-generator";

let pdfjsPromise: Promise<typeof import("pdfjs-dist")> | null = null;
function getPdfJs(): Promise<typeof import("pdfjs-dist")> {
  pdfjsPromise ??= import("pdfjs-dist").then((m) => {
    m.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    return m;
  });
  return pdfjsPromise;
}

const STANDARD_FONT_DATA_URL = "/pdfjs-standard-fonts/";

interface SigAsset {
  readonly id: string;
  readonly label: string;
  readonly dataUrl: string;
  readonly bytes: Uint8Array;
  readonly width: number;
  readonly height: number;
}

interface SigEntry {
  readonly id: string;
  readonly assetId: string;
  readonly pageNumber: number;
  readonly sx: number;
  readonly sy: number;
  readonly wFrac: number;
  readonly hFrac: number;
  readonly rotationDeg: number;
}

interface DragInfo {
  id: string;
  mode: "move" | "resize" | "rotate";
  startX: number;
  startY: number;
  rect: { width: number; height: number };
  orig: SigEntry;
  corner?: "nw" | "ne" | "sw" | "se";
  startAngle?: number;
}

function fmtBytes(n: number): string {
  if (n >= 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  if (n >= 1024) return `${Math.round(n / 1024)} KB`;
  return `${n} B`;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

function handlePosition(corner: "nw" | "ne" | "sw" | "se"): React.CSSProperties {
  const horizontal = corner.includes("e") ? "right" : "left";
  const vertical = corner.includes("s") ? "bottom" : "top";
  return { [horizontal]: -7, [vertical]: -7 } as React.CSSProperties;
}

const ZOOM_STEPS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

export default function PdfSignature() {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [pdfProxy, setPdfProxy] = useState<PDFDocumentProxy | null>(null);
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [pageMeta, setPageMeta] = useState<PageMeta[] | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [signatures, setSignatures] = useState<SigEntry[]>([]);
  const [assets, setAssets] = useState<SigAsset[]>([]);
  const [activeAssetId, setActiveAssetId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<"upload" | "generate">("upload");
  const [name, setName] = useState("");
  const [genStatus, setGenStatus] = useState<string | null>(null);
  const [draggingOver, setDraggingOver] = useState(false);
  const [stageWidth, setStageWidth] = useState(0);

  const loadingTaskRef = useRef<{ destroy(): Promise<void> } | null>(null);
  const pagesCacheRef = useRef(new Map<number, PDFPageProxy>());
  const renderTaskRef = useRef<{ cancel(): void } | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const sigInputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<DragInfo | null>(null);
  const counterRef = useRef(1);

  const pageCount = pageMeta?.length ?? 0;
  const currentMeta = pageMeta?.[pageNumber - 1] ?? null;
  const selected = signatures.find((s) => s.id === selectedId) ?? null;

  const clearPdfResources = useCallback(() => {
    renderTaskRef.current?.cancel();
    renderTaskRef.current = null;
    pagesCacheRef.current.clear();
    void loadingTaskRef.current?.destroy();
    loadingTaskRef.current = null;
    setPdfProxy(null);
  }, []);

  useEffect(
    () => () => {
      renderTaskRef.current?.cancel();
      pagesCacheRef.current.clear();
      void loadingTaskRef.current?.destroy();
    },
    [],
  );

  const reset = useCallback(() => {
    setBusy(false);
    setStatus(null);
    setError(null);
    setPdfBytes(null);
    setFileName("");
    setFileSize(0);
    setPageMeta(null);
    setPageNumber(1);
    setZoom(1);
    setSignatures([]);
    setAssets([]);
    setActiveAssetId(null);
    setSelectedId(null);
    setTab("upload");
    setName("");
    setGenStatus(null);
    setDraggingOver(false);
    clearPdfResources();
  }, [clearPdfResources]);

  const pickFile = useCallback(
    async (f: File | null) => {
      if (!f) return;
      setError(null);
      setStatus("Reading PDF…");
      setBusy(true);
      try {
        const bytes = new Uint8Array(await f.arrayBuffer());
        inspectPdf(bytes, f.name, f.type);
        if (signatures.length > 0) {
          const ok = window.confirm(
            "Loading a new PDF will remove the signatures placed on the current document. Continue?",
          );
          if (!ok) return;
        }
        setFileName(f.name);
        setFileSize(bytes.length);
        setPageMeta(null);
        setPdfBytes(bytes);
      } catch (err) {
        setError(
          err instanceof Error && "code" in err ? err.message : "Please upload a valid PDF file.",
        );
      } finally {
        setBusy(false);
        setStatus(null);
      }
    },
    [signatures.length],
  );

  useEffect(() => {
    if (!pdfBytes) return;
    let cancelled = false;
    (async () => {
      setBusy(true);
      setStatus("Reading PDF…");
      setError(null);
      try {
        const pdfjs = await getPdfJs();
        if (cancelled) return;
        const task = pdfjs.getDocument({
          data: pdfBytes.slice(),
          standardFontDataUrl: STANDARD_FONT_DATA_URL,
          useSystemFonts: false,
        });
        loadingTaskRef.current = task;
        const pdf = await task.promise;
        if (cancelled) {
          void task.destroy();
          return;
        }
        if (pdf.numPages > PDF_SIGNATURE_MAX_PAGES) {
          throw new Error(
            `This PDF has more than ${PDF_SIGNATURE_MAX_PAGES} pages, which is not supported by the signature tool.`,
          );
        }
        pagesCacheRef.current = new Map();
        const metas: PageMeta[] = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          if (cancelled) return;
          setStatus(`Reading page ${i} of ${pdf.numPages}…`);
          const page = await pdf.getPage(i);
          const vp = page.getViewport({ scale: 1, dontFlip: false });
          metas.push({
            width: vp.width,
            height: vp.height,
            rotation: page.rotate,
            vw: vp.width,
            vh: vp.height,
            transform: vp.transform as unknown as PageMeta["transform"],
          });
        }
        if (cancelled) return;
        setPdfProxy(pdf);
        setPageMeta(metas);
        setPageNumber(1);
        setZoom(1);
        setSelectedId(null);
        setSignatures([]);
        setStatus(null);
      } catch (err) {
        if (cancelled) return;
        clearPdfResources();
        setPdfBytes(null);
        setError(
          err instanceof Error && err.message
            ? err.message
            : "This PDF could not be read. It may be corrupted or password-protected.",
        );
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pdfBytes, clearPdfResources]);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const measure = () => setStageWidth(el.clientWidth);
    measure();
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [pdfBytes, pageMeta]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    const pdf = pdfProxy;
    const meta = pageMeta?.[pageNumber - 1];
    if (!canvas || !wrap || !pdf || !meta || stageWidth <= 0) return;
    let cancelled = false;
    (async () => {
      try {
        if (!pagesCacheRef.current.has(pageNumber)) {
          pagesCacheRef.current.set(pageNumber, await pdf.getPage(pageNumber));
        }
        const page = pagesCacheRef.current.get(pageNumber)!;
        const fit = Math.max(0.1, (stageWidth - 16) / meta.vw);
        const scale = fit * zoom;
        const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
        const viewport = page.getViewport({ scale });
        const cssW = Math.max(1, Math.round(viewport.width));
        const cssH = Math.max(1, Math.round(viewport.height));
        canvas.style.width = `${cssW}px`;
        canvas.style.height = `${cssH}px`;
        wrap.style.width = `${cssW}px`;
        wrap.style.height = `${cssH}px`;
        canvas.width = Math.max(1, Math.ceil(cssW * dpr));
        canvas.height = Math.max(1, Math.ceil(cssH * dpr));
        const ctx = canvas.getContext("2d");
        if (!ctx || cancelled) return;
        renderTaskRef.current?.cancel();
        const task = page.render({
          canvas,
          canvasContext: ctx,
          viewport,
          transform: dpr === 1 ? undefined : [dpr, 0, 0, dpr, 0, 0],
        });
        renderTaskRef.current = task;
        await task.promise;
      } catch {
        // render errors from rapid page/zoom switching are non-fatal
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pageNumber, zoom, pageMeta, pdfProxy, stageWidth]);

  const addSignature = useCallback(() => {
    if (!activeAssetId || !currentMeta) return;
    const asset = assets.find((a) => a.id === activeAssetId);
    if (!asset) return;
    const aspect = asset.width / Math.max(1, asset.height);
    const ratio = currentMeta.vw / Math.max(1, currentMeta.vh);
    let wFrac = SIG_DEFAULT_W_FRAC;
    let hFrac = (wFrac * ratio) / aspect;
    if (hFrac > 0.5) {
      hFrac = 0.5;
      wFrac = (hFrac * aspect) / ratio;
    }
    wFrac = clamp(wFrac, SIG_MIN_FRAC, SIG_MAX_FRAC);
    hFrac = clamp(hFrac, SIG_MIN_FRAC / 2, SIG_MAX_FRAC);
    const entry: SigEntry = {
      id: `sig-${counterRef.current++}`,
      assetId: activeAssetId,
      pageNumber,
      sx: clamp((1 - wFrac) / 2, 0, 1 - wFrac),
      sy: clamp(0.55 - hFrac / 2, 0, 1 - hFrac),
      wFrac,
      hFrac,
      rotationDeg: 0,
    };
    setSignatures((prev) => [...prev, entry]);
    setSelectedId(entry.id);
  }, [activeAssetId, assets, currentMeta, pageNumber]);

  const updateSig = useCallback((id: string, patch: Partial<SigEntry>) => {
    setSignatures((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }, []);

  const removeSig = useCallback((id: string) => {
    setSignatures((prev) => prev.filter((s) => s.id !== id));
    setSelectedId((sel) => (sel === id ? null : sel));
  }, []);

  const rotateSig = useCallback(
    (delta: number) => {
      const s = signatures.find((x) => x.id === selectedId);
      if (!s) return;
      updateSig(s.id, { rotationDeg: normalizeRotationDeg(s.rotationDeg + delta) });
    },
    [signatures, selectedId, updateSig],
  );

  const onSigPointerDown = useCallback(
    (e: React.PointerEvent<HTMLElement>, id: string) => {
      e.preventDefault();
      e.stopPropagation();
      const wrap = wrapRef.current;
      const s = signatures.find((x) => x.id === id);
      if (!wrap || !s) return;
      const rect = wrap.getBoundingClientRect();
      setSelectedId(id);
      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } catch {
        // best effort
      }
      dragRef.current = {
        id,
        mode: "move",
        startX: e.clientX,
        startY: e.clientY,
        rect: { width: rect.width, height: rect.height },
        orig: s,
      };
    },
    [signatures],
  );

  const onHandlePointerDown = useCallback(
    (
      e: React.PointerEvent<HTMLElement>,
      id: string,
      corner: "nw" | "ne" | "sw" | "se",
    ) => {
      e.preventDefault();
      e.stopPropagation();
      const wrap = wrapRef.current;
      const s = signatures.find((x) => x.id === id);
      if (!wrap || !s) return;
      const rect = wrap.getBoundingClientRect();
      setSelectedId(id);
      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } catch {
        // best effort
      }
      dragRef.current = {
        id,
        mode: "resize",
        startX: e.clientX,
        startY: e.clientY,
        rect: { width: rect.width, height: rect.height },
        orig: s,
        corner,
      };
    },
    [signatures],
  );

  const onRotatePointerDown = useCallback(
    (e: React.PointerEvent<HTMLElement>, id: string) => {
      e.preventDefault();
      e.stopPropagation();
      const wrap = wrapRef.current;
      const s = signatures.find((x) => x.id === id);
      if (!wrap || !s) return;
      const rect = wrap.getBoundingClientRect();
      setSelectedId(id);
      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } catch {
        // best effort
      }
      const ccx = rect.left + (s.sx + s.wFrac / 2) * rect.width;
      const ccy = rect.top + (s.sy + s.hFrac / 2) * rect.height;
      dragRef.current = {
        id,
        mode: "rotate",
        startX: e.clientX,
        startY: e.clientY,
        rect: { width: rect.width, height: rect.height },
        orig: s,
        startAngle: Math.atan2(e.clientY - ccy, e.clientX - ccx),
      };
    },
    [signatures],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      const info = dragRef.current;
      if (!info) return;
      const dx = e.clientX - info.startX;
      const dy = e.clientY - info.startY;
      if (info.mode === "move") {
        const nx = clamp(info.orig.sx + dx / info.rect.width, 0, Math.max(0, 1 - info.orig.wFrac));
        const ny = clamp(info.orig.sy + dy / info.rect.height, 0, Math.max(0, 1 - info.orig.hFrac));
        updateSig(info.id, { sx: nx, sy: ny });
        return;
      }
      if (info.mode === "resize") {
        const c = info.corner ?? "se";
        const relX = dx / info.rect.width;
        const relY = dy / info.rect.height;
        const newW = info.orig.wFrac + (c.includes("e") ? relX : -relX);
        const newH = info.orig.hFrac + (c.includes("s") ? relY : -relY);
        const scale = Math.max(newW / info.orig.wFrac, newH / info.orig.hFrac);
        const wFrac = clamp(info.orig.wFrac * scale, SIG_MIN_FRAC, SIG_MAX_FRAC);
        const hFrac = clamp(info.orig.hFrac * scale, SIG_MIN_FRAC, SIG_MAX_FRAC);
        const sxPad = c.includes("w") ? info.orig.wFrac - wFrac : 0;
        const syPad = c.includes("n") ? info.orig.hFrac - hFrac : 0;
        const sx = clamp(info.orig.sx + sxPad, 0, Math.max(0, 1 - wFrac));
        const sy = clamp(info.orig.sy + syPad, 0, Math.max(0, 1 - hFrac));
        updateSig(info.id, { sx, sy, wFrac, hFrac });
        return;
      }
      if (info.mode === "rotate" && info.startAngle !== undefined) {
        const s = info.orig;
        const wrap = wrapRef.current?.getBoundingClientRect();
        if (!wrap) return;
        const acx = wrap.left + info.rect.width * (s.sx + s.wFrac / 2);
        const acy = wrap.top + info.rect.height * (s.sy + s.hFrac / 2);
        const angle = Math.atan2(e.clientY - acy, e.clientX - acx);
        const deltaDeg = ((angle - info.startAngle) * 180) / Math.PI;
        updateSig(info.id, {
          rotationDeg: normalizeRotationDeg(s.rotationDeg + deltaDeg),
        });
      }
    },
    [updateSig],
  );

  const onPointerEnd = useCallback(() => {
    dragRef.current = null;
  }, []);

  const handleUpload = useCallback(async (f: File | null) => {
    if (!f) return;
    setError(null);
    try {
      const imgErr = signatureImageError(f.name, f.type, f.size);
      if (imgErr) {
        setError(imgErr);
        return;
      }
      setStatus("Reading signature…");
      const raster = await rasterizeUploadedSignature(f);
      const asset: SigAsset = {
        id: `asset-upload-${counterRef.current++}`,
        label: f.name,
        dataUrl: raster.dataUrl,
        bytes: raster.bytes,
        width: raster.width,
        height: raster.height,
      };
      setAssets((prev) => [...prev.filter((a) => a.id.startsWith("asset-upload-")), asset]);
      setActiveAssetId(asset.id);
      setGenStatus(null);
    } catch {
      setError("This image could not be decoded. Please upload a valid PNG, JPG or WebP image.");
    } finally {
      setStatus(null);
    }
  }, []);

  const handleGenerate = useCallback(async () => {
    const nameErr = signatureNameError(name);
    if (nameErr) {
      setGenStatus(nameErr);
      return;
    }
    setGenStatus("Drawing signatures…");
    setBusy(true);
    try {
      const ok = await ensureSignFonts();
      if (!ok) {
        setGenStatus("The handwriting fonts could not be loaded. Please try again.");
        return;
      }
      const created: SigAsset[] = [];
      for (const style of SIGNATURE_STYLES) {
        const raster = await rasterizeSignature(name, style);
        created.push({
          id: `asset-style-${style.id}`,
          label: style.label,
          dataUrl: raster.dataUrl,
          bytes: raster.bytes,
          width: raster.width,
          height: raster.height,
        });
      }
      setAssets((prev) => [
        ...prev.filter((a) => !a.id.startsWith("asset-style")),
        ...created,
      ]);
      setActiveAssetId(created[0]?.id ?? null);
      setGenStatus(null);
    } catch {
      setGenStatus("Could not generate signatures. Please try a shorter name.");
    } finally {
      setBusy(false);
    }
  }, [name]);

  const download = useCallback(async () => {
    if (!pdfBytes || !pageMeta || signatures.length === 0) return;
    setBusy(true);
    setStatus("Signing PDF…");
    setError(null);
    try {
      const placements = signatures.map((s) => {
        const asset = assets.find((a) => a.id === s.assetId);
        const meta = pageMeta[s.pageNumber - 1];
        if (!asset || !meta) {
          throw new Error("Placement state no longer matches the document.");
        }
        const rect = displayFracToPdfRect(meta, {
          sx: s.sx,
          sy: s.sy,
          wFrac: s.wFrac,
          hFrac: s.hFrac,
        });
        return {
          pageNumber: s.pageNumber,
          sigBytes: asset.bytes,
          rect,
          rotateDeg: s.rotationDeg,
        };
      });
      const out = await buildSignedPdf(pdfBytes, placements);
      downloadBytes(out, sanitizeSignedFilename(fileName));
      setStatus("Signed PDF downloaded.");
      window.setTimeout(() => setStatus(null), 4000);
    } catch (err) {
      setError(
        err instanceof Error && "code" in err
          ? err.message
          : "The signed PDF could not be generated. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }, [pdfBytes, pageMeta, signatures, assets, fileName]);

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (!selectedId) return;
      if (e.key === "Delete") {
        removeSig(selectedId);
      } else if (e.key === "ArrowLeft") {
        rotateSig(-15);
      } else if (e.key === "ArrowRight") {
        rotateSig(15);
      }
    },
    [selectedId, removeSig, rotateSig],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  const loaded = pdfBytes !== null && pageCount > 0;

  return (
    <div>
      {!loaded ? (
        <div className="space-y-4">
          <input
            ref={pdfInputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            aria-label="Choose a PDF file to sign"
            onChange={(e) => {
              void pickFile(e.target.files?.[0] ?? null);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => pdfInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDraggingOver(true);
            }}
            onDragLeave={() => setDraggingOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDraggingOver(false);
              void pickFile(e.dataTransfer.files?.[0] ?? null);
            }}
            className={`grid w-full gap-1.5 rounded-lg border-2 border-dashed px-4 py-6 text-center text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 ${
              draggingOver
                ? "border-orange-400 bg-orange-50/60 text-orange-800"
                : "border-slate-300 text-slate-600 hover:border-orange-400 hover:bg-orange-50/40 hover:text-orange-800"
            }`}
          >
            <span aria-hidden="true" className="text-2xl leading-none">
              📄
            </span>
            <span className="font-medium text-slate-700">
              Click to choose a PDF, or drop it here
            </span>
            <span className="text-xs text-slate-400">
              Up to {Math.round(PDF_SIGNATURE_MAX_BYTES / 1024 / 1024)} MB · processed entirely in
              your browser
            </span>
          </button>
          <p role="status" aria-live="polite" className="h-5 text-sm text-slate-500">
            {status ?? ""}
          </p>
          {error && (
            <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-800" title={fileName}>
                {fileName} <span className="font-normal text-slate-400">({fmtBytes(fileSize)})</span>
              </p>
              <p className="text-xs text-slate-500">
                Page {pageNumber} of {pageCount} · signatures on{" "}
                {new Set(signatures.map((s) => s.pageNumber)).size} page
                {new Set(signatures.map((s) => s.pageNumber)).size === 1 ? "" : "s"}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => pdfInputRef.current?.click()}
                disabled={busy}
                className={secondaryBtn}
              >
                Replace PDF
              </button>
              <button type="button" onClick={reset} disabled={busy} className={secondaryBtn}>
                Reset
              </button>
            </div>
          </div>

          <div ref={stageRef} className="w-full">
            <div className="grid gap-3 md:grid-cols-[minmax(0,128px)_1fr]">
              <aside className="order-2 max-h-40 rounded-lg border border-slate-200 bg-slate-50/60 p-2 md:order-1 md:max-h-[560px] md:overflow-y-auto">
                <div className="flex gap-2 overflow-x-auto md:flex-col md:overflow-x-visible md:overflow-y-visible">
                  {(pageMeta ?? []).map((_, i) => (
                    <Thumb
                      key={i}
                      pdf={pdfProxy}
                      index={i + 1}
                      selected={pageNumber === i + 1}
                      onSelect={() => {
                        setPageNumber(i + 1);
                        setSelectedId(null);
                      }}
                    />
                  ))}
                </div>
              </aside>

              <div className="order-1 min-w-0 md:order-2">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      aria-label="Previous page"
                      onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                      disabled={pageNumber <= 1}
                      className={iconBtn}
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      aria-label="Next page"
                      onClick={() => setPageNumber((p) => Math.min(pageCount, p + 1))}
                      disabled={pageNumber >= pageCount}
                      className={iconBtn}
                    >
                      ›
                    </button>
                    <span className="px-1 text-sm tabular-nums text-slate-600">
                      Page <span className="font-semibold text-slate-800">{pageNumber}</span> of{" "}
                      {pageCount}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      aria-label="Zoom out"
                      onClick={() =>
                        setZoom((z) => {
                          const idx = Math.max(0, ZOOM_STEPS.findIndex((v) => v >= z - 0.001) - 1);
                          return ZOOM_STEPS[idx];
                        })
                      }
                      disabled={zoom <= ZOOM_STEPS[0]}
                      className={iconBtn}
                    >
                      −
                    </button>
                    <button
                      type="button"
                      onClick={() => setZoom(1)}
                      title="Zoom only affects the on-screen preview — never the PDF placement."
                      className={`min-w-14 px-2 text-xs ${secondaryBtn}`}
                    >
                      {zoom === 1 ? "Fit" : `${Math.round(zoom * 100)}%`}
                    </button>
                    <button
                      type="button"
                      aria-label="Zoom in"
                      onClick={() =>
                        setZoom((z) => {
                          const idx = ZOOM_STEPS.findIndex((v) => v > z + 0.001);
                          return idx === -1 ? ZOOM_STEPS[ZOOM_STEPS.length - 1] : ZOOM_STEPS[idx];
                        })
                      }
                      className={iconBtn}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex min-h-[420px] items-start justify-center overflow-auto rounded-lg border border-slate-200 bg-slate-100 p-2 sm:p-4">
                  <div
                    ref={wrapRef}
                    className="relative touch-none select-none shadow-md"
                    style={{ width: 100, height: 140 }}
                  >
                    <canvas
                      ref={canvasRef}
                      className="block rounded-sm"
                      aria-label="PDF page preview"
                    />
                    {signatures
                      .filter((s) => s.pageNumber === pageNumber)
                      .map((s) => {
                        const asset = assets.find((a) => a.id === s.assetId);
                        return (
                          <div
                            key={s.id}
                            className="absolute touch-none"
                            style={{
                              left: `${s.sx * 100}%`,
                              top: `${s.sy * 100}%`,
                              width: `${s.wFrac * 100}%`,
                              height: `${s.hFrac * 100}%`,
                              transform: `rotate(${s.rotationDeg}deg)`,
                            }}
                            onPointerDown={(e) => onSigPointerDown(e, s.id)}
                            onPointerMove={onPointerMove}
                            onPointerUp={onPointerEnd}
                            onPointerCancel={onPointerEnd}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={asset?.dataUrl ?? ""}
                              alt=""
                              draggable={false}
                              className={`pointer-events-none h-full w-full ${
                                selectedId === s.id ? "" : "opacity-90"
                              }`}
                            />
                            {selectedId === s.id && asset && (
                              <>
                                {(["nw", "ne", "sw", "se"] as const).map((c) => (
                                  <div
                                    key={c}
                                    role="presentation"
                                    className="absolute z-10 h-3.5 w-3.5 rounded-full border-2 border-orange-600 bg-white shadow"
                                    style={handlePosition(c)}
                                    onPointerDown={(e) => onHandlePointerDown(e, s.id, c)}
                                    onPointerMove={onPointerMove}
                                    onPointerUp={onPointerEnd}
                                    onPointerCancel={onPointerEnd}
                                  />
                                ))}
                                <div
                                  role="presentation"
                                  className="absolute left-1/2 top-0 z-10 h-6 w-6 -translate-x-1/2 -translate-y-full cursor-grab rounded-full border border-orange-500 bg-white text-center text-xs leading-5 text-orange-600 active:cursor-grabbing"
                                  onPointerDown={(e) => onRotatePointerDown(e, s.id)}
                                  onPointerMove={onPointerMove}
                                  onPointerUp={onPointerEnd}
                                  onPointerCancel={onPointerEnd}
                                >
                                  ⟳
                                </div>
                                <div className="pointer-events-none absolute inset-0 rounded-sm border-2 border-orange-500/90" />
                              </>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-3 space-y-3">
              <div className="flex rounded-lg bg-slate-100 p-1">
                {(
                  [
                    ["upload", "Upload Signature"],
                    ["generate", "Generate Signature"],
                  ] as const
                ).map(([t, label]) => (
                  <button
                    key={t}
                    type="button"
                    aria-pressed={tab === t}
                    onClick={() => {
                      setTab(t);
                      setGenStatus(null);
                    }}
                    className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${
                      tab === t
                        ? "bg-white text-slate-900 shadow"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {tab === "upload" ? (
                <div className="space-y-2">
                  <input
                    ref={sigInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
                    className="hidden"
                    aria-label="Choose a signature image (PNG, JPG or WebP)"
                    onChange={(e) => {
                      void handleUpload(e.target.files?.[0] ?? null);
                      e.target.value = "";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => sigInputRef.current?.click()}
                    className={secondaryBtn}
                  >
                    Upload signature image
                  </button>
                  <p className="text-xs text-slate-500">
                    PNG, JPG or WebP. Transparent PNG backgrounds are preserved — no white or black
                    box is added.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="flex flex-wrap items-center gap-2">
                    <span className={labelCls}>Your name</span>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      maxLength={SIGNATURE_NAME_MAX_LEN}
                      placeholder="e.g. Abhishek"
                      className={`${inputCls} max-w-56`}
                    />
                    <button
                      type="button"
                      onClick={() => void handleGenerate()}
                      disabled={busy}
                      className={primaryBtn}
                    >
                      Generate Signatures
                    </button>
                  </label>
                  {genStatus && (
                    <p role="status" aria-live="polite" className="text-sm text-amber-700">
                      {genStatus}
                    </p>
                  )}
                  <p className="text-xs text-slate-500">
                    Handwritten-style signature images generated locally from your name — never sent
                    anywhere.
                  </p>
                </div>
              )}

              <div aria-label="Available signatures" className="flex flex-wrap gap-2">
                {assets.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    aria-label={`Use signature: ${a.label}`}
                    aria-pressed={activeAssetId === a.id}
                    onClick={() => {
                      setActiveAssetId(a.id);
                      setGenStatus(null);
                    }}
                    className={`rounded-lg border-2 p-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${
                      activeAssetId === a.id
                        ? "border-orange-500 bg-orange-50/50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={a.dataUrl} alt="" className="h-10 w-auto max-w-28" />
                  </button>
                ))}
              </div>

              {selected && (
                <div
                  className="flex flex-wrap items-center gap-2 rounded-lg border border-orange-200 bg-orange-50/60 px-3 py-2 text-sm"
                  aria-label="Signature controls"
                >
                  <span className="font-medium text-slate-700">Signature selected</span>
                  <button
                    type="button"
                    aria-label="Rotate signature left 15 degrees"
                    onClick={() => rotateSig(-15)}
                    className={iconBtn}
                  >
                    ↺ 15°
                  </button>
                  <button
                    type="button"
                    aria-label="Rotate signature right 15 degrees"
                    onClick={() => rotateSig(15)}
                    className={iconBtn}
                  >
                    ↻ 15°
                  </button>
                  <button
                    type="button"
                    aria-label="Reset signature rotation"
                    onClick={() => rotateSig(-selected.rotationDeg)}
                    className={iconBtn}
                  >
                    ⟲ 0°
                  </button>
                  <button
                    type="button"
                    aria-label="Remove this signature"
                    onClick={() => removeSig(selected.id)}
                    className="rounded-md border border-red-200 bg-white px-2 py-1 text-sm font-medium text-red-600 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                  >
                    Remove
                  </button>
                  <span className="text-xs text-slate-500">
                    Drag to move · pull the corner dots to resize · rotate with the knob or buttons
                  </span>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={addSignature}
                  disabled={!activeAssetId || busy}
                  className={primaryBtn}
                >
                  Add Signature to Page {pageNumber}
                </button>
                <button
                  type="button"
                  onClick={() => void download()}
                  disabled={busy || signatures.length === 0}
                  className={primaryBtn}
                >
                  Download Signed PDF
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

              <p className="text-xs text-slate-500">
                {signatures.length} signature{signatures.length === 1 ? "" : "s"} placed. This tool
                places a signature image onto your PDF — it does not create a certificate-based
                digital signature.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

type PdfDoc = PDFDocumentProxy;

function Thumb({
  pdf,
  index,
  selected,
  onSelect,
}: {
  pdf: PdfDoc | null;
  index: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [visible, setVisible] = useState(() => typeof IntersectionObserver === "undefined");

  useEffect(() => {
    const el = canvasRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((en) => en.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "400px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || !pdf) return;
    let cancelled = false;
    (async () => {
      try {
        const page = await pdf.getPage(index);
        const viewport = page.getViewport({ scale: 1 });
        const scale = 96 / Math.max(viewport.width, viewport.height);
        const vp = page.getViewport({ scale });
        const canvas = canvasRef.current;
        if (!canvas || cancelled) return;
        const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
        canvas.width = Math.max(1, Math.ceil(vp.width * dpr));
        canvas.height = Math.max(1, Math.ceil(vp.height * dpr));
        canvas.style.width = `${Math.round(vp.width)}px`;
        canvas.style.height = `${Math.round(vp.height)}px`;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        await page
          .render({
            canvas,
            canvasContext: ctx,
            viewport: vp,
            transform: dpr === 1 ? undefined : [dpr, 0, 0, dpr, 0, 0],
          })
          .promise;
      } catch {
        // thumbnail render failures are non-fatal
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [visible, pdf, index]);

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={`Go to page ${index}`}
      aria-current={selected ? "page" : undefined}
      className={`flex shrink-0 flex-col items-center gap-1 rounded-md border-2 p-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${
        selected
          ? "border-orange-500 bg-orange-50/60"
          : "border-transparent bg-white/60 hover:border-slate-300"
      }`}
    >
      <canvas ref={canvasRef} className="block h-auto" style={{ maxWidth: "100%" }} />
      <span
        className={`text-xs tabular-nums ${
          selected ? "font-semibold text-orange-700" : "text-slate-500"
        }`}
      >
        {index}
      </span>
    </button>
  );
}