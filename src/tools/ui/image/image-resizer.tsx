"use client";

import { useState } from "react";
import {
  ImagePicker, canvasToBlob, downloadBlob, drawToCanvas, inputCls, labelCls, primaryBtn, useImageFile,
} from "./image-shared";

export default function ImageResizer() {
  const { file, image, error, setError, pick } = useImageFile();
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [keepAspect, setKeepAspect] = useState(true);
  const [busy, setBusy] = useState(false);

  const onPick = async (f: File | null) => {
    await pick(f);
    setWidth("");
    setHeight("");
  };

  const setImageDefaults = (img: HTMLImageElement | null) => {
    if (img && width === "" && height === "") {
      setWidth(String(img.naturalWidth));
      setHeight(String(img.naturalHeight));
    }
  };
  setImageDefaults(image);

  const aspect = image ? image.naturalWidth / image.naturalHeight : 1;

  const onWidthChange = (v: string) => {
    setWidth(v);
    if (keepAspect && v !== "") setHeight(String(Math.round(Number(v) / aspect)));
  };
  const onHeightChange = (v: string) => {
    setHeight(v);
    if (keepAspect && v !== "") setWidth(String(Math.round(Number(v) * aspect)));
  };

  const resize = async () => {
    if (!file || !image) return;
    const w = Number(width);
    const h = Number(height);
    if (!Number.isInteger(w) || !Number.isInteger(h) || w < 1 || h < 1) {
      setError("Enter valid width and height in pixels.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const canvas = drawToCanvas(image, w, h);
      const type = file.type === "image/png" ? "image/png" : "image/jpeg";
      const blob = await canvasToBlob(canvas, type, 0.92);
      downloadBlob(blob, file.name.replace(/\.\w+$/, "") + `-${w}x${h}` + (type === "image/png" ? ".png" : ".jpg"));
    } catch {
      setError("Something went wrong while resizing this image.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <ImagePicker file={file} image={image} onPick={onPick} />
      {image && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="ir-width" className={labelCls}>Width (px)</label>
            <input id="ir-width" type="number" min={1} className={inputCls} value={width}
              onChange={(e) => onWidthChange(e.target.value)} />
          </div>
          <div>
            <label htmlFor="ir-height" className={labelCls}>Height (px)</label>
            <input id="ir-height" type="number" min={1} className={inputCls} value={height}
              onChange={(e) => onHeightChange(e.target.value)} />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700 sm:col-span-2">
            <input type="checkbox" checked={keepAspect} onChange={(e) => setKeepAspect(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600" />
            Lock aspect ratio
          </label>
        </div>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="button" onClick={resize} disabled={!image || busy} className={primaryBtn} data-lead-action="download">
        {busy ? "Resizing…" : "Resize & download"}
      </button>
    </div>
  );
}
