"use client";

import { useRef, useState } from "react";

export const inputCls =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none";
export const labelCls = "mb-1 block text-sm font-medium text-slate-700";
export const primaryBtn =
  "rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50";

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
        className="w-full rounded-lg border-2 border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-600 hover:border-indigo-400 hover:text-indigo-600"
      >
        <span className="block text-2xl">🖼️</span>
        {file && image ? (
          <>
            <span className="font-medium text-slate-800">{file.name}</span>
            <span className="block text-xs text-slate-500">{image.naturalWidth} × {image.naturalHeight}px</span>
            <span className="mt-1 block text-xs text-indigo-500">Click to choose a different image</span>
          </>
        ) : (
          <>
            Click to choose an image
            <span className="mt-1 block text-xs text-slate-400">
              Processed in your browser — the image never leaves your device.
            </span>
          </>
        )}
      </button>
    </div>
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
