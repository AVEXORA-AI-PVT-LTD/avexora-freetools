"use client";

import { useRef, useState } from "react";
import { zipSync } from "fflate";
import UPNG from "@pdf-lib/upng";
import { useFileDrop } from "../use-file-drop";

export { inputCls, labelCls, primaryBtn, secondaryBtn, iconBtn, panelCls } from "../ui-tokens";

/**
 * Loads a File into an <img>. The object URL is intentionally left un-revoked
 * so callers can keep reusing `image.src` (e.g. re-rendering it in a new
 * <img> tag for cropping); the browser releases it when the tab closes.
 */
export function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("invalid image"));
    img.src = url;
  });
}

export function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))), type, quality);
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Build an in-memory ZIP archive from raw file contents.
 *
 * Uses the `fflate` library (minimal, dependency-free, works in the browser and
 * Node). Entries are stored with `level: 0` (no re-compression) because the
 * typical contents (PNG/ICO images) are already compressed; this keeps the
 * pack/unpack fast and lossless.
 */
export function buildZip(files: Record<string, Uint8Array>): Uint8Array {
  return zipSync(files, { level: 0 });
}

/**
 * Package a list of `{ name, blob }` entries into ONE ZIP and trigger a single
 * browser download. Any entry missing a valid name or content is skipped so the
 * archive never contains undefined/null/empty entries.
 *
 * This avoids triggering many independent browser downloads (which browsers may
 * block as pop-up downloads). Callers generate every asset first, then call this
 * once to produce a single `application/zip` download.
 */
export async function downloadZip(
  zipName: string,
  entries: Array<{ name: string; blob: Blob }>,
): Promise<void> {
  const files: Record<string, Uint8Array> = {};
  for (const entry of entries) {
    if (!entry.name || !entry.blob) continue;
    files[entry.name] = new Uint8Array(await entry.blob.arrayBuffer());
  }
  const zipped = buildZip(files);
  // `zipSync` returns a view over an ArrayBufferLike; copy into a plain
  // ArrayBuffer-backed Uint8Array so it is a valid BlobPart under TS.
  const zippedCopy = new Uint8Array(zipped.length);
  zippedCopy.set(zipped);
  downloadBlob(new Blob([zippedCopy], { type: "application/zip" }), zipName);
}

export type ImageMime = "image/png" | "image/jpeg" | "image/webp";

/**
 * Resolve the output format for the compressor. The image format is the source
 * of truth: PNG → PNG, JPEG → JPEG, WebP → WebP. The compressor reduces size by
 * changing encoding/compression parameters ONLY, never the format. Formats the
 * browser canvas/UPNG cannot re-encode in kind (GIF, BMP, AVIF, TIFF, …) are
 * not supported by this compressor and return `null` so the caller can show a
 * clear message instead of silently converting.
 */
export function imageCompressionType(fileType: string): ImageMime | null {
  if (fileType === "image/png") return "image/png";
  if (fileType === "image/jpeg" || fileType === "image/jpg") return "image/jpeg";
  if (fileType === "image/webp") return "image/webp";
  return null;
}

export interface CompressionCandidate {
  type: ImageMime;
  quality: number;
}

/**
 * Generate the bounded list of encoding candidates for an image source —
 * STRICTLY within the original format. No cross-format fallback exists:
 *
 *   PNG   → [PNG q]
 *   JPEG  → [JPEG q, JPEG q-15, …, JPEG floor]
 *   WebP  → [WebP q, WebP q-15, …, WebP floor]
 *   other → []  (unsupported; caller shows an error)
 *
 * The output format is always the source format; only the encoder quality is
 * varied to find a genuinely smaller result. PNG is handled separately by the
 * UPNG-based encoder (browser canvas PNG re-encode is unreliable), so the PNG
 * candidate is a marker the compressor routes to that path.
 */
export function compressionCandidates(
  fileType: string,
  requestedQuality: number,
): CompressionCandidate[] {
  const type = imageCompressionType(fileType);
  if (!type) return [];
  const q = Math.min(95, Math.max(10, Math.round(requestedQuality)));

  if (type === "image/png") {
    return [{ type: "image/png", quality: q }];
  }

  const step = 15;
  const floor = 30;
  const candidates: CompressionCandidate[] = [{ type, quality: q }];
  for (let s = q - step; s >= floor; s -= step) {
    candidates.push({ type, quality: s });
  }
  return candidates;
}

export interface EncodedPnGCandidate {
  blob: Blob;
  /** Nominal quality label: 100 = lossless; 256/64/32/16 = palette colour count. */
  quality: number;
}

function pngBlob(encoded: ArrayBuffer): Blob {
  return new Blob([new Uint8Array(encoded)], { type: "image/png" });
}

/**
 * Encode a canvas to genuine PNG candidates using UPNG.js.
 *
 * The browser's own canvas PNG encoder re-serialises decoded RGBA and USUALLY
 * re-inflates already-optimised PNGs (983 KB → 1.60 MB). UPNG.js re-encodes
 * the decoded RGBA in-process:
 *   1. lossless (best DEFLATE of the raw pixels), and
 *   2. alpha-preserving palette-quantised encodes (256 → 16 colours), which are
 *      real, smaller PNGs while every pixel keeps its alpha channel — fully
 *      transparent pixels are encoded as invisible (alpha 0) so no white/black
 *      background can appear.
 *
 * Every returned Blob is `image/png`; dimensions are untouched (the canvas size
 * is used as-is).
 */
