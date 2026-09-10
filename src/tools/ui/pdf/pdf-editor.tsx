"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, PointerEvent as RPointerEvent } from "react";
import {
  downloadBytes,
  iconBtn,
  inputCls,
  labelCls,
  primaryBtn,
  secondaryBtn,
} from "./pdf-shared";
import {
  PDF_EDITOR_COLORS,
  PDF_EDITOR_FONT_LABELS,
  PDF_EDITOR_MAX_BYTES,
  PDF_EDITOR_MAX_FONT_SIZE,
  PDF_EDITOR_MAX_PAGES,
  PDF_EDITOR_MIN_ELEMENT_SIZE,
  PDF_EDITOR_MIN_FONT_SIZE,
  buildEditedPdf,
  clamp,
  colorsForItems,
  elementFromTextItem,
  extractColorRuns,
  inspectPdf,
  makeElement,
  readPageFonts,
  sanitizeEditedFilename,
  type PdfEditorAlign,
  type PdfEditorElement,
  type PdfEditorElementKind,
  type PdfEditorFontId,
  type PdfEditorWeight,
  type PdfSourceTextItem,
  type PdfSourceTextStyle,
} from "@/tools/compute/pdf/pdf-editor";
import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";

let pdfjsPromise: Promise<typeof import("pdfjs-dist")> | null = null;
function getPdfJs(): Promise<typeof import("pdfjs-dist")> {
  pdfjsPromise ??= import("pdfjs-dist").then((m) => {
    m.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    return m;
  });
  return pdfjsPromise;
}

const STANDARD_FONT_DATA_URL = "/pdfjs-standard-fonts/";

interface EditorPageMeta {
  /** PDF user-space page size in points (unrotated). */
  width: number;
  height: number;
  /** Display size of the page at scale 1, already accounting for /Rotate. */
  vw: number;
  vh: number;
  rotation: number;
}

interface Vs {
  fromPdfPoint: (x: number, y: number) => [number, number];
  toPdfPoint: (x: number, y: number) => [number, number];
}

interface DragInfo {
  id: string;
  mode: "move" | "resize";
  startX: number;
  startY: number;
  corner?: Corner;
  orig: PdfEditorElement;
}

type Corner = "nw" | "ne" | "sw" | "se" | "n" | "s" | "e" | "w";

const ZOOM_STEPS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;
const ADD_LABELS: Record<PdfEditorElementKind, string> = {
  text: "+ Text",
  heading: "+ Heading",
  tagline: "+ Tagline",
  paragraph: "+ Paragraph",
  textbox: "+ Text Box",
};

