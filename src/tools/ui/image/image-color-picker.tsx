"use client";

import { useRef, useState } from "react";
import { drawToCanvas, ImagePicker, useImageFile } from "./image-shared";

interface Picked {
  hex: string;
  rgb: string;
}

export function ImageColorPicker() {
  const { file, image, error, pick } = useImageFile();
  const [picked, setPicked] = useState<Picked | null>(null);
  const [copied, setCopied] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const onPick = async (f: File | null) => {
    await pick(f);
    setPicked(null);
  };

  const sampleAt = (clientX: number, clientY: number) => {
    if (!image || !imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const xRatio = (clientX - rect.left) / rect.width;
    const yRatio = (clientY - rect.top) / rect.height;
    const canvas = drawToCanvas(image, image.naturalWidth, image.naturalHeight);
    const ctx = canvas.getContext("2d")!;
    const x = Math.min(image.naturalWidth - 1, Math.max(0, Math.round(xRatio * image.naturalWidth)));
    const y = Math.min(image.naturalHeight - 1, Math.max(0, Math.round(yRatio * image.naturalHeight)));
    const [r, g, b] = ctx.getImageData(x, y, 1, 1).data;
    const hex = `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
    setPicked({ hex, rgb: `rgb(${r}, ${g}, ${b})` });
  };

  return (
    <div className="space-y-4">
      <ImagePicker file={file} image={image} onPick={onPick} />
      {image && (
        <figure className="overflow-hidden rounded-lg border border-slate-200">
          <div className="flex items-center justify-center bg-slate-50 p-3 sm:p-4">
            <img
              ref={imgRef}
              src={image.src}
              alt="Image to sample colours from — click to pick"
              role="img"
              onClick={(e) => sampleAt(e.clientX, e.clientY)}
              className="max-h-80 max-w-full cursor-crosshair rounded border border-slate-200 bg-white object-contain shadow-sm"
              draggable={false}
            />
          </div>
          <figcaption className="border-t border-slate-100 px-3 py-2 text-xs text-slate-500">
            Click any pixel to sample its colour — the value appears below.
          </figcaption>
        </figure>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {picked && (
        <div className="flex items-center gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <span className="h-12 w-12 shrink-0 rounded-md border border-slate-300" style={{ backgroundColor: picked.hex }} />
          <div className="text-sm">
            <p className="font-mono font-semibold text-slate-900">{picked.hex}</p>
            <p className="font-mono text-slate-600">{picked.rgb}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(picked.hex).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              });
            }}
            className="ml-auto text-sm font-medium text-indigo-600 hover:text-indigo-800"
          >
            {copied ? "Copied ✓" : "Copy hex"}
          </button>
        </div>
      )}
    </div>
  );
}
