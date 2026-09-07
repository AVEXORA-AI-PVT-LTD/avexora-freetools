"use client";

import { useRef, useState } from "react";
import { ImagePicker, canvasToBlob, computeCropRect, downloadBlob, primaryBtn, useImageFile } from "./image-shared";

export default function ImageCropper() {
  const { file, image, error, setError, pick } = useImageFile();
  const [box, setBox] = useState({ x: 0, y: 0, w: 0, h: 0 });
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const onPick = async (f: File | null) => {
    await pick(f);
    setBox({ x: 0, y: 0, w: 0, h: 0 });
  };

  const toDisplayCoords = (clientX: number, clientY: number) => {
    const rect = imgRef.current!.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(clientX - rect.left, rect.width)),
      y: Math.max(0, Math.min(clientY - rect.top, rect.height)),
    };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    const p = toDisplayCoords(e.clientX, e.clientY);
    setDragStart(p);
    setBox({ x: p.x, y: p.y, w: 0, h: 0 });
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragStart) return;
    const p = toDisplayCoords(e.clientX, e.clientY);
    setBox({
      x: Math.min(dragStart.x, p.x),
      y: Math.min(dragStart.y, p.y),
      w: Math.abs(p.x - dragStart.x),
      h: Math.abs(p.y - dragStart.y),
    });
  };
  const onPointerUp = () => setDragStart(null);

  const crop = async () => {
    if (!file || !image || !imgRef.current || box.w < 2 || box.h < 2) {
      setError("Drag on the image to select a crop area first.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const rect = imgRef.current.getBoundingClientRect();
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
          <div className="relative select-none touch-none bg-slate-50 p-3 sm:p-4"
            onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}>
            <img
              ref={imgRef}
              src={image.src}
              alt="Image to crop — drag across it to choose the area"
              className="block max-w-full rounded border border-slate-200 bg-white shadow-sm"
              draggable={false}
            />
            {box.w > 0 && (
              <div
                className="pointer-events-none absolute border-2 border-indigo-500 bg-indigo-500/20"
                style={{ left: box.x, top: box.y, width: box.w, height: box.h }}
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
