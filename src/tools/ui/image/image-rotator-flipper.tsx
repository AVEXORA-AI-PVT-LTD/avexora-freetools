"use client";

import { useEffect, useRef, useState } from "react";
import {
  ImagePicker, canvasToBlob, downloadBlob, inputCls, labelCls, primaryBtn, rotateFlipGeometry, useImageFile,
} from "./image-shared";

/** Cap the live preview's longest side so huge images map down without blowing up memory. */
const PREVIEW_MAX_DIM = 640;

/**
 * Draw the rotate + flip preview onto the canvas using the exact same geometry
 * as `apply()` (shared via `rotateFlipGeometry`), so the preview always matches
 * what gets downloaded. The canvas is scaled down from the real output size
 * purely for display — the download path is untouched.
 */
function drawPreview(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
  angle: number,
  flipH: boolean,
  flipV: boolean,
) {
  const geo = rotateFlipGeometry(image.naturalWidth, image.naturalHeight, angle, flipH, flipV);
  const scale = Math.min(1, PREVIEW_MAX_DIM / Math.max(geo.outW, geo.outH));
  canvas.width = Math.max(1, Math.round(geo.outW * scale));
  canvas.height = Math.max(1, Math.round(geo.outH * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(geo.rad);
  ctx.scale(geo.flipH * scale, geo.flipV * scale);
  ctx.drawImage(image, -geo.srcW / 2, -geo.srcH / 2);
}

export function ImageRotatorFlipper() {
  const { file, image, error, setError, pick } = useImageFile();
  const [rotation, setRotation] = useState("0");
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [busy, setBusy] = useState(false);
  const previewRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (previewRef.current && image) {
      drawPreview(previewRef.current, image, Number(rotation), flipH, flipV);
    }
  }, [image, rotation, flipH, flipV]);

  const apply = async () => {
    if (!file || !image) return;
    setBusy(true);
    setError(null);
    try {
      const angle = Number(rotation);
      const geo = rotateFlipGeometry(image.naturalWidth, image.naturalHeight, angle, flipH, flipV);

      const canvas = document.createElement("canvas");
      canvas.width = geo.outW;
      canvas.height = geo.outH;
      const ctx = canvas.getContext("2d")!;
      ctx.translate(geo.cx, geo.cy);
      ctx.rotate(geo.rad);
      ctx.scale(geo.flipH, geo.flipV);
      ctx.drawImage(image, -geo.srcW / 2, -geo.srcH / 2);

      const type = file.type === "image/png" ? "image/png" : "image/jpeg";
      const blob = await canvasToBlob(canvas, type, 0.92);
      downloadBlob(blob, file.name.replace(/\.\w+$/, "") + "-edited" + (type === "image/png" ? ".png" : ".jpg"));
    } catch {
      setError("Something went wrong while processing this image.");
    } finally {
      setBusy(false);
    }
  };

  const outputDims = image
    ? rotateFlipGeometry(image.naturalWidth, image.naturalHeight, Number(rotation), flipH, flipV)
    : null;

  return (
    <div className="space-y-4">
      <ImagePicker file={file} image={image} onPick={pick} />
      {image && (
        <figure className="overflow-hidden rounded-lg border border-slate-200">
          <div className="flex items-center justify-center bg-slate-50 p-3 sm:p-4">
            <canvas
              ref={previewRef}
              role="img"
              aria-label="Preview of the rotated and flipped result"
              className="block h-auto max-w-full rounded border border-slate-200 bg-white shadow-sm"
            />
          </div>
          <figcaption className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-slate-100 px-3 py-2 text-xs text-slate-500">
            <span className="font-medium text-slate-600">{file?.name}</span>
            {outputDims && (
              <span>
                Output {outputDims.outW} × {outputDims.outH}px — updates live, download matches exactly
              </span>
            )}
          </figcaption>
        </figure>
      )}
      {image && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="rf-rotation" className={labelCls}>Rotate</label>
            <select id="rf-rotation" className={inputCls} value={rotation} onChange={(e) => setRotation(e.target.value)}>
              <option value="0">No rotation</option>
              <option value="90">90° clockwise</option>
              <option value="180">180°</option>
              <option value="270">90° anti-clockwise</option>
            </select>
          </div>
          <label className="flex items-end gap-2 pb-2 text-sm text-slate-700">
            <input type="checkbox" checked={flipH} onChange={(e) => setFlipH(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600" />
            Flip horizontally
          </label>
          <label className="flex items-end gap-2 pb-2 text-sm text-slate-700">
            <input type="checkbox" checked={flipV} onChange={(e) => setFlipV(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600" />
            Flip vertically
          </label>
        </div>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="button" onClick={apply} disabled={!image || busy} className={primaryBtn} data-lead-action="download">
        {busy ? "Applying…" : "Apply & download"}
      </button>
    </div>
  );
}
