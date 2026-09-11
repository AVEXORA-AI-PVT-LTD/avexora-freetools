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
  PDF_EDITOR_ADVANCE_EM,
  PDF_EDITOR_COLORS,
  PDF_EDITOR_FONT_LABELS,
  PDF_EDITOR_MAX_BYTES,
  PDF_EDITOR_MAX_FONT_SIZE,
  PDF_EDITOR_MAX_PAGES,
  PDF_EDITOR_MIN_ELEMENT_SIZE,
  PDF_EDITOR_MIN_FONT_SIZE,
  buildEditedPdf,
  buildViewportTransform,
  clamp,
  colorsForItems,
  elementContentHeight,
  elementFromTextItem,
  extractColorRuns,
  finiteOr,
  inspectPdf,
  makeElement,
  moveElementRect,
  normalizeDegrees,
  paddedCoverRect,
  readPageFonts,
  replacementCoverRect,
  replacementLines,
  resizeElementRect,
  sanitizeEditedFilename,
  snapDegrees,
  wrapText,
  type Corner,
  type PdfEditorAlign,
  type PdfEditorElement,
  type PdfEditorElementKind,
  type PdfEditorFontId,
  type PdfEditorWeight,
  type PdfSourceTextItem,
  type PdfSourceTextStyle,
  type PdfViewportTransform,
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

type Vs = PdfViewportTransform;

interface DragInfo {
  id: string;
  mode: "move" | "resize" | "rotate";
  startX: number;
  startY: number;
  corner?: Corner;
  orig: PdfEditorElement;
  /** Display-space centre of the element box; used by the rotation handle. */
  centerX?: number;
  centerY?: number;
  /** Element rotation when the rotation drag started. */
  startRotation?: number;
  /** Pointer angle (radians, atan2 of the pointer around the element centre) at drag start. */
  startAngle?: number;
}

const ZOOM_STEPS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;
const ADD_LABELS: Record<PdfEditorElementKind, string> = {
  text: "+ Text",
  heading: "+ Heading",
  tagline: "+ Tagline",
  paragraph: "+ Paragraph",
  textbox: "+ Text Box",
};

/** Arrow-key nudges, in PDF-space [dx, dy] per press. */
const ARROW_MOVE: Record<string, [number, number]> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, 1],
  ArrowDown: [0, -1],
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

/** Magnitude of the PDF x-axis mapped to display px (rotation-safe scale). */
function displayScale(vs: Vs): number {
  return Math.max(0.05, vs.scale);
}

/** PDF-space page size for an element's page, or null if unknown yet. */
function editorPageMetaFor(
  el: PdfEditorElement,
  metas: EditorPageMeta[] | null,
): { width: number; height: number } | null {
  const m = metas?.[el.pageNumber - 1];
  return m ? { width: m.width, height: m.height } : null;
}

/**
 * Auto-size a NEW element while its text is typed: single-line kinds grow in
 * width to fit the longest line, block kinds grow in height to fit every
 * wrapped line — so typing can never clip the text or overflow the box. Only
 * ever grows; the user keeps control with the resize handles.
 */