export function encodePngCandidates(canvas: HTMLCanvasElement): EncodedPnGCandidate[] {
  const ctx = canvas.getContext("2d");
  if (!ctx) return [];
  const w = canvas.width;
  const h = canvas.height;
  if (w <= 0 || h <= 0) return [];
  let buffer: ArrayBuffer;
  try {
    buffer = ctx.getImageData(0, 0, w, h).data.buffer as ArrayBuffer;
  } catch {
    return [];
  }
  const candidates: EncodedPnGCandidate[] = [];
  const push = (cnum: number) => {
    try {
      candidates.push({ blob: pngBlob(UPNG.encode([buffer], w, h, cnum)), quality: cnum });
    } catch {
      // A pathological palette size can throw; skip it (bounded set remains).
    }
  };
  push(0); // lossless
  for (const colors of [256, 64, 32, 16]) push(colors);
  return candidates;
}

export interface RotateFlipGeometry {
  srcW: number;
  srcH: number;
  outW: number;
  outH: number;
  cx: number;
  cy: number;
  rad: number;
  cos: number;
  sin: number;
  flipH: number;
  flipV: number;
}

/**
 * Compute the geometry for rotate + horizontal/vertical flip.
 *
 * This is the single source of truth for the transformation model used by the
 * Image Rotator & Flipper. All values are derived mathematically from the
 * actual source dimensions (no hard-coded offsets), so it works for arbitrary
 * image sizes.
 *
 * Output dimensions are the bounding box of the source rotated by `angle`
 * degrees. For axis-aligned 90°-step angles this equals swapping width/height
 * for 90°/270° and keeping them for 0°/180°.
 *
 * The caller draws the source centered at the output canvas center:
 *   translate(cx, cy)  rotate(rad)  scale(flipH, flipV)  drawImage(-srcW/2, -srcH/2)
 */
export function rotateFlipGeometry(
  srcW: number,
  srcH: number,
  angle: number,
  flipH: boolean,
  flipV: boolean,
): RotateFlipGeometry {
  const rad = (((angle % 360) + 360) % 360) * (Math.PI / 180);
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const outW = Math.abs(Math.round(srcW * cos + srcH * sin));
  const outH = Math.abs(Math.round(srcW * sin + srcH * cos));
  return {
    srcW,
    srcH,
    outW,
    outH,
    cx: outW / 2,
    cy: outH / 2,
    rad,
    cos,
    sin,
    flipH: flipH ? -1 : 1,
    flipV: flipV ? -1 : 1,
  };
}

export { computeCropRect } from "@/tools/compute/image/crop-coords";
export type { CropBox, CropRect } from "@/tools/compute/image/crop-coords";

export function useImageFile() {
  const [file, setFile] = useState<File | null>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pick = async (f: File | null) => {
    setError(null);
    setImage(null);
    setFile(f);
    if (!f) return;
    try {
      setImage(await loadImage(f));
    } catch {
      setError("This file could not be read as an image.");
      setFile(null);
    }
  };

  return { file, image, error, setError, pick };
}

export function ImagePicker({
  file,
  image,
  onPick,
  accept = "image/*",
}: {
  file: File | null;
  image: HTMLImageElement | null;
  onPick: (file: File | null) => void;
  accept?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { isDragging, dragHandlers } = useFileDrop((files) => onPick(files[0] ?? null));
  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          onPick(e.target.files?.[0] ?? null);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        {...dragHandlers}
        className={`grid w-full gap-1.5 rounded-lg border-2 border-dashed px-4 py-5 text-center text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 ${
          isDragging
            ? "border-orange-500 bg-orange-50/60 text-orange-800"
            : "border-slate-300 text-slate-600 hover:border-orange-400 hover:bg-orange-50/40 hover:text-orange-800"
        }`}
      >
        <span aria-hidden="true" className="text-xl leading-none">🖼️</span>
        {file && image ? (
          <>
            <span className="truncate font-medium text-slate-800">{file.name}</span>
            <span className="text-xs text-slate-500">
              {image.naturalWidth} × {image.naturalHeight}px · click or drop to change
            </span>
          </>
        ) : (
          <>
            <span className="font-medium text-slate-700">
              {isDragging ? "Drop your image here" : "Click or drag an image here"}
            </span>
            <span className="text-xs text-slate-400">
              Processed in your browser — the image never leaves your device.
            </span>
          </>
        )}
      </button>
    </div>
  );
}

/**
 * Polished preview frame for tools where seeing the image matters (rotator,
 * cropper, colour picker). Contains the image without stretching or cropping,
 * plus a slim metadata footer (filename + pixel dimensions) so the preview
 * reads like an application component rather than a bare `<img>`.
 */
export function ImagePreview({
  image,
  file,
  alt = "Image preview",
}: {
  image: HTMLImageElement | null;
  file: File | null;
  alt?: string;
}) {
  if (!image) return null;
  return (
    <figure className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
      <div className="flex items-center justify-center p-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image.src}
          alt={alt}
          draggable={false}
          className="h-auto max-h-80 w-auto max-w-full rounded object-contain"
        />
      </div>
      {file && (
        <figcaption className="flex items-center justify-between gap-3 border-t border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-500">
          <span className="min-w-0 truncate font-medium text-slate-700">{file.name}</span>
          <span className="shrink-0 tabular-nums">
            {image.naturalWidth} × {image.naturalHeight}px
          </span>
        </figcaption>
      )}
    </figure>
  );
}

export function drawToCanvas(image: HTMLImageElement, width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(image, 0, 0, width, height);
  return canvas;
}