function fmtBytes(n: number): string {
  if (n >= 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  if (n >= 1024) return `${Math.round(n / 1024)} KB`;
  return `${n} B`;
}

/** Axis-aligned display rect (CSS px, top-left origin) of a PDF-space rect. */
function displayRect(
  vs: Vs,
  r: { x: number; y: number; width: number; height: number },
): { x: number; y: number; width: number; height: number } {
  const pts = [
    [r.x, r.y],
    [r.x + r.width, r.y],
    [r.x + r.width, r.y - r.height],
    [r.x, r.y - r.height],
  ] as const;
  const disp = pts.map(([px, py]) => vs.fromPdfPoint(px, py));
  const xs = disp.map((d) => d[0]);
  const ys = disp.map((d) => d[1]);
  return {
    x: Math.min(...xs),
    y: Math.min(...ys),
    width: Math.max(0, Math.max(...xs) - Math.min(...xs)),
    height: Math.max(0, Math.max(...ys) - Math.min(...ys)),
  };
}

function displayBoxFor(el: PdfEditorElement, vs: Vs) {
  return displayRect(vs, el);
}

function fontStyle(el: PdfEditorElement): CSSProperties {
  const family =
    el.font === "original"
      ? el.fallbackFont === "mono"
        ? "ui-monospace, SFMono-Regular, Menlo, monospace"
        : el.fallbackFont === "serif"
          ? "Georgia, 'Times New Roman', serif"
          : "system-ui, -apple-system, 'Segoe UI', sans-serif"
      : el.font === "mono"
        ? "ui-monospace, SFMono-Regular, Menlo, monospace"
        : el.font === "serif"
          ? "Georgia, 'Times New Roman', serif"
          : el.font === "handwriting"
            ? "'Caveat', 'Segoe Script', cursive"
            : "system-ui, -apple-system, 'Segoe UI', sans-serif";
  return {
    fontFamily: family,
    fontWeight: el.weight === "bold" ? "700" : "400",
    fontStyle: el.italic ? "italic" : "normal",
  };
}

export default function PdfEditor() {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [pdfProxy, setPdfProxy] = useState<PDFDocumentProxy | null>(null);
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [pageMeta, setPageMeta] = useState<EditorPageMeta[] | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [zoom, setZoom] = useState(1);

  const [elements, setElements] = useState<PdfEditorElement[]>([]);
  const elementsRef = useRef<PdfEditorElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showExtracted, setShowExtracted] = useState(true);
  const [draggingOver, setDraggingOver] = useState(false);
  const [stageWidth, setStageWidth] = useState(0);
  const [vs, setVs] = useState<Vs | null>(null);
  const [pageFontsMap, setPageFontsMap] = useState<Map<number, { ordinal: number; base: string; isStandard: boolean }[]>>(new Map());

  const [past, setPast] = useState<PdfEditorElement[][]>([]);
  const pastRef = useRef<PdfEditorElement[][]>([]);
  const [future, setFuture] = useState<PdfEditorElement[][]>([]);
  const futureRef = useRef<PdfEditorElement[][]>([]);

  const loadingTaskRef = useRef<{ destroy(): Promise<void> } | null>(null);
  const pagesCacheRef = useRef(new Map<number, PDFPageProxy>());
  const renderTaskRef = useRef<{ cancel(): void } | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<DragInfo | null>(null);
  const vsRef = useRef<Vs | null>(null);
  const historyGuardRef = useRef(false);
  const [pendingAddKind, setPendingAddKind] = useState<PdfEditorElementKind | null>(null);
  const pendingDragRef = useRef<DragInfo | null>(null);
  const wasDraggingRef = useRef(false);

  const pageCount = pageMeta?.length ?? 0;
  const currentMeta = pageMeta?.[pageNumber - 1] ?? null;
  const selected = elements.find((e) => e.id === selectedId) ?? null;

  const setElementsBoth = useCallback((next: PdfEditorElement[]) => {
    elementsRef.current = next;
    setElements(next);
  }, []);

  /** Record the current snapshot as a step in the undo stack. */
  const pushHistory = useCallback(() => {
    pastRef.current = [
      ...pastRef.current,
      elementsRef.current.map((e) => ({ ...e, coverRect: e.coverRect ? { ...e.coverRect } : null })),
    ].slice(-100);
    setPast(pastRef.current);
    futureRef.current = [];
    setFuture([]);
  }, []);

  const patchElement = useCallback(
    (id: string, patch: Partial<PdfEditorElement>) => {
      setElementsBoth(
        elementsRef.current.map((e) => {
          if (e.id !== id) return e;
          const touched = e.source === "extracted" && !e.removed && !e.coverRect;
          const next = { ...e, ...patch, touched: true } as PdfEditorElement;
          if (touched) {
            next.coverRect = { x: e.x, y: e.y, width: e.width, height: e.height };
          } else if (next.coverRect) {
            next.coverRect = { ...next.coverRect };
          }
          return next;
        }),
      );
    },
    [setElementsBoth],
  );

  const undo = useCallback(() => {
    const prev = pastRef.current.pop();
    if (!prev) return;
    setPast([...pastRef.current]);
    futureRef.current = [cloneEls(elementsRef.current), ...futureRef.current];
    setFuture(futureRef.current);
    setElementsBoth(prev);
  }, [setElementsBoth]);

  const redo = useCallback(() => {
    const next = futureRef.current.shift();
    if (!next) return;
    setFuture([...futureRef.current]);
    pastRef.current = [...pastRef.current, cloneEls(elementsRef.current)];
    setPast(pastRef.current);
    setElementsBoth(next);
  }, [setElementsBoth]);

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
    setElementsBoth([]);
    setSelectedId(null);
    setShowExtracted(true);
    setVs(null);
    pastRef.current = [];
    setPast([]);
    futureRef.current = [];
    setFuture([]);
    setDraggingOver(false);
    clearPdfResources();
  }, [clearPdfResources, setElementsBoth]);

  const pickFile = useCallback(async (f: File | null) => {
    if (!f) return;
    setError(null);
    setStatus("Reading PDF…");
    setBusy(true);
    try {
      const bytes = new Uint8Array(await f.arrayBuffer());
      inspectPdf(bytes, f.name, f.type);
      if (elementsRef.current.length > 0) {
        const ok = window.confirm(
          "Loading a new PDF will discard the edits made to the current document. Continue?",
        );
        if (!ok) return;
      }
      setFileName(f.name);
      setFileSize(bytes.length);
      setPageMeta(null);
      setPdfBytes(bytes);
    } catch (err) {
      setError(
        err instanceof Error && "code" in err
          ? err.message
          : "Please upload a valid PDF file.",
      );
    } finally {
      setBusy(false);
      setStatus(null);
    }
  }, []);

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
        if (pdf.numPages > PDF_EDITOR_MAX_PAGES) {
          throw new Error(
            `This PDF has more than ${PDF_EDITOR_MAX_PAGES} pages, which is not supported by the PDF editor.`,
          );
        }
        pagesCacheRef.current = new Map();
        const metas: EditorPageMeta[] = [];
        const extracted: PdfEditorElement[] = [];
        let counter = 0;
        for (let i = 1; i <= pdf.numPages; i++) {
          if (cancelled) return;
          setStatus(`Reading page ${i} of ${pdf.numPages}…`);
          const page = await pdf.getPage(i);
          const vp = page.getViewport({ scale: 1, dontFlip: false });
          metas.push({
            width: vp.width > 0 ? vp.width / vp.scale : 1,
            height: vp.height > 0 ? vp.height / vp.scale : 1,
            vw: vp.width,
            vh: vp.height,
            rotation: page.rotate,
          });
          const content = await page.getTextContent();
          const items = content.items as PdfSourceTextItem[];
          let detectedColors: (string | null)[] | null = null;
          try {
            const { fnArray, argsArray } = await page.getOperatorList();
            const ops = (pdfjs as unknown as { OPS?: Record<string, number> }).OPS;
            if (ops) {
              const opCodes = {
                showText: ops.showText,
                showSpacedText: ops.showSpacedText,
                nextLineShowText: ops.nextLineShowText,
                nextLineSetSpacingShowText: ops.nextLineSetSpacingShowText,
                setFillRGBColor: ops.setFillRGBColor,
                setFillGray: ops.setFillGray,
                setFillCMYKColor: ops.setFillCMYKColor,
                setFillColor: ops.setFillColor,
                setFillColorSpace: ops.setFillColorSpace,
              };
              if (Object.values(opCodes).every((v) => typeof v === "number")) {
                detectedColors = colorsForItems(extractColorRuns(fnArray, argsArray, opCodes), items);
              }
            }
          } catch {
            detectedColors = null;
          }
          for (let ii = 0; ii < items.length; ii++) {
            const item = items[ii];
            const str = (item.str ?? "").trim();
            const t = item.transform ?? [1, 0, 0, 1, 0, 0];
            const height = item.height ?? 0;
            if (str === "" || height < 3 || str.length > 400) continue;
            const widthPt = item.width ?? 0;
            if (widthPt < 1) continue;
            const textStyle = content.styles?.[item.fontName ?? ""] as PdfSourceTextStyle | undefined;
            extracted.push(
              elementFromTextItem(`el-${++counter}`, i, {
                str,
                transform: t,
                width: widthPt,
                height,
                fontName: item.fontName,
                fontSize: item.height,
              }, {
                style: textStyle ?? null,
                color: detectedColors?.[ii] ?? undefined,
              }),
            );
          }
        }
        if (cancelled) return;
        setPdfProxy(pdf);
        setPageMeta(metas);
        setPageNumber(1);
        setZoom(1);
        setElementsBoth(extracted);
        setSelectedId(null);
        pastRef.current = [];
        setPast([]);
        futureRef.current = [];
        setFuture([]);
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
  }, [pdfBytes, clearPdfResources, setElementsBoth]);

  useEffect(() => {
    if (!pdfBytes || !pageMeta) return;
    let cancelled = false;
    (async () => {
      try {
        const cache = new Map<number, { ordinal: number; base: string; isStandard: boolean }[]>();
        const loadPage = async (pn: number) => {
          if (cache.has(pn)) return cache.get(pn)!;
          const fonts = await readPageFonts(pdfBytes, pn);
          cache.set(pn, fonts);
          return fonts;
        };
        await loadPage(pageNumber);
        for (let i = 1; i <= pageMeta.length; i++) {
          if (cancelled) return;
          await loadPage(i);
        }
        if (!cancelled) setPageFontsMap(cache);
      } catch { /* non-fatal */ }
    })();
    return () => { cancelled = true; };
  }, [pdfBytes, pageMeta, pageNumber]);

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
        const fit = Math.max(0.1, (stageWidth - 16) / Math.max(1, meta.vw));
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
        const t = viewport.transform as unknown as [
          number,
          number,
          number,
          number,
          number,
          number,
        ];
        const fromPdfPoint = (x: number, y: number): [number, number] => [
          t[0] * x + t[2] * y + t[4],
          t[1] * x + t[3] * y + t[5],
        ];
        const toPdfPoint = (x: number, y: number): [number, number] => {
          const det = t[0] * t[3] - t[1] * t[2];
          if (det === 0) return [0, 0];
          const dx = x - t[4];
          const dy = y - t[5];
          return [(t[3] * dx - t[2] * dy) / det, (-t[1] * dx + t[0] * dy) / det];
        };
        vsRef.current = { fromPdfPoint, toPdfPoint };
        setVs({ fromPdfPoint, toPdfPoint });
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

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const mapToPdf = vsRef.current?.toPdfPoint;
      if (!mapToPdf) return;
      const pending = pendingDragRef.current;
      const info = dragRef.current;
      if (pending && !info) {
        const dx = e.clientX - pending.startX;
        const dy = e.clientY - pending.startY;
        if (Math.hypot(dx, dy) < 3) return;
        pushHistory();
        dragRef.current = { ...pending };
        pendingDragRef.current = null;
        wasDraggingRef.current = true;
        try { (e.target as HTMLElement)?.setPointerCapture?.(e.pointerId); } catch { /* noop */ }
      }
      const active = dragRef.current;
      if (!active) return;
      const dx = e.clientX - active.startX;
      const dy = e.clientY - active.startY;
      const [dpX, dpY] = mapToPdf(dx, dy);
      const o = active.orig;
      const pm = pageMeta?.[active.orig.pageNumber - 1];
      const maxX = pm ? pm.width - o.width : Math.max(0, o.x + o.width);
      const maxY = pm ? pm.height : Math.max(0, o.y);
      if (active.mode === "move") {
        const nx = clamp(o.x + dpX, 0, maxX);
        const ny = clamp(o.y + dpY, 0, maxY);
        if (nx === o.x && ny === o.y) return;
        patchElement(active.id, { x: nx, y: ny });
        return;
      }
      const c = active.corner ?? "se";
      let nx = o.x;
      let ny = o.y;
      let nw = o.width;
      let nh = o.height;
      if (c.includes("e")) nw = Math.max(PDF_EDITOR_MIN_ELEMENT_SIZE, o.width + dpX);
      if (c.includes("w")) {
        nx = o.x + dpX;
        nw = Math.max(PDF_EDITOR_MIN_ELEMENT_SIZE, o.width - dpX);
      }
      if (c.includes("n")) {
        ny = o.y + dpY;
        nh = Math.max(PDF_EDITOR_MIN_ELEMENT_SIZE, o.height - dpY);
      }
      if (c.includes("s")) nh = Math.max(PDF_EDITOR_MIN_ELEMENT_SIZE, o.height + dpY);
      if (pm) {
        nw = Math.min(nw, pm.width);
        nh = Math.min(nh, pm.height);
        nx = clamp(nx, 0, Math.max(0, pm.width - nw));
        ny = clamp(ny, 0, Math.max(0, pm.height - nh));
      }
      if (nx === o.x && ny === o.y && nw === o.width && nh === o.height) return;
      patchElement(active.id, { x: nx, y: ny, width: nw, height: nh });
    };
    const onUp = () => {
      pendingDragRef.current = null;
      dragRef.current = null;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [patchElement, pageMeta, pushHistory]);

  const startDrag = useCallback(
    (
      e: RPointerEvent,
      id: string,
      mode: "move" | "resize",
      corner?: Corner,
    ) => {
      e.preventDefault();
      e.stopPropagation();
      const o = elementsRef.current.find((x) => x.id === id);
      if (!o) return;
      setSelectedId(id);
      pendingDragRef.current = {
        id,
        mode,
        startX: e.clientX,
        startY: e.clientY,
        corner,
        orig: { ...o, coverRect: o.coverRect ? { ...o.coverRect } : null },
      };
    },
    [],
  );

  const addElement = useCallback(
    (kind: PdfEditorElementKind, pos?: { x: number; y: number }) => {
      const meta = pageMeta?.[pageNumber - 1];
      if (!meta) return;
      pushHistory();
      const el = makeElement(kind, pageNumber, {
        ...(pos ? { x: pos.x, y: pos.y, width: kind === "paragraph" || kind === "textbox" ? 200 : 160, height: meta.height } : { width: meta.width, height: meta.height }),
      });
      setElementsBoth([...elementsRef.current, el]);
      setSelectedId(el.id);
    },
    [pageMeta, pageNumber, pushHistory, setElementsBoth],
  );

  const deleteSelected = useCallback(() => {
    const el = elementsRef.current.find((x) => x.id === selectedId);
    if (!el) return;
    pushHistory();
    if (el.source === "extracted") {
      const next = { ...el, removed: !el.removed } as PdfEditorElement;
      if (next.removed && !next.coverRect) {
        next.coverRect = { x: el.x, y: el.y, width: el.width, height: el.height };
      }
      setElementsBoth(
        elementsRef.current.map((x) => (x.id === el.id ? next : x)),
      );
    } else {
      setElementsBoth(elementsRef.current.filter((x) => x.id !== el.id));
      setSelectedId(null);
    }
  }, [selectedId, pushHistory, setElementsBoth]);

  const handleEditFocus = useCallback(() => {
    if (!historyGuardRef.current) {
      historyGuardRef.current = true;
      pushHistory();
    }
  }, [pushHistory]);

  const handleEditBlur = useCallback(() => {
    historyGuardRef.current = false;
  }, []);

  const download = useCallback(async () => {
    if (!pdfBytes) return;
    setBusy(true);
    setStatus("Building edited PDF…");
    setError(null);
    try {
      const fontLoader = async (url: string): Promise<Uint8Array> =>
        new Uint8Array(await (await fetch(url)).arrayBuffer());
      const edits = elementsRef.current.filter(
        (el) => el.source === "new" || el.removed || el.touched,
      );
      if (edits.length === 0) {
        setError("Nothing to edit yet — select a tool above or click existing text first.");
        return;
      }
      const out = await buildEditedPdf(pdfBytes, edits, { fontLoader });
      downloadBytes(out, sanitizeEditedFilename(fileName));
      setStatus("Edited PDF downloaded.");
      window.setTimeout(() => setStatus(null), 4000);
    } catch (err) {
      setError(
        err instanceof Error && "code" in err
          ? err.message
          : "The edited PDF could not be generated. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }, [pdfBytes, fileName]);

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedId) deleteSelected();
      } else       if (e.key === "Escape") {
        if (pendingAddKind) { setPendingAddKind(null); return; }
        setSelectedId(null);
      }
    },
    [selectedId, deleteSelected, pendingAddKind],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  const loaded = pdfBytes !== null && pageCount > 0;
  const onPageElements = elements.filter((el) => el.pageNumber === pageNumber);
  const displayEls = onPageElements.filter((el) => showExtracted || el.source === "new");
  const zoomIn = () => setZoom((z) => Math.min(ZOOM_STEPS[ZOOM_STEPS.length - 1], z + 0.25));
  const zoomOut = () => setZoom((z) => Math.max(ZOOM_STEPS[0], z - 0.25));

  return (
    <div>
      {!loaded ? (
        <div className="space-y-4">
          <input
            ref={pdfInputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            aria-label="Choose a PDF file to edit"
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
              Up to {Math.round(PDF_EDITOR_MAX_BYTES / 1024 / 1024)} MB · processed entirely in
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
          <div className="rounded-lg bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
            The editor runs entirely in your browser. Hover over any text on the page and click it —
            that exact spot becomes editable right where it sits, using the typography (font, size,
            bold/italic, colour) detected from the PDF itself. Edit the words in place, move or resize
            them with the handles, or add new headings, taglines, paragraphs and text boxes. The
            original PDF is preserved exactly; only the text you touch is replaced.
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Add
            </span>
            {(
              Object.keys(ADD_LABELS) as Array<PdfEditorElementKind>
            ).map((kind) => (
              <button
                key={kind}
                type="button"
                onClick={() => {
                  if (pendingAddKind === kind) { setPendingAddKind(null); return; }
                  setPendingAddKind(kind);
                  setSelectedId(null);
                }}
                disabled={busy}
                className={`${secondaryBtn} ${pendingAddKind === kind ? "!bg-orange-100 !text-orange-800 !border-orange-400" : ""}`}
                style={{ padding: "0.375rem 0.75rem", fontSize: "0.8125rem" }}
              >
                {ADD_LABELS[kind]}
              </button>
            ))}
            {pendingAddKind && (
              <span className="text-xs text-orange-600 italic">
                Click on the page to place {ADD_LABELS[pendingAddKind].replace("+ ", "").toLowerCase()} — Esc to cancel
              </span>
            )}
            <span className="mx-2 h-5 w-px bg-slate-200" />
            <button
              type="button"
              onClick={undo}
              disabled={past.length === 0 || busy}
              className={iconBtn}
              aria-label="Undo"
              title="Undo"
            >
              ↩
            </button>
            <button
              type="button"
              onClick={redo}
              disabled={future.length === 0 || busy}
              className={iconBtn}
              aria-label="Redo"
              title="Redo"
            >
              ↪
            </button>
            <button
              type="button"
              onClick={deleteSelected}
              disabled={!selected || busy}
              className={iconBtn}
              aria-label="Delete selected"
              title="Delete selected"
            >
              🗑
            </button>
            <span className="mx-2 h-5 w-px bg-slate-200" />
            <label className="flex select-none items-center gap-1.5 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={showExtracted}
                onChange={(e) => setShowExtracted(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 accent-orange-600"
              />
              Show existing text
            </label>
            <span className="mx-2 h-5 w-px bg-slate-200" />
            <button type="button" onClick={zoomOut} disabled={busy} className={iconBtn} aria-label="Zoom out">
              −
            </button>
            <select
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              aria-label="Zoom level"
              className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-700"
            >
              {ZOOM_STEPS.map((z) => (
                <option key={z} value={z}>
                  {Math.round(z * 100)}%
                </option>
              ))}
            </select>
            <button type="button" onClick={zoomIn} disabled={busy} className={iconBtn} aria-label="Zoom in">
              +
            </button>
            <span className="mx-2 h-5 w-px bg-slate-200" />
            <span className="max-w-[180px] truncate text-xs text-slate-400" title={fileName}>
              {fileName} · {fmtBytes(fileSize)}
            </span>
            <button type="button" onClick={reset} disabled={busy} className={secondaryBtn}>
              New PDF
            </button>
            <button
              type="button"
              onClick={() => void download()}
              disabled={busy}
              className={primaryBtn}
            >
              Download Edited PDF
            </button>
          </div>

          <div className="flex gap-4">
            {pageCount > 1 && (
              <div className="max-h-[540px] w-24 shrink-0 space-y-2 overflow-y-auto pr-1">
                {pageMeta?.map((m, i) => (
                  <Thumb
                    key={i + 1}
                    pdf={pdfProxy}
                    index={i + 1}
                    selected={i + 1 === pageNumber}
                    onSelect={() => setPageNumber(i + 1)}
                    pageSize={{ width: m.vw, height: m.vh }}
                  />
                ))}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm">
                <p role="status" aria-live="polite" className="h-5 text-slate-500">
                  {status ?? ""}
                </p>
                <div className="flex items-center gap-1 text-slate-500">
                  <button
                    type="button"
                    onClick={() => setPageNumber((p) => clamp(p - 1, 1, pageCount))}
                    disabled={pageNumber <= 1 || busy}
                    className={iconBtn}
                    aria-label="Previous page"
                  >
                    ‹
                  </button>
                  <span className="px-2 tabular-nums">
                    Page {pageNumber} of {pageCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPageNumber((p) => clamp(p + 1, 1, pageCount))}
                    disabled={pageNumber >= pageCount || busy}
                    className={iconBtn}
                    aria-label="Next page"
                  >
                    ›
                  </button>
                </div>
              </div>

              <div
                ref={stageRef}
                className="flex min-h-[180px] w-full items-start justify-center overflow-auto rounded-lg border border-slate-200 bg-slate-100 p-2"
              >
                <div
                  ref={wrapRef}
                  className="relative shadow-md"
                  style={pendingAddKind ? { cursor: "crosshair" } : undefined}
                  onMouseDown={(e) => {
                    if (e.target === canvasRef.current || e.target === wrapRef.current) {
                      setSelectedId(null);
                    }
                  }}
                  onClick={(e) => {
                    if (!pendingAddKind) return;
                    const wrap = wrapRef.current;
                    if (!wrap || !vs || !currentMeta) return;
                    const target = e.target as HTMLElement;
                    if (target !== canvasRef.current && target !== wrap) return;
                    const rect = wrap.getBoundingClientRect();
                    const cx = e.clientX - rect.left;
                    const cy = e.clientY - rect.top;
                    const [px, py] = vs.toPdfPoint(cx, cy);
                    const kind = pendingAddKind;
                    setPendingAddKind(null);
                    addElement(kind, { x: px, y: py });
                  }}
                >
                  <canvas ref={canvasRef} className="block" />
                  {vs &&
                    currentMeta &&
                    displayEls.map((el) => (
                      <ElementOverlay
                        key={el.id}
                        el={el}
                        selected={el.id === selectedId}
                        vs={vs}
                        rotation={currentMeta.rotation}
                        constrainWidth={
                          currentMeta
                            ? displayRect(vs, {
                                x: 0,
                                y: currentMeta.height,
                                width: currentMeta.width,
                                height: currentMeta.height,
                              }).width
                            : 0
                        }
                        onSelect={() => setSelectedId(el.id)}
                        onStartMove={(e) => startDrag(e, el.id, "move")}
                        onStartResize={(e, corner) => startDrag(e, el.id, "resize", corner)}
                        onChangeText={(text) => patchElement(el.id, { text })}
                        onEditFocus={handleEditFocus}
                        onEditBlur={handleEditBlur}
                      />
                    ))}
                </div>
              </div>

              {error && (
                <p role="alert" className="mt-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </p>
              )}

              {selected && (
                <Inspector
                  el={selected}
                  onPatch={(patch) => {
                    if (selectedId) patchElement(selectedId, patch);
                  }}
                  onDelete={deleteSelected}
                  onEditFocus={handleEditFocus}
                  pageFontsCache={pageFontsMap}
                />
              )}
            </div>
          </div>

          <p className="text-xs text-slate-500">
            {elements.length} editable item{elements.length === 1 ? "" : "s"} detected or created.
            Click existing text to edit it in place; everything you don&apos;t touch — layout, images
            and the rest of the text — is preserved exactly.
          </p>
        </div>
      )}
    </div>
  );
}

function cloneEls(list: PdfEditorElement[]): PdfEditorElement[] {
  return list.map((e) => ({ ...e, coverRect: e.coverRect ? { ...e.coverRect } : null }));
}

function ElementOverlay({
  el,
  selected,
  vs,
  rotation,
  constrainWidth,
  onSelect,
  onStartMove,
  onStartResize,
  onChangeText,
  onEditFocus,
  onEditBlur,
}: {
  el: PdfEditorElement;
  selected: boolean;
  vs: Vs;
  rotation: number;
  constrainWidth: number;
  onSelect: () => void;
  onStartMove: (e: RPointerEvent) => void;
  onStartResize: (e: RPointerEvent, corner: Corner) => void;
  onChangeText: (text: string) => void;
  onEditFocus: () => void;
  onEditBlur: () => void;
}) {
  const box = displayBoxFor(el, vs);
  const vx = vs.fromPdfPoint(1, 0)[0] - vs.fromPdfPoint(0, 0)[0];
  const scale = Math.max(0.05, Math.abs(vx) || 0.05);
  const editing = selected && !el.removed;
  const isExtracted = el.source === "extracted";
  const replacedByUser = isExtracted && (el.touched || el.removed);
  const showText = el.source === "new" && !el.removed;
  const showPlaceholder = isExtracted && !el.removed && !editing && !replacedByUser;
  const rotate = rotation ? `rotate(${rotation}deg)` : undefined;

  /** Display rect of the original PDF text this element is replacing. */
  const originalBox = isExtracted
    ? displayRect(vs, el.coverRect ?? { x: el.x, y: el.y, width: el.width, height: el.height })
    : null;
  const movedAway =
    !!originalBox &&
    (Math.abs(originalBox.x - box.x) > 0.5 ||
      Math.abs(originalBox.y - box.y) > 0.5 ||
      Math.abs(originalBox.width - box.width) > 0.5 ||
      Math.abs(originalBox.height - box.height) > 0.5);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const downBoxRef = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const [fitWidth, setFitWidth] = useState<number | null>(null);

  useEffect(() => {
    if (!editing) return;
    let raf = 0;
    const update = () => {
      if (!measureRef.current) return;
      const textW = measureRef.current.getBoundingClientRect().width;
      const maxW = constrainWidth > 0 ? constrainWidth - box.x - 6 : box.width;
      setFitWidth(Math.max(box.width, Math.min(textW, Math.max(maxW, box.width))));
    };
    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, [editing, el.text, el.font, el.fontSize, el.weight, el.italic, scale, constrainWidth, box.x, box.width, isExtracted]);

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [editing]);

  const inner: CSSProperties = {
    ...fontStyle(el),
    fontSize: el.fontSize * scale,
    lineHeight: el.lineHeight,
    color: el.color,
    textAlign: el.align,
    whiteSpace: "pre-wrap",
  };

  const mark = (rect: { x: number; y: number; width: number; height: number } | null) =>
    rect ? (
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bg-white"
        style={{ left: rect.x, top: rect.y, width: rect.width, height: rect.height }}
      />
    ) : null;

  const editedWidth = (): number | undefined =>
    editing && isExtracted ? (fitWidth ?? box.width) : undefined;

  return (
    <div
      role="button"
      tabIndex={selected ? 0 : -1}
      aria-label={
        el.source === "extracted"
          ? el.removed
            ? "Removed existing text"
            : "Existing text, click to edit in place"
          : `Text element: ${el.text.slice(0, 40)}`
      }
      onPointerDown={(e) => {
        downBoxRef.current = { ...box };
        onStartMove(e);
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (
          editing &&
          isExtracted &&
          textareaRef.current &&
          e.target !== textareaRef.current &&
          !(e.target as HTMLElement)?.closest?.("textarea")
        ) {
          const before = downBoxRef.current;
          const same =
            Math.abs(before.x - box.x) < 0.5 &&
            Math.abs(before.y - box.y) < 0.5 &&
            Math.abs(before.width - box.width) < 0.5 &&
            Math.abs(before.height - box.height) < 0.5;
          if (same) {
            const len = textareaRef.current.value.length;
            if (len > 0) {
              const rect = textareaRef.current.getBoundingClientRect();
              const frac = clamp((e.clientX - rect.left) / Math.max(1, rect.width), 0, 1);
              textareaRef.current.setSelectionRange(
                Math.round(frac * len),
                Math.round(frac * len),
              );
            }
            return;
          }
        }
        onSelect();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.stopPropagation();
          onSelect();
        }
      }}
      className={`absolute touch-none select-none rounded-sm outline-none ${
        el.removed
          ? "border border-dashed border-red-400"
          : selected && isExtracted
            ? "border border-dashed border-slate-400/70"
            : selected
              ? "border border-blue-500"
              : isExtracted
                ? "border border-dashed border-transparent hover:border-orange-400"
                : "border border-transparent hover:border-orange-300"
      }`}
      style={{ left: box.x, top: box.y, width: box.width, height: box.height }}
    >
      {/* Hide exactly the original PDF text this element replaces — same rect the export erases. */}
      {editing && originalBox && mark(originalBox)}
      {editing && originalBox && movedAway && mark(box)}

      {editing ? (
        <>
          {/* Invisible ruler: gives the textarea its true, PDF-proportional text width. */}
          <span
            ref={measureRef}
            aria-hidden="true"
            className="pointer-events-none invisible absolute top-0 left-0"
            style={{ ...inner, whiteSpace: "pre", width: "max-content" }}
          >
            {el.text || " "}
          </span>
          <textarea
            ref={textareaRef}
            value={el.text}
            placeholder={el.source === "extracted" ? "Type replacement text" : undefined}
            onChange={(e) => onChangeText(e.target.value)}
            onFocus={onEditFocus}
            onBlur={onEditBlur}
            onPointerDown={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.stopPropagation();
                e.currentTarget.blur();
              }
            }}
            className={`resize-none select-text focus:outline-none ${
              isExtracted ? "bg-white text-slate-900" : "bg-transparent"
            }`}
            style={{
              ...inner,
              width: editedWidth() ?? "100%",
              height: Math.max(box.height, el.fontSize * scale * el.lineHeight),
              padding: 0,
              overflowY: "hidden",
              verticalAlign: "top",
              caretColor: "#f97316",
            }}
          />
        </>
      ) : replacedByUser ? (
        <>
          {mark(originalBox)}
          {movedAway && mark(box)}
          {isExtracted && (
            <span
              className={`block h-full overflow-hidden ${
                el.removed ? "text-[10px] leading-tight text-red-400" : "bg-white text-slate-900"
              }`}
              style={{
                ...inner,
                whiteSpace: "pre",
                overflow: "visible",
                ...(el.removed ? { fontSize: 10, color: "#f87171" } : {}),
              }}
            >
              {el.removed ? "removed" : el.text}
            </span>
          )}
        </>
      ) : showText ? (
        <span className="block h-full w-full overflow-hidden" style={{ ...inner, transform: rotate }}>
          {el.text}
        </span>
      ) : showPlaceholder ? (
        <span
          className="block h-full w-full text-[10px] leading-tight text-slate-400"
          style={{ transform: rotate }}
        >
          …
        </span>
      ) : null}
      {selected && !el.removed && !isExtracted && (
        <>
          <Handle pos="nw" onPointerDown={(e) => onStartResize(e, "nw")} />
          <Handle pos="ne" onPointerDown={(e) => onStartResize(e, "ne")} />
          <Handle pos="sw" onPointerDown={(e) => onStartResize(e, "sw")} />
          <Handle pos="se" onPointerDown={(e) => onStartResize(e, "se")} />
          <Handle pos="n" onPointerDown={(e) => onStartResize(e, "n")} />
          <Handle pos="s" onPointerDown={(e) => onStartResize(e, "s")} />
          <Handle pos="w" onPointerDown={(e) => onStartResize(e, "w")} />
          <Handle pos="e" onPointerDown={(e) => onStartResize(e, "e")} />
        </>
      )}
      {selected && !el.removed && !isExtracted && (
        <span
          aria-hidden="true"
          className="absolute flex items-center justify-center"
          style={{ left: box.width / 2 - 7, top: -28, width: 14, height: 14, cursor: "grab" }}
          onPointerDown={(e) => {
            e.stopPropagation();
            onStartResize(e, "nw");
          }}
        >
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 text-slate-400">
            <path d="M8 2v12M4 6l4-4 4 4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      )}
    </div>
  );
}

function Handle({ pos, onPointerDown }: { pos: Corner; onPointerDown: (e: RPointerEvent) => void }) {
  const isSide = pos === "n" || pos === "s" || pos === "e" || pos === "w";
  const style: CSSProperties = {
    position: "absolute",
    width: isSide ? 16 : 8,
    height: isSide ? 8 : 16,
    background: isSide ? "transparent" : "white",
    border: isSide ? "none" : "1.5px solid #f97316",
    borderRadius: isSide ? 2 : 9999,
    cursor: pos === "nw" || pos === "se" ? "nwse-resize"
      : pos === "ne" || pos === "sw" ? "nesw-resize"
      : pos === "n" || pos === "s" ? "ns-resize"
      : "ew-resize",
    ...(isSide ? { background: "rgba(249,115,22,0.35)" } : {}),
  };
  if (pos.includes("n")) style.top = isSide ? -4 : -4;
  else if (pos.includes("s")) style.bottom = isSide ? -4 : -4;
  else { style.top = "50%"; style.transform = "translateY(-50%)"; }
  if (pos.includes("w")) style.left = isSide ? -8 : -4;
  else if (pos.includes("e")) style.right = isSide ? -8 : -4;
  else if (isSide) { style.left = "50%"; style.transform = (style.transform ?? "") + " translateX(-50%)"; }
  return (
    <span
      aria-hidden="true"
      onPointerDown={(e) => {
        e.stopPropagation();
        onPointerDown(e);
      }}
      style={style}
    />
  );
}

function Inspector({
  el,
  onPatch,
  onDelete,
  onEditFocus,
  pageFontsCache,
}: {
  el: PdfEditorElement;
  onPatch: (patch: Partial<PdfEditorElement>) => void;
  onDelete: () => void;
  onEditFocus: () => void;
  pageFontsCache: Map<number, { ordinal: number; base: string; isStandard: boolean }[]>;
}) {
  const fonts = (
    el.source === "extracted"
      ? Object.keys(PDF_EDITOR_FONT_LABELS)
      : Object.keys(PDF_EDITOR_FONT_LABELS).filter((f) => f !== "original")
  ) as PdfEditorFontId[];
  const kinds: PdfEditorElementKind[] = ["text", "heading", "tagline", "paragraph", "textbox"];
  const aligns: PdfEditorAlign[] = ["left", "center", "right"];
  const detectedFontName = el.source === "extracted"
    ? (() => {
        const ordinal = Number((el.sourceFontName ?? "").match(/\d+$/)?.[0] ?? 0);
        const pageFonts = pageFontsCache.get(el.pageNumber) ?? [];
        const match = pageFonts.find((f) => f.ordinal === ordinal);
        return match?.base?.replace(/^[A-Z]{6}\+/, "") || el.sourceFontLabel || el.sourceFontName || "";
      })()
    : "";
  return (
    <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-800">
          {el.source === "extracted" ? (el.removed ? "Removed text" : "Edit text") : `${el.kind}`}
        </h2>
        <button
          type="button"
          onClick={onDelete}
          className="text-sm font-medium text-red-600 hover:text-red-700"
        >
          {el.source === "extracted"
            ? el.removed ? "Restore" : "Remove"
            : "Delete"}
        </button>
      </div>

      {el.source === "extracted" && !el.removed && detectedFontName && (
        <p className="mb-3 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs text-emerald-800">
          Detected: <span className="font-medium">{detectedFontName}</span>
          {el.detectedFontSize ? ` ${el.detectedFontSize}pt` : ""}
          {el.detectedWeight === "bold" ? " Bold" : ""}
          {el.detectedItalic ? " Italic" : ""}
          {el.detectedColor ? ` in ${el.detectedColor}` : ""}
        </p>
      )}

      {!el.removed && (
        <>
          <label className={`${labelCls} mt-1`} htmlFor="el-text">Text</label>
          <textarea
            id="el-text"
            value={el.text}
            onChange={(e) => onPatch({ text: e.target.value })}
            onFocus={onEditFocus}
            rows={el.source === "extracted" ? 2 : 3}
            className={inputCls}
          />

          <div className="mt-3 grid gap-3" style={{ gridTemplateColumns: "auto 1fr auto" }}>
            <label className={labelCls}>
              Type
              <select
                value={el.kind}
                onChange={(e) => onPatch({ kind: e.target.value as PdfEditorElementKind })}
                className={inputCls}
              >
                {kinds.map((k) => <option key={k} value={k}>{k.charAt(0).toUpperCase() + k.slice(1)}</option>)}
              </select>
            </label>
            <label className={labelCls}>
              Font
              <select
                value={el.font}
                onChange={(e) => onPatch({ font: e.target.value as PdfEditorFontId })}
                className={inputCls}
              >
                {fonts.map((f) => (
                  <option key={f} value={f}>
                    {f === "original" && detectedFontName ? detectedFontName : PDF_EDITOR_FONT_LABELS[f]}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelCls}>
              Size
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onPatch({ fontSize: clamp(Math.round(el.fontSize) - 1, PDF_EDITOR_MIN_FONT_SIZE, PDF_EDITOR_MAX_FONT_SIZE) })}
                  className="flex h-8 w-8 items-center justify-center rounded border border-slate-300 text-sm text-slate-600 hover:bg-slate-50"
                >
                  −
                </button>
                <input
                  type="number"
                  min={PDF_EDITOR_MIN_FONT_SIZE}
                  max={PDF_EDITOR_MAX_FONT_SIZE}
                  value={Math.round(el.fontSize)}
                  onChange={(e) => onPatch({ fontSize: clamp(Number(e.target.value) || PDF_EDITOR_MIN_FONT_SIZE, PDF_EDITOR_MIN_FONT_SIZE, PDF_EDITOR_MAX_FONT_SIZE) })}
                  className={`${inputCls} w-16 text-center`}
                />
                <button
                  type="button"
                  onClick={() => onPatch({ fontSize: clamp(Math.round(el.fontSize) + 1, PDF_EDITOR_MIN_FONT_SIZE, PDF_EDITOR_MAX_FONT_SIZE) })}
                  className="flex h-8 w-8 items-center justify-center rounded border border-slate-300 text-sm text-slate-600 hover:bg-slate-50"
                >
                  +
                </button>
              </div>
            </label>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {(["bold", "italic", "underline"] as const).map((prop) => (
              <button
                key={prop}
                type="button"
                onClick={() => {
                  if (prop === "bold") onPatch({ weight: (el.weight === "bold" ? "normal" : "bold") as PdfEditorWeight });
                  else if (prop === "italic") onPatch({ italic: !el.italic });
                  else onPatch({ underline: !el.underline });
                }}
                className={`rounded-md border px-2.5 py-1 text-xs font-medium ${
                  (prop === "bold" && el.weight === "bold") || (prop === "italic" && el.italic) || (prop === "underline" && el.underline)
                    ? "border-orange-400 bg-orange-50 text-orange-700"
                    : "border-slate-300 text-slate-500 hover:bg-slate-50"
                }`}
              >
                {prop === "bold" ? "B" : prop === "italic" ? "I" : "U"}
              </button>
            ))}
            <span className="mx-1 h-5 w-px bg-slate-200" />
            {aligns.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => onPatch({ align: a })}
                className={`rounded-md border px-2 py-1 text-xs ${
                  el.align === a
                    ? "border-orange-400 bg-orange-50 text-orange-700"
                    : "border-slate-300 text-slate-500 hover:bg-slate-50"
                }`}
              >
                {a === "left" ? "◧" : a === "center" ? "◫" : "◨"}
              </button>
            ))}
            <span className="mx-1 h-5 w-px bg-slate-200" />
            <input
              type="color"
              value={el.color}
              onChange={(e) => onPatch({ color: e.target.value })}
              className="h-7 w-7 cursor-pointer rounded border border-slate-300 bg-white p-0.5"
              aria-label="Text color"
            />
            {PDF_EDITOR_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => onPatch({ color: c })}
                className={`h-5 w-5 rounded-full border ${
                  el.color.toLowerCase() === c
                    ? "border-orange-500 ring-1 ring-orange-300"
                    : "border-slate-200"
                }`}
                style={{ background: c }}
                aria-label={`Use color ${c}`}
              />
            ))}
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className={labelCls}>
              Opacity
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={el.opacity ?? 1}
                onChange={(e) => onPatch({ opacity: Number(e.target.value) })}
                className="w-full"
              />
            </label>
            <div className="flex items-end gap-2">
              <label className={`${labelCls} flex-1`}>
                X
                <input
                  type="number"
                  value={Math.round(el.x)}
                  onChange={(e) => onPatch({ x: Number(e.target.value) || 0 })}
                  className={inputCls}
                />
              </label>
              <label className={`${labelCls} flex-1`}>
                Y
                <input
                  type="number"
                  value={Math.round(el.y)}
                  onChange={(e) => onPatch({ y: Number(e.target.value) || 0 })}
                  className={inputCls}
                />
              </label>
            </div>
          </div>

          <label className={`${labelCls} mt-3`}>
            Link URL
            <input
              type="url"
              value={el.link ?? ""}
              placeholder="https://..."
              onChange={(e) => onPatch({ link: e.target.value })}
              className={inputCls}
            />
          </label>

          <p className="mt-3 text-xs text-slate-400">
            Drag to move · Handles to resize · Delete key or button to remove. PDFs are static — animation and text effects cannot be exported.
          </p>
        </>
      )}
    </div>
  );
}

function Thumb({
  pdf,
  index,
  selected,
  onSelect,
  pageSize,
}: {
  pdf: PDFDocumentProxy | null;
  index: number;
  selected: boolean;
  onSelect: () => void;
  pageSize: { width: number; height: number };
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
        const scale = 80 / Math.max(1, pageSize.width, pageSize.height);
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
  }, [visible, pdf, index, pageSize.width, pageSize.height]);

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={`Go to page ${index}`}
      aria-current={selected ? "page" : undefined}
      className={`flex w-full flex-col items-center gap-1 rounded-md border-2 p-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${
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