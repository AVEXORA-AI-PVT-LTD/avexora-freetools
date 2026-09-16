"use client";

import { useEffect, useState } from "react";
import {
  useAuthDownload,
  useRestoredDownload,
} from "@/components/account/use-auth-download";
import {
  ImagePicker, canvasToBlob, drawToCanvas, inputCls, labelCls, primaryBtn, secondaryBtn, useImageFile,
} from "./image-shared";

export default function ImageResizer() {
  const { downloadOne } = useAuthDownload();
  const { restored } = useRestoredDownload();
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultFilename, setResultFilename] = useState<string>("downloaded_file");
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);

  const { file, image, error, setError, pick } = useImageFile();
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [keepAspect, setKeepAspect] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!restored) return;
    queueMicrotask(() => {
      setResultUrl(URL.createObjectURL(restored.blob));
      setResultFilename(restored.filename);
      setResultBlob(restored.blob);
    });
  }, [restored]);

  const onPick = async (f: File | null) => {
    await pick(f);
    setWidth("");
    setHeight("");
    setResultUrl(null);
    setResultBlob(null);
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
      if (!blob) throw new Error("Export failed");
      setResultUrl(URL.createObjectURL(blob));
      setResultBlob(blob);
      setResultFilename(file.name.replace(/\.\w+$/, "") + `-${w}x${h}` + (type === "image/png" ? ".png" : ".jpg"));
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
              className="h-4 w-4 rounded border-slate-300 text-orange-700" />
            Lock aspect ratio
          </label>
        </div>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      
      <button
        type="button"
        disabled={busy || !image}
        onClick={resize}
        className={primaryBtn}
      >
        {busy ? "Processing..." : "Resize Image"}
      </button>

      {resultUrl && resultBlob && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void downloadOne(resultBlob, resultFilename)}
            className={primaryBtn}
            data-lead-action="download"
          >
            Download Resized Image
          </button>
          <button
            type="button"
            onClick={() => onPick(null)}
            className={secondaryBtn}
          >
            Start over
          </button>
        </div>
        </div>
      )}
    </div>
  );
}