function growRectForText(
  el: PdfEditorElement,
  text: string,
  page: { width: number; height: number },
): Partial<PdfEditorElement> {
  const fontSize = finiteOr(el.fontSize, PDF_EDITOR_MIN_FONT_SIZE);
  const width = finiteOr(el.width, 1);
  const step = Math.max(1, fontSize * el.lineHeight);
  const lines = wrapText(text, Math.max(1, width), fontSize, el.font);
  const rect: { width?: number; height?: number } = {};
  const neededH = lines.length * step + fontSize * 0.4;
  if (el.kind === "paragraph" || el.kind === "textbox") {
    if (neededH > finiteOr(el.height, 0)) {
      rect.height = Math.min(neededH, Math.max(finiteOr(el.height, 0), page.height));
    }
  } else {
    // Single-line kinds never auto-wrap (elementWrapWidth keeps them on one
    // line), so the grown width and height come from the actual content, not
    // the wrap estimate — height only grows for real explicit lines.
    const explicitLines = text.split("\n");
    let longest = 0;
    for (const ln of explicitLines) longest = Math.max(longest, ln.length);
    const adv = PDF_EDITOR_ADVANCE_EM[el.font] * fontSize;
    const growW = Math.max(width, longest * adv + fontSize * 0.5);
    rect.width = Math.min(growW, Math.max(width, page.width - finiteOr(el.x, 0)));
    const neededH = elementContentHeight(fontSize, el.lineHeight, Math.max(1, explicitLines.length));
    if (neededH > finiteOr(el.height, 0)) {
      rect.height = Math.min(neededH, page.height);
    }
  }
  return rect;
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

/** Human-readable name of the PDF font an extracted element uses. */
function detectedFontNameFor(
  el: PdfEditorElement,
  pageFontsCache: Map<number, { ordinal: number; base: string; isStandard: boolean }[]>,
): string {
  if (el.source !== "extracted") return "";
  const ordinal = Number((el.sourceFontName ?? "").match(/\d+$/)?.[0] ?? 0);
  const pageFonts = pageFontsCache.get(el.pageNumber) ?? [];
  const match = pageFonts.find((f) => f.ordinal === ordinal);
  return (
    match?.base?.replace(/^[A-Z]{6}\+/, "") ||
    el.sourceFontLabel ||
    el.sourceFontName ||
    ""
  );
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showExtracted, setShowExtracted] = useState(true);
  const [draggingOver, setDraggingOver] = useState(false);
  const [stageWidth, setStageWidth] = useState(0);
  const [vs, setVs] = useState<Vs | null>(null);
  const [pageFontsMap, setPageFontsMap] = useState<
    Map<number, { ordinal: number; base: string; isStandard: boolean }[]>
  >(new Map());

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
  const pageMetaRef = useRef<EditorPageMeta[] | null>(null);
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

  useEffect(() => {
    pageMetaRef.current = pageMeta;
  }, [pageMeta]);

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

  /**
   * Apply a partial update to one element. Geometry is sanitised at the single
   * choke point the whole app shares: any value that reaches here is clamped
   * to a finite, inside-the-page, minimum-sized box, so a bad pointer delta,
   * stale state or NaN can never make an object disappear or jump off page.
   * The first touch of extracted text snapshots the original area (coverRect)
   * so the export can erase exactly what the PDF used to paint there.
   */
  const patchElement = useCallback(
    (id: string, patch: Partial<PdfEditorElement>) => {
      setElementsBoth(
        elementsRef.current.map((e) => {
          if (e.id !== id) return e;
          const pristineExtracted = e.source === "extracted" && !e.removed && !e.coverRect;
          const next = { ...e, ...patch, touched: true } as PdfEditorElement;
          if (pristineExtracted) {
            next.coverRect = { x: e.x, y: e.y, width: e.width, height: e.height };
          } else if (next.coverRect) {
            next.coverRect = { ...next.coverRect };
          }
          const meta = pageMetaRef.current?.[next.pageNumber - 1];
          if (meta) {
            next.x = clamp(finiteOr(Number(next.x), 0), 0, meta.width);
            next.y = clamp(finiteOr(Number(next.y), 0), 0, meta.height);
            next.width = clamp(
              finiteOr(Number(next.width), 1),
              PDF_EDITOR_MIN_ELEMENT_SIZE,
              meta.width,
            );
            next.height = clamp(
              finiteOr(Number(next.height), 1),
              PDF_EDITOR_MIN_ELEMENT_SIZE,
              meta.height,
            );
          }
          return next;
        }),
      );
    },
    [setElementsBoth],
  );

  /**
   * The single place selection changes are made. Whenever the selection moves
   * to a different element (or is cleared), any active inline editor is
   * dropped in the same step — there is never more than one editing layer and
   * no editor outlives a selection change.
   */
  const changeSelection = useCallback((id: string | null) => {
    setEditingId((cur) => (cur && cur !== id ? null : cur));
    setSelectedId(id);
  }, []);

  /** Typing handler: sets text and grow-to-fit a newly created element. */
  const handleTextChange = useCallback(
    (id: string, text: string) => {
      const patch: Partial<PdfEditorElement> = { text };
      const el = elementsRef.current.find((x) => x.id === id);
      if (!el) { patchElement(id, patch); return; }
      if (el.source === "new") {
        const meta = pageMetaRef.current?.[el.pageNumber - 1];
        if (meta) Object.assign(patch, growRectForText(el, text, meta));
      }
      patchElement(id, patch);
    },
    [patchElement],
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
    changeSelection(null);
    setShowExtracted(true);
    setVs(null);
    pastRef.current = [];
    setPast([]);
    futureRef.current = [];
    setFuture([]);
    setDraggingOver(false);
    clearPdfResources();
  }, [clearPdfResources, changeSelection, setElementsBoth]);

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
        changeSelection(null);
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
  }, [pdfBytes, clearPdfResources, changeSelection, setElementsBoth]);

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
        // Never composite a new frame over the previous one: without this, re-
        // renders at the same scale (rapid zoom/page changes) leave the old
        // page ghosted underneath the new one and the document looks doubled
        // and layered.
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const t = viewport.transform as unknown as [
          number,
          number,
          number,
          number,
          number,
          number,
        ];
        const vs = buildViewportTransform(t, { width: cssW, height: cssH });
        vsRef.current = vs;
        setVs(vs);
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
      // Abort any in-flight paint so a stale partial frame never lingers under
      // the next page/zoom render (the ghosted "double document" effect).
      renderTaskRef.current?.cancel();
      renderTaskRef.current = null;
    };
  }, [pageNumber, zoom, pageMeta, pdfProxy, stageWidth]);

  useEffect(() => {
    // Pointer moves coalesce onto the animation frame: every event derives a
    // deterministic patch from the drag ORIGIN snapshot (never from itself or
    // a previous patch), so dropping intermediate frames is always safe and a
    // long drag applies at most one store write + React render per frame.
    let rafId = 0;
    let queuedPatch: (() => void) | null = null;
    const onMove = (e: PointerEvent) => {
      // Deltas must go through the LINEAR inverse: the full affine inverse
      // adds the page offset to every pointer delta, which teleported dragged
      // text to the top of the page and blew resizes up to the full page.
      const deltaToPdf = vsRef.current?.deltaToPdf;
      if (!deltaToPdf) return;
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
      // The pointer DELTA is converted through the shared PDF↔display
      // transform, so a drag of N CSS pixels on screen moves the element a PDF
      // delta that lands exactly N pixels from where it was at every zoom level.
      const dx = e.clientX - active.startX;
      const dy = e.clientY - active.startY;
      const [dpX, dpY] = deltaToPdf(dx, dy);
      const o = active.orig;

      let patch: Partial<PdfEditorElement> | null = null;
      if (active.mode === "move") {
        const page = editorPageMetaFor(o, pageMeta);
        if (!page) return;
        // Moves BOTH axes via the same shared geometry math as export; clamps
        // to the page so a drag cannot send an object permanently off-canvas.
        const r = moveElementRect(o, dpX, dpY, page);
        if (r.x !== o.x || r.y !== o.y) patch = { x: r.x, y: r.y };
      } else if (active.mode === "rotate") {
        const acx = active.centerX ?? 0;
        const acy = active.centerY ?? 0;
        const angle = Math.atan2(e.clientY - acy, e.clientX - acx);
        const deltaDeg = (angle - (active.startAngle ?? 0)) * (180 / Math.PI);
        const deg = snapDegrees((active.startRotation ?? 0) + deltaDeg);
        if (deg !== Math.round(o.rotation ?? 0)) patch = { rotation: deg };
      } else {
        const c = active.corner ?? "se";
        const page = editorPageMetaFor(o, pageMeta);
        if (!page) return;
        // Resize anchors the edge opposite the handle and clamps growth BEFORE
        // applying it, so dragging a handle past the page edge can never inflate
        // the box to the whole page or jump it into a corner.
        const nr = resizeElementRect(o, dpX, dpY, c, page);
        if (
          nr.x !== o.x ||
          nr.y !== o.y ||
          nr.width !== o.width ||
          nr.height !== o.height
        ) {
          patch = { x: nr.x, y: nr.y, width: nr.width, height: nr.height };
        }
      }
      if (!patch) return;
      queuedPatch = () => patchElement(active.id, patch!);
      if (!rafId) rafId = requestAnimationFrame(() => {
        rafId = 0;
        const fn = queuedPatch;
        queuedPatch = null;
        fn?.();
      });
    };
    const onUp = () => {
      pendingDragRef.current = null;
      dragRef.current = null;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [patchElement, pageMeta, pushHistory]);

  const startDrag = useCallback(
    (
      e: RPointerEvent,
      id: string,
      mode: "move" | "resize" | "rotate",
      corner?: Corner,
    ) => {
      e.preventDefault();
      e.stopPropagation();
      const o = elementsRef.current.find((x) => x.id === id);
      if (!o) return;
      changeSelection(id);
      let centerX: number | undefined;
      let centerY: number | undefined;
      let startRotation: number | undefined;
      let startAngle: number | undefined;
      if (mode === "rotate" && vsRef.current) {
        const box = displayBoxFor(o, vsRef.current);
        centerX = box.x + box.width / 2;
        centerY = box.y + box.height / 2;
        startRotation = o.rotation ?? 0;
        startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
      }
      pendingDragRef.current = {
        id,
        mode,
        startX: e.clientX,
        startY: e.clientY,
        corner,
        orig: { ...o, coverRect: o.coverRect ? { ...o.coverRect } : null },
        centerX,
        centerY,
        startRotation,
        startAngle,
      };
    },
    [changeSelection],
  );

  const addElement = useCallback(
    (kind: PdfEditorElementKind, pos?: { x: number; y: number }) => {
      const meta = pageMeta?.[pageNumber - 1];
      if (!meta) return;
      pushHistory();
      const opts: Partial<Pick<PdfEditorElement, "x" | "y" | "width" | "height">> = pos
        ? { x: pos.x, y: pos.y, width: kind === "paragraph" || kind === "textbox" ? 220 : 180 }
        : { width: Math.min(meta.width, 240), height: Math.min(meta.height, 260) };
      if (pos && (kind === "paragraph" || kind === "textbox")) opts.height = 90;
      const el = makeElement(kind, pageNumber, meta, opts);
      setElementsBoth([...elementsRef.current, el]);
      changeSelection(el.id);
      // A freshly added text object opens its inline editor directly so the
      // user can type immediately; afterwards it follows the same
      // select-then-edit rhythm as existing PDF text.
      setEditingId(el.id);
    },
    [pageMeta, pageNumber, changeSelection, pushHistory, setElementsBoth],
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
      changeSelection(null);
    }
  }, [selectedId, changeSelection, pushHistory, setElementsBoth]);

  const handleEditFocus = useCallback(() => {
    if (!historyGuardRef.current) {
      historyGuardRef.current = true;
      pushHistory();
    }
  }, [pushHistory]);

  const handleEditBlur = useCallback(() => {
    historyGuardRef.current = false;
  }, []);

  /**
   * First click on a text element selects it ONLY — it never enters edit mode
   * and never paints any text; the canvas keeps being the single visible copy.
   * The inline editor is a separate state (editingId) so that:
   *   - first click  → select (nothing rendered beyond the selection box)
   *   - second click → inline edit (caret inside the one visible copy)
   * Keep the active editor ≤ 1 at all times: whenever the selection moves away
   * from an editing element, its transient edit layer is dropped immediately.
   */
  const selectOnly = useCallback(
    (id: string) => {
      changeSelection(id);
    },
    [changeSelection],
  );

  const startEdit = useCallback((id: string) => {
    const o = elementsRef.current.find((x) => x.id === id);
    if (!o || o.removed) return;
    setEditingId((cur) => (cur && cur !== id ? null : cur));
    setSelectedId(id);
    setEditingId(id);
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
      } else if (e.key === "Escape") {
        if (pendingAddKind) { setPendingAddKind(null); return; }
        changeSelection(null);
      } else if (ARROW_MOVE[e.key] && selectedId) {
        // Precise nudge: 1pt per press, 3pt with ctrl/cmd, 10pt with shift.
        e.preventDefault();
        const el = elementsRef.current.find((x) => x.id === selectedId);
        const page = el ? editorPageMetaFor(el, pageMetaRef.current) : null;
        if (!el || !page) return;
        const [dx, dy] = ARROW_MOVE[e.key];
        const nudge = (e.shiftKey ? 10 : 1) * (e.ctrlKey || e.metaKey ? 3 : 1);
        const r = moveElementRect(el, dx * nudge, dy * nudge, page);
        if (r.x === el.x && r.y === el.y) return;
        pushHistory();
        patchElement(selectedId, { x: r.x, y: r.y });
      }
    },
    [selectedId, changeSelection, deleteSelected, pendingAddKind, pushHistory, patchElement],
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

  const goToPage = useCallback(
    (n: number) => {
      setPageNumber(clamp(n, 1, pageCount));
      // Navigate cleanly: no stale selection or editing layer from the other page.
      changeSelection(null);
    },
    [pageCount, changeSelection],
  );

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
                  changeSelection(null);
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
                    onSelect={() => goToPage(i + 1)}
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
                    onClick={() => goToPage(pageNumber - 1)}
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
                    onClick={() => goToPage(pageNumber + 1)}
                    disabled={pageNumber >= pageCount || busy}
                    className={iconBtn}
                    aria-label="Next page"
                  >
                    ›
                  </button>
                </div>
              </div>

              {selected && !selected.removed && (
                <ContextToolbar
                  el={selected}
                  onPatch={(patch) => {
                    if (selectedId) patchElement(selectedId, patch);
                  }}
                  pageFontsCache={pageFontsMap}
                />
              )}

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
                      changeSelection(null);
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
                      <EditorObject
                        key={el.id}
                        el={el}
                        selected={el.id === selectedId}
                        editing={el.id === editingId && selectedId === el.id && !el.removed}
                        vs={vs}
                        pageMeta={currentMeta}
                        onSelect={() => selectOnly(el.id)}
                        onStartEdit={() => startEdit(el.id)}
                        onStartMove={(e) => startDrag(e, el.id, "move")}
                        onStartResize={(e, corner) => startDrag(e, el.id, "resize", corner)}
                        onStartRotate={(e) => startDrag(e, el.id, "rotate")}
                        onChangeText={(text) => handleTextChange(el.id, text)}
                        onAutoGrow={patchElement}
                        onEditFocus={handleEditFocus}
                        onEditBlur={handleEditBlur}
                        onStopEdit={() => setEditingId(null)}
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
            Click existing text to select it, click it again (or double-click) to edit inline — one
            visible copy at all times. Everything you don&apos;t touch — layout, images and the rest
            of the text — is preserved exactly.
          </p>
        </div>
      )}
    </div>
  );
}

