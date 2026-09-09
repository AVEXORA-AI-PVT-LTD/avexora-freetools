"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePicker, canvasToBlob, downloadBlob, primaryBtn, useImageFile } from "./image-shared";
import {
  clientToImagePoint,
  computeCropRect,
  cropBoxFromPoints,
  cropOverlayBox,
  type CropBox,
  type Rect,
} from "@/tools/compute/image/crop-coords";

export default function ImageCropper() {
  const { file, image, error, setError, pick } = useImageFile();
  const [box, setBox] = useState<CropBox>({ x: 0, y: 0, w: 0, h: 0 });
  const [overlay, setOverlay] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRectRef = useRef<Rect | null>(null);
  const containerRectRef = useRef<Rect | null>(null);

  const captureRects = () => {
    if (!imgRef.current || !containerRef.current) return;
    imageRectRef.current = imgRef.current.getBoundingClientRect();
    containerRectRef.current = containerRef.current.getBoundingClientRect();
  };

  useEffect(() => {
    window.addEventListener("resize", captureRects);
    window.addEventListener("orientationchange", captureRects);
    return () => {
      window.removeEventListener("resize", captureRects);
      window.removeEventListener("orientationchange", captureRects);
    };
  }, []);

  const applyBox = (b: CropBox) => {
    setBox(b);
    if (b.w > 0 && b.h > 0 && imageRectRef.current && containerRectRef.current) {
      setOverlay(cropOverlayBox(b, imageRectRef.current, containerRectRef.current));
    } else {
      setOverlay(null);
    }
  };

  const onPick = async (f: File | null) => {
    await pick(f);
    setDragStart(null);
    applyBox({ x: 0, y: 0, w: 0, h: 0 });
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    captureRects();
    if (!imageRectRef.current) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Pointer already released; the drag simply won't capture.
    }
    const p = clientToImagePoint(e.clientX, e.clientY, imageRectRef.current);
    setDragStart(p);
    applyBox({ x: p.x, y: p.y, w: 0, h: 0 });
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStart || !imageRectRef.current) return;
    const p = clientToImagePoint(e.clientX, e.clientY, imageRectRef.current);
    applyBox(cropBoxFromPoints(dragStart, p));
  };

  const onPointerEnd = () => setDragStart(null);

  const crop = async () => {
    if (!file || !image || box.w < 2 || box.h < 2) {
      setError("Drag on the image to select a crop area first.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const rect = imageRectRef.current ?? imgRef.current?.getBoundingClientRect();
      if (!rect) {
        setError("The image could not be measured. Please reselect the crop area.");
        return;
      }
      const cropRect = computeCropRect(box, rect, image.naturalWidth, image.naturalHeight);
      if (!cropRect) {
        setError("The selected crop area is too small. Please select a larger area.");
        return;
      }

      const canvas = document.createElement("canvas");
      canvas.width = cropRect.outW;
      canvas.height = cropRect.outH;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(image, cropRect.sx, cropRect.sy, cropRect.outW, cropRect.outH, 0, 0, cropRect.outW, cropRect.outH);

      const type = file.type === "image/png" ? "image/png" : "image/jpeg";
      const blob = await canvasToBlob(canvas, type, 0.92);
      downloadBlob(blob, file.name.replace(/\.\w+$/, "") + "-cropped" + (type === "image/png" ? ".png" : ".jpg"));
    } catch {
      setError("Something went wrong while cropping this image.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <ImagePicker file={file} image={image} onPick={onPick} />
      {image && (
        <figure className="overflow-hidden rounded-lg border border-slate-200">
          <div
            ref={containerRef}
            className="relative select-none touch-none bg-slate-50 p-3 sm:p-4"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerEnd}
            onPointerCancel={onPointerEnd}
          >
            <img
              ref={imgRef}
              src={image.src}
              alt="Image to crop — drag across it to choose the area"
              className="block max-w-full rounded border border-slate-200 bg-white shadow-sm"
              draggable={false}
            />
            {overlay && (
              <div
                className="pointer-events-none absolute border-2 border-orange-500 bg-orange-500/20"
                style={{ left: overlay.left, top: overlay.top, width: overlay.width, height: overlay.height }}
              />
            )}
          </div>
          <figcaption
            className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-slate-100 px-3 py-2 text-xs text-slate-500"
            data-testid="crop-selection"
          >
            <span className="font-medium text-slate-600">{file?.name}</span>
            {box.w >= 2 && box.h >= 2 ? (
              <span>
                Selected {Math.round(box.w)} × {Math.round(box.h)}px — Crop &amp; download below
              </span>
            ) : (
              <span>Drag across the image to select the area to crop</span>
            )}
          </figcaption>
        </figure>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="button" onClick={crop} disabled={!image || busy} className={primaryBtn} data-lead-action="download">
        {busy ? "Cropping…" : "Crop & download"}
      </button>
    </div>
  );
}