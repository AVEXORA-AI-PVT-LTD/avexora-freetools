"use client";

import { useRef, useState } from "react";
import { zipSync } from "fflate";

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

/**
 * Choose the output type for browser-canvas compression/processing.
 *
 * PNG sources keep PNG output: PNG is lossless and supports an alpha channel,
 * whereas an alpha-less format (e.g. JPEG) would flatten a transparent image
 * onto an opaque black background. Non-PNG sources keep the JPEG path so the
 * existing compression behaviour is unchanged for images without transparency.
 */
export function imageCompressionType(fileType: string): "image/png" | "image/jpeg" {
  return fileType === "image/png" ? "image/png" : "image/jpeg";
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

export interface CropBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface CropRect {
  sx: number;
  sy: number;
  outW: number;
  outH: number;
}

/**
 * Convert a display-space crop selection to a valid natural-image-space crop
 * rectangle, safe to pass to `drawImage`.
 *
 * The selection box is expressed in displayed/rendered image coordinates and
 * `rect` is the displayed image size. This converts to the source image's
 * natural pixel space and then CLAMPS the source rectangle to the natural image
 * bounds, so the source rectangle never extends past the image edge (which
 * would make `drawImage` clip the source and leave a blank/transparent strip at
 * the boundary).
 *
 * Returns `null` when the crop would have non-positive width/height so callers
 * can show a validation message instead of generating a blank canvas.
 */
export function computeCropRect(
  box: CropBox,
  rect: { width: number; height: number },
  naturalWidth: number,
  naturalHeight: number,
): CropRect | null {
  if (naturalWidth <= 0 || naturalHeight <= 0 || rect.width <= 0 || rect.height <= 0) return null;

  const scaleX = naturalWidth / rect.width;
  const scaleY = naturalHeight / rect.height;

  const sx = Math.max(0, Math.floor(box.x * scaleX));
  const sy = Math.max(0, Math.floor(box.y * scaleY));

  const sw = Math.min(box.w * scaleX, naturalWidth - sx);
  const sh = Math.min(box.h * scaleY, naturalHeight - sy);

  if (sw <= 0 || sh <= 0) return null;

  const outW = Math.max(1, Math.floor(sw));
  const outH = Math.max(1, Math.floor(sh));

  return { sx, sy, outW, outH };
}

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
        className="grid w-full gap-1.5 rounded-lg border-2 border-dashed border-slate-300 px-4 py-5 text-center text-sm text-slate-600 transition hover:border-orange-400 hover:bg-orange-50/40 hover:text-orange-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
      >
        <span aria-hidden="true" className="text-xl leading-none">🖼️</span>
        {file && image ? (
          <>
            <span className="truncate font-medium text-slate-800">{file.name}</span>
            <span className="text-xs text-slate-500">
              {image.naturalWidth} × {image.naturalHeight}px · click to change
            </span>
          </>
        ) : (
          <>
            <span className="font-medium text-slate-700">Click to choose an image</span>
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
