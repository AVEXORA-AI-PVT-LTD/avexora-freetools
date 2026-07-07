"use client";

import { useState } from "react";
import { ImagePicker, canvasToBlob, downloadBlob, inputCls, labelCls, primaryBtn, useImageFile } from "./image-shared";

export function ImageRotatorFlipper() {
  const { file, image, error, setError, pick } = useImageFile();
  const [rotation, setRotation] = useState("0");
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [busy, setBusy] = useState(false);

  const apply = async () => {
    if (!file || !image) return;
    setBusy(true);
    setError(null);
    try {
      const angle = Number(rotation);
      const swapDims = angle === 90 || angle === 270;
      const w = swapDims ? image.naturalHeight : image.naturalWidth;
      const h = swapDims ? image.naturalWidth : image.naturalHeight;

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.translate(w / 2, h / 2);
      ctx.rotate((angle * Math.PI) / 180);
      ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
      ctx.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);

      const type = file.type === "image/png" ? "image/png" : "image/jpeg";
      const blob = await canvasToBlob(canvas, type, 0.92);
      downloadBlob(blob, file.name.replace(/\.\w+$/, "") + "-edited" + (type === "image/png" ? ".png" : ".jpg"));
    } catch {
      setError("Something went wrong while processing this image.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <ImagePicker file={file} image={image} onPick={pick} />
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