function cloneEls(list: PdfEditorElement[]): PdfEditorElement[] {
  return list.map((e) => ({ ...e, coverRect: e.coverRect ? { ...e.coverRect } : null }));
}

/**
 * One editable object on the page. Three strictly-ordered layers (all in
 * WRAP coordinates — never nested inside another offset box, which previously
 * double-offset every painted cover):
 *
 *   z=1  cover masks   — white rects that hide the original PDF text under a
 *                        replacement, at the original position and the current
 *                        replacement area (same rects the export erases).
 *   z=2  interactive   — the actual element: the live textarea while editing,
 *                        the replacement preview once touched, nothing at all
 *                        for pristine extracted text (the canvas stays the one
 *                        visible copy).
 *   z=3  selection     — the selection box with adaptive resize handles and the
 *                        rotation grip for new text.
 *
 * Hit areas: covers and the selection box are pointer-events-none; handles are
 * pointer-events-auto and stop propagation. Dragging the interactive layer
 * moves BOTH axes; handles resize; only new text rotates.
 */
function EditorObject({
  el,
  selected,
  editing,
  vs,
  pageMeta,
  onSelect,
  onStartEdit,
  onStartMove,
  onStartResize,
  onStartRotate,
  onChangeText,
  onAutoGrow,
  onEditFocus,
  onEditBlur,
  onStopEdit,
}: {
  el: PdfEditorElement;
  selected: boolean;
  editing: boolean;
  vs: Vs;
  pageMeta: EditorPageMeta;
  onSelect: () => void;
  onStartEdit: () => void;
  onStartMove: (e: RPointerEvent) => void;
  onStartResize: (e: RPointerEvent, corner: Corner) => void;
  onStartRotate: (e: RPointerEvent) => void;
  onChangeText: (text: string) => void;
  onAutoGrow: (id: string, patch: Partial<PdfEditorElement>) => void;
  onEditFocus: () => void;
  onEditBlur: () => void;
  onStopEdit: () => void;
}) {
  const box = displayBoxFor(el, vs);
  const scale = displayScale(vs);
  const isExtracted = el.source === "extracted";
  const replacedByUser = isExtracted && (el.touched || el.removed);
  const showReplacementSpan =
    (isExtracted && replacedByUser && !el.removed) || (el.source === "new" && !el.removed);
  const showCovers = isExtracted && (editing || replacedByUser);

  // The visible content box: always the stored box. Single-line kinds keep
  // their original tight height; multi-line heights are grown by the
  // auto-grow effect so the frame still covers every wrapped line.
  const frame = box;

  // White cover masks at WRAP coordinates, matching the erasure the export does.
  const originalCoverBox = isExtracted
    ? displayRect(
        vs,
        paddedCoverRect(
          el.coverRect ?? { x: el.x, y: el.y, width: el.width, height: el.height },
          el.fontSize,
        ),
      )
    : null;
  const replaceCoverBox = isExtracted && !el.removed
    ? displayRect(
        vs,
        replacementCoverRect(el, { width: pageMeta.width, height: pageMeta.height }),
      )
    : null;

  /**
   * Element-level rotation — preview only for new text (extracted always
   * exports unrotated). CSS positive degrees rotate clockwise, which is the
   * same visual the export produces (the compute side mirrors the sign for
   * PDF user-space). This is NOT the page's /Rotate value; the display box
   * already accounts for the page rotation via the viewport transform.
   */
  const elementRot = isExtracted ? 0 : normalizeDegrees(el.rotation ?? 0);
  const rotateTf = elementRot ? `rotate(${elementRot}deg)` : undefined;

  const downWasSelectedRef = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const caretOnEntryRef = useRef<number | null>(null);

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus();
      const caret = caretOnEntryRef.current;
      if (caret != null) {
        caretOnEntryRef.current = null;
        requestAnimationFrame(() => {
          const t = textareaRef.current;
          if (t) t.setSelectionRange(caret, caret);
        });
      }
    }
  }, [editing]);

  // Auto-grow stored width while editing — width measured from the textarea
  // (fallback font) keeps the preview text on one line. Only grows; never
  // shrinks; page-capped. New text uses growRectForText in handleTextChange.
  const lastGrowWRef = useRef<number | null>(null);
  useEffect(() => {
    if (!editing || el.source === "new") { lastGrowWRef.current = null; return; }
    const t = textareaRef.current;
    if (!t) return;
    const sw = t.scrollWidth;
    const cw = t.clientWidth;
    if (sw <= cw + 1) return;
    if (lastGrowWRef.current != null && Math.abs(lastGrowWRef.current - sw) < 2) return;
    lastGrowWRef.current = sw;
    const wantW = Math.min(sw / scale, Math.max(el.width, pageMeta.width - el.x));
    if (wantW > el.width + 0.5) {
      onAutoGrow(el.id, { width: Math.max(PDF_EDITOR_MIN_ELEMENT_SIZE, wantW) });
    }
  }, [editing, el, pageMeta, scale, onAutoGrow]);

  // Height auto-grow for extracted text: grow to match the export line count
  // when the text wraps (e.g. user added a newline or typed past the box
  // width). Height is deterministic from the compute layer, not DOM-measured.
  useEffect(() => {
    if (!editing || el.source === "new") return;
    const contentLines = replacementLines(el).length;
    if (contentLines <= 1) return;
    const wantH = elementContentHeight(el.fontSize, el.lineHeight, contentLines);
    if (wantH > el.height + 0.5) {
      onAutoGrow(el.id, { height: wantH });
    }
  }, [editing, el, onAutoGrow]);

  // Single content lines use tight line-height (1) so the box stays exactly
  // fontSize tall; multi-line content uses the PDF-derived line-height.
  const innerLineHeight = replacementLines(el).length === 1 ? 1 : el.lineHeight;
  const inner: CSSProperties = {
    ...fontStyle(el),
    fontSize: el.fontSize * scale,
    lineHeight: innerLineHeight,
    color: el.color,
    textAlign: el.align,
    whiteSpace: "pre-wrap",
  };

  return (
    <>
      {/* z=1 covers (canvas erasure) */}
      {showCovers && originalCoverBox && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bg-white"
          style={{
            left: originalCoverBox.x,
            top: originalCoverBox.y,
            width: originalCoverBox.width,
            height: originalCoverBox.height,
            zIndex: 1,
          }}
        />
      )}
      {showCovers && replaceCoverBox && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bg-white"
          style={{
            left: replaceCoverBox.x,
            top: replaceCoverBox.y,
            width: replaceCoverBox.width,
            height: replaceCoverBox.height,
            zIndex: 1,
          }}
        />
      )}

      {/* z=2 interactive layer */}
      <div
        role="button"
        tabIndex={selected ? 0 : -1}
        aria-label={
          el.source === "extracted"
            ? el.removed
              ? "Removed existing text"
              : "Existing text. First click selects, second click or double-click edits it in place"
            : `Text element: ${el.text.slice(0, 40)}`
        }
        onPointerDown={(e) => {
          downWasSelectedRef.current = selected;
          onStartMove(e);
        }}
        onClick={(e) => {
          e.stopPropagation();
          // Grabbing a resize handle / rotation grip is a gesture, not a
          // select-or-edit click — never let it toggle deselection or editing.
          if ((e.target as HTMLElement)?.closest?.("[data-handle],[data-rotate]")) return;
          if (editing) {
            // Inside the textarea: let the native caret handle the click.
            const insideTextarea =
              e.target === textareaRef.current ||
              !!(e.target as HTMLElement)?.closest?.("textarea");
            if (insideTextarea) return;
            return;
          }
          if (downWasSelectedRef.current && !el.removed) {
            // SECOND click on the already-selected text: enter inline edit mode
            // with the caret at the clicked position. Nothing is duplicated —
            // the single editable representation replaces the exact original.
            const rect = e.currentTarget.getBoundingClientRect();
            const frac = clamp((e.clientX - rect.left) / Math.max(1, rect.width), 0, 1);
            caretOnEntryRef.current = Math.round(frac * el.text.length);
            onStartEdit();
          } else {
            // FIRST click selects ONLY; the canvas stays the one visible copy.
            onSelect();
          }
        }}
        onDoubleClick={(e) => {
          if ((e.target as HTMLElement)?.closest?.("[data-handle],[data-rotate]")) return;
          const insideTextarea =
            e.target === textareaRef.current ||
            !!(e.target as HTMLElement)?.closest?.("textarea");
          if (insideTextarea) return;
          e.stopPropagation();
          if (!editing) onStartEdit();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.stopPropagation();
            if (selected) onStartEdit();
            else onSelect();
          }
        }}
        className={`absolute touch-none select-none rounded-sm outline-none ${
          el.removed ? "border border-dashed border-red-400" : "border border-transparent"
        } ${selected ? "" : "hover:border-orange-300"}`}
        style={{ left: frame.x, top: frame.y, width: frame.width, height: frame.height, zIndex: 2 }}
      >
        {editing ? (
          <textarea
            ref={textareaRef}
            value={el.text}
            placeholder={el.source === "extracted" ? "Type replacement text" : "Type text…"}
            onChange={(e) => onChangeText(e.target.value)}
            onFocus={onEditFocus}
            onBlur={() => {
              onEditBlur();
              onStopEdit();
            }}
            onPointerDown={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.stopPropagation();
                e.currentTarget.blur();
              }
            }}
            className="resize-none select-text overflow-y-auto overflow-x-hidden bg-transparent focus:outline-none"
            style={{
              ...inner,
              width: "100%",
              height: "100%",
              padding: 0,
              verticalAlign: "top",
              caretColor: "#f97316",
              transform: rotateTf,
            }}
          />
        ) : showReplacementSpan ? (
          <span
            className="block h-full w-full overflow-hidden"
            style={{
              ...inner,
              whiteSpace: innerLineHeight === 1 ? "nowrap" : "pre-wrap",
              opacity: el.opacity ?? 1,
              transform: rotateTf,
            }}
          >
            {el.text}
            {el.source === "new" && el.text.trim() === "" && (
              <span className="italic text-slate-300">Type text…</span>
            )}
          </span>
        ) : el.removed ? (
          <span className="flex h-full w-full items-center text-[10px] leading-tight text-red-400">
            removed
          </span>
        ) : null}
      </div>

      {/* z=3 selection frame + handles + rotate grip */}
      {selected && !el.removed && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute rounded-[3px] border border-blue-500/80"
          style={{ left: frame.x, top: frame.y, width: frame.width, height: frame.height, zIndex: 3 }}
        >
          {(() => {
            const small = frame.width < 56 || frame.height < 44;
            const sideLen = clamp(Math.round((Math.max(frame.width, frame.height) * 0.4) / 2) * 2, 28, 96);
            const s = small ? 11 : 13;
            const handles: {
              corner: Corner;
              left: number;
              top: number;
              w: number;
              h: number;
            }[] = [
              { corner: "nw", left: frame.x - s / 2, top: frame.y - s / 2, w: s, h: s },
              { corner: "ne", left: frame.x + frame.width - s / 2, top: frame.y - s / 2, w: s, h: s },
              { corner: "sw", left: frame.x - s / 2, top: frame.y + frame.height - s / 2, w: s, h: s },
              { corner: "se", left: frame.x + frame.width - s / 2, top: frame.y + frame.height - s / 2, w: s, h: s },
              { corner: "n", left: frame.x + frame.width / 2 - sideLen / 2, top: frame.y - 2, w: sideLen, h: 4 },
              { corner: "s", left: frame.x + frame.width / 2 - sideLen / 2, top: frame.y + frame.height - 2, w: sideLen, h: 4 },
              { corner: "e", left: frame.x + frame.width - 2, top: frame.y + frame.height / 2 - sideLen / 2, w: 4, h: sideLen },
              { corner: "w", left: frame.x - 2, top: frame.y + frame.height / 2 - sideLen / 2, w: 4, h: sideLen },
            ];
            const shown = small
              ? handles.filter((h) => h.corner.length === 2 || h.corner === "e" || h.corner === "w")
              : handles;
            return shown.map((h) => (
              <Handle
                key={h.corner}
                corner={h.corner}
                left={h.left}
                top={h.top}
                width={h.w}
                height={h.h}
                small={h.corner.length === 2}
                onPointerDown={(e) => onStartResize(e, h.corner)}
              />
            ));
          })()}
        </div>
      )}
      {selected && !el.removed && !isExtracted && (
        <span
          aria-hidden="true"
          data-rotate="1"
          className="absolute flex items-center justify-center rounded-full border border-orange-500 bg-white shadow"
          style={{
            left: frame.x + frame.width / 2 - 9,
            top: Math.max(frame.y - 32, -4),
            width: 18,
            height: 18,
            cursor: "grab",
            zIndex: 4,
          }}
          onPointerDown={(e) => {
            e.stopPropagation();
            onStartRotate(e);
          }}
        >
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 text-slate-500">
            <path d="M8 2v12M4 6l4-4 4 4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      )}
      {selected && el.removed && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute rounded-sm border border-dashed border-red-400"
          style={{ left: frame.x, top: frame.y, width: frame.width, height: frame.height, zIndex: 3 }}
        />
      )}
    </>
  );
}

