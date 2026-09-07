"use client";

import { useState } from "react";
import {
  ImagePicker, canvasToBlob, downloadBlob, drawToCanvas, imageCompressionType, labelCls, primaryBtn, useImageFile,
} from "./image-shared";

function fmtSize(bytes: number): string {
  return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(2)} MB` : `${Math.round(bytes / 1024)} KB`;
}

export default function ImageCompressor() {
  const { file, image, error, setError, pick } = useImageFile();
  const [quality, setQuality] = useState("80");
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState<string | null>(null);

  const compress = async () => {
    if (!file || !image) return;
    setBusy(true);
    setError(null);
    setReport(null);
    try {
      const canvas = drawToCanvas(image, image.naturalWidth, image.naturalHeight);
      // Preserve PNG alpha by keeping PNG output for PNG sources; do not route a
      // transparent PNG through the alpha-stripping JPEG path (which would
      // flatten it onto a black background). Non-PNG sources keep JPEG.
      const type = imageCompressionType(file.type);
      const blob = await canvasToBlob(canvas, type, Number(quality) / 100);
      const saved = file.size - blob.size;
      setReport(
        `Compressed from ${fmtSize(file.size)} to ${fmtSize(blob.size)}` +
          (saved > 0 ? ` (${Math.round((saved / file.size) * 100)}% smaller).` : "."),
      );
      downloadBlob(blob, file.name.replace(/\.\w+$/, "") + "-compressed" + (type === "image/png" ? ".png" : ".jpg"));
    } catch {
      setError("Something went wrong while compressing this image.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <ImagePicker file={file} image={image} onPick={pick} />
      {image && (
        <div>
          <label htmlFor="ic-quality" className={labelCls}>Quality ({quality}%)</label>
          <input id="ic-quality" type="range" min={10} max={95} className="w-full" value={quality}
            onChange={(e) => setQuality(e.target.value)} />
        </div>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {report && <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{report}</p>}
      <button type="button" onClick={compress} disabled={!image || busy} className={primaryBtn} data-lead-action="download">
        {busy ? "Compressing…" : "Compress & download"}
      </button>
    </div>
  );
}
