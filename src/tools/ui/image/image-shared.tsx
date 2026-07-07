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