function Handle({
  corner,
  left,
  top,
  width,
  height,
  small,
  onPointerDown,
}: {
  corner: Corner;
  left: number;
  top: number;
  width: number;
  height: number;
  small: boolean;
  onPointerDown: (e: RPointerEvent) => void;
}) {
  const cursor =
    corner === "nw" || corner === "se"
      ? "nwse-resize"
      : corner === "ne" || corner === "sw"
        ? "nesw-resize"
        : corner === "n" || corner === "s"
          ? "ns-resize"
          : "ew-resize";
  return (
    <span
      aria-hidden="true"
      data-handle="1"
      className="absolute"
      onPointerDown={(e) => {
        e.stopPropagation();
        onPointerDown(e);
      }}
      style={{
        left,
        top,
        width,
        height,
        cursor,
        background: small ? "#ffffff" : "rgba(249,115,22,0.85)",
        border: small ? "1.5px solid #f97316" : "none",
        borderRadius: small ? 9999 : 2,
        zIndex: 4,
        pointerEvents: "auto",
      }}
    />
  );
}

/** Floating format bar shown for the selected object. */
function ContextToolbar({
  el,
  onPatch,
  pageFontsCache,
}: {
  el: PdfEditorElement;
  onPatch: (patch: Partial<PdfEditorElement>) => void;
  pageFontsCache: Map<number, { ordinal: number; base: string; isStandard: boolean }[]>;
}) {
  const detected = detectedFontNameFor(el, pageFontsCache);
  const fonts = (
    Object.keys(PDF_EDITOR_FONT_LABELS) as PdfEditorFontId[]
  ).filter((f) => el.source === "extracted" || f !== "original");
  const aligns: PdfEditorAlign[] = ["left", "center", "right"];
  return (
    <div className="sticky top-0 z-20 mb-2 flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white/95 px-3 py-2 shadow-sm backdrop-blur">
      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
        {el.removed ? "Removed" : el.kind}
      </span>
      {el.source === "extracted" && detected && (
        <span className="text-xs text-emerald-700" title={`Detected from the PDF: ${detected}`}>
          {detected}
        </span>
      )}
      <label className={`${labelCls} w-28`} htmlFor="ctx-font">
        Font
        <select
          id="ctx-font"
          value={el.font}
          onChange={(e) => onPatch({ font: e.target.value as PdfEditorFontId })}
          className={inputCls}
        >
          {fonts.map((f) => (
            <option key={f} value={f}>
              {f === "original" && detected
                ? detected
                : PDF_EDITOR_FONT_LABELS[f]}
            </option>
          ))}
        </select>
      </label>
      <label className={`${labelCls} w-16`} htmlFor="ctx-size">
        Size
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() =>
              onPatch({
                fontSize: clamp(Math.round(el.fontSize) - 1, PDF_EDITOR_MIN_FONT_SIZE, PDF_EDITOR_MAX_FONT_SIZE),
              })
            }
            className="flex h-7 w-7 items-center justify-center rounded border border-slate-300 text-sm text-slate-600 hover:bg-slate-50"
          >
            −
          </button>
          <input
            id="ctx-size"
            type="number"
            min={PDF_EDITOR_MIN_FONT_SIZE}
            max={PDF_EDITOR_MAX_FONT_SIZE}
            value={Math.round(el.fontSize)}
            onChange={(e) =>
              onPatch({
                fontSize: clamp(Number(e.target.value) || PDF_EDITOR_MIN_FONT_SIZE, PDF_EDITOR_MIN_FONT_SIZE, PDF_EDITOR_MAX_FONT_SIZE),
              })
            }
            className={`${inputCls} w-14 text-center`}
          />
          <button
            type="button"
            onClick={() =>
              onPatch({
                fontSize: clamp(Math.round(el.fontSize) + 1, PDF_EDITOR_MIN_FONT_SIZE, PDF_EDITOR_MAX_FONT_SIZE),
              })
            }
            className="flex h-7 w-7 items-center justify-center rounded border border-slate-300 text-sm text-slate-600 hover:bg-slate-50"
          >
            +
          </button>
        </div>
      </label>
      <span className="mx-1 flex items-center gap-1">
        {(["bold", "italic", "underline"] as const).map((prop) => (
          <button
            key={prop}
            type="button"
            onClick={() => {
              if (prop === "bold") onPatch({ weight: (el.weight === "bold" ? "normal" : "bold") as PdfEditorWeight });
              else if (prop === "italic") onPatch({ italic: !el.italic });
              else onPatch({ underline: !el.underline });
            }}
            title={prop}
            className={`rounded-md border px-2 py-1 text-xs font-bold ${
              (prop === "bold" && el.weight === "bold") || (prop === "italic" && el.italic) || (prop === "underline" && el.underline)
                ? "border-orange-400 bg-orange-50 text-orange-700"
                : "border-slate-300 text-slate-500 hover:bg-slate-50"
            }`}
          >
            {prop === "bold" ? "B" : prop === "italic" ? "I" : "U"}
          </button>
        ))}
      </span>
      <span className="mx-1 flex items-center gap-1">
        {aligns.map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => onPatch({ align: a })}
            title={a}
            className={`rounded-md border px-2 py-1 text-xs ${
              el.align === a
                ? "border-orange-400 bg-orange-50 text-orange-700"
                : "border-slate-300 text-slate-500 hover:bg-slate-50"
            }`}
          >
            {a === "left" ? "◧" : a === "center" ? "◫" : "◨"}
          </button>
        ))}
      </span>
      <span className="mx-1 flex items-center gap-1">
        <input
          type="color"
          value={el.color}
          onChange={(e) => onPatch({ color: e.target.value })}
          className="h-7 w-7 cursor-pointer rounded border border-slate-300 bg-white p-0.5"
          aria-label="Text color"
          title="Text color"
        />
        {PDF_EDITOR_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onPatch({ color: c })}
            className={`h-4 w-4 rounded-full border ${
              el.color.toLowerCase() === c
                ? "border-orange-500 ring-1 ring-orange-300"
                : "border-slate-200"
            }`}
            style={{ background: c }}
            aria-label={`Use color ${c}`}
            title={`Text color ${c}`}
          />
        ))}
      </span>
    </div>
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
  const detectedFontName = detectedFontNameFor(el, pageFontsCache);
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
            {el.source === "new" && (
              <label className={`${labelCls} mt-2`}>
                Rotation °
                <input
                  type="number"
                  min={0}
                  max={359}
                  step={1}
                  value={Math.round(normalizeDegrees(el.rotation ?? 0))}
                  onChange={(e) =>
                    onPatch({ rotation: normalizeDegrees(Number(e.target.value) || 0) })
                  }
                  className={inputCls}
                />
              </label>
            )}
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
            Drag to move · Handles to resize · pull the knob above new text to rotate · Delete key or
            button to remove. PDFs are static — animation and text effects cannot be exported.
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