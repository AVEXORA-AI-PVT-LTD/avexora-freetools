"use client";

import { useRef, useState } from "react";
import {
  ImagePicker,
  canvasToBlob,
  drawToCanvas,
  labelCls,
  primaryBtn,
  secondaryBtn,
  useImageFile,
} from "./image-shared";
import {
  BG_REMOVAL_SEG_EDGE,
  applyMaskAlpha,
  encodeTransparentPng,
  existingTransparencyRatio,
  inputFormatError,
  safeOutputDims,
} from "@/tools/compute/image/background-removal";
import { releaseBgSegmentationSession, predictBgMask } from "@/tools/compute/image/bg-removal-engine";
import { useAuthDownload, useRestoredDownload } from "@/components/account/use-auth-download";
import { RestoredDownload } from "@/components/account/restored-download";

/** Checkerboard shown behind the transparent result — preview only, never baked in. */
const CHECKERBOARD = {
  backgroundColor: "#ffffff",
  backgroundImage:
    "conic-gradient(#dbe3ec 25%, #ffffff 0 50%, #dbe3ec 0 75%, #ffffff 0)",
  backgroundSize: "16px 16px",
} as const;

export interface RemovalResult {
  url: string;
  pngBlob: Blob;
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  scaled: boolean;
  transparentPixels: number;
}

function fmtMegapixels(w: number, h: number): string {
  const mp = (w * h) / 1_000_000;
  return mp >= 0.95 ? `${mp.toFixed(1)} MP` : `${Math.round(w * h).toLocaleString()} px`;
}

/** True when the browser's canvas encoder can write WebP. */
function webpEncoderAvailable(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL("image/webp").indexOf("data:image/webp") === 0;
  } catch {
    return false;
  }
}

export default function ImageBackgroundRemover() {
  const { file, image, error, setError, pick } = useImageFile();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<RemovalResult | null>(null);
  const [outputFormat, setOutputFormat] = useState<"png" | "webp">("png");
  const [notice, setNotice] = useState<string | null>(null);
  const [webpSupported] = useState(() => webpEncoderAvailable());
  const statusRef = useRef<HTMLParagraphElement>(null);
  const { downloadOne } = useAuthDownload();
  const { restored } = useRestoredDownload();

  const removeBackground = async () => {
    if (!file || !image || busy) return;
    setError(null);
    setNotice(null);

    const magic = new Uint8Array(await file.slice(0, 32).arrayBuffer());
    const reject = inputFormatError(file.name, file.type, file.size, magic);
    if (reject) {
      setError(reject);
      return;
    }

    setBusy(true);
    try {
      const dims = safeOutputDims(image.naturalWidth, image.naturalHeight);
      const canvas = drawToCanvas(image, dims.width, dims.height);
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("canvas unavailable");
      const sampled = ctx.getImageData(0, 0, dims.width, dims.height).data;
      // Copy into a plain ArrayBuffer-backed view (ImageData/Blob need one).
      const rgba = new Uint8Array(sampled.length);
      rgba.set(sampled);

      // The model runs client-side; the ~44 MB ONNX model and WASM runtime are
      // fetched once and cached for the whole session.
      const mask = await predictBgMask(rgba, dims.width, dims.height);
      const composited = applyMaskAlpha(
        rgba,
        mask,
        BG_REMOVAL_SEG_EDGE,
        BG_REMOVAL_SEG_EDGE,
        dims.width,
        dims.height,
      );
      // Fresh ArrayBuffer-backed view (ImageData below requires one).
      const outRgba = new Uint8Array(composited.length);
      outRgba.set(composited);

      const resultCanvas = document.createElement("canvas");
      resultCanvas.width = dims.width;
      resultCanvas.height = dims.height;
      const rctx = resultCanvas.getContext("2d");
      if (!rctx) throw new Error("canvas unavailable");
      rctx.putImageData(
        new ImageData(
          new Uint8ClampedArray(outRgba.buffer, outRgba.byteOffset, outRgba.byteLength),
          dims.width,
          dims.height,
        ),
        0,
        0,
      );

      const encoded = encodeTransparentPng(outRgba, dims.width, dims.height);
      const png = new Uint8Array(encoded.length);
      png.set(encoded);
      const pngBlob = new Blob([png], { type: "image/png" });
      const url = URL.createObjectURL(pngBlob);

      const transparentCount = Math.round(
        existingTransparencyRatio(outRgba, dims.width, dims.height) * dims.width * dims.height,
      );

      setResult((prev) => {
        if (prev) URL.revokeObjectURL(prev.url);
        return {
          url,
          pngBlob,
          canvas: resultCanvas,
          width: dims.width,
          height: dims.height,
          scaled: dims.scaled,
          transparentPixels: transparentCount,
        };
      });

      if (transparentCount < Math.max(4, Math.round(dims.width * dims.height * 0.001))) {
        setNotice(
          "Not much background was detected, so the output may look almost identical to the input. The download below is still a genuine PNG/WebP with a real alpha channel.",
        );
      }
      if (dims.scaled) {
        setNotice(
          (n) => `${n ? n + " " : ""}The original is too large to process safely in-browser, so the output was scaled down to ${fmtMegapixels(dims.width, dims.height)}.`,
        );
      }
    } catch (err) {
      console.error(err);
      setError(
        "Background removal failed — this can happen with very large images or older browsers. Please try again, or pick a smaller image.",
      );
    } finally {
      setBusy(false);
    }
  };

  const download = async () => {
    if (!result || !file) return;
    setError(null);
    const base = file.name.replace(/\.\w+$/, "");
    try {
      if (outputFormat === "webp") {
        const blob = await canvasToBlob(result.canvas, "image/webp", 1);
        downloadOne(blob, `${base}-removed-bg.webp`);
      } else {
        downloadOne(result.pngBlob, `${base}-removed-bg.png`);
      }
    } catch {
      setError("The download could not be generated in this browser.");
    }
  };

  const reset = () => {
    pick(null);
    setResult((prev) => {
      if (prev) URL.revokeObjectURL(prev.url);
      return null;
    });
    setOutputFormat("png");
    setNotice(null);
    releaseBgSegmentationSession();
  };

  const handlePick = (f: File | null) => {
    pick(f);
    if (f) setNotice(null);
    setResult((prev) => {
      if (prev && f) {
        URL.revokeObjectURL(prev.url);
        return null;
      }
      return prev;
    });
  };

  return (
    <div className="space-y-4">
      <RestoredDownload restored={restored} />
      <ImagePicker file={file} image={image} onPick={handlePick} />

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      {notice && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">{notice}</p>}

      {busy && (
        <p ref={statusRef} aria-live="polite" className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
          Removing background… the AI model runs on your device, so this can take a few
          seconds on large images.
        </p>
      )}

      {!busy && !result && image && (
        <button
          type="button"
          onClick={removeBackground}
          disabled={busy}
          className={primaryBtn}
          data-lead-action="remove-background"
        >
          Remove background
        </button>
      )}

      {result && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <figure className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
              <div className="flex items-center justify-center p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image?.src}
                  alt="Original image"
                  draggable={false}
                  className="h-auto max-h-80 w-auto max-w-full rounded object-contain"
                />
              </div>
              <figcaption className="border-t border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600">
                Original
              </figcaption>
            </figure>

            <figure className="overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
              <div className="flex items-center justify-center p-2" style={CHECKERBOARD}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={result.url}
                  alt="Image with background removed"
                  draggable={false}
                  className="h-auto max-h-80 w-auto max-w-full rounded object-contain"
                />
              </div>
              <figcaption className="border-t border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600">
                Background removed · {result.width} × {result.height}px
              </figcaption>
            </figure>
          </div>

          <div>
            <span className={labelCls} id="bg-remover-format-label" data-testid="format-label">
              Download format
            </span>
            <div
              role="radiogroup"
              aria-labelledby="bg-remover-format-label"
              className="flex gap-3 text-sm"
            >
              <label className="flex items-center gap-1.5">
                <input
                  type="radio"
                  name="output-format"
                  value="png"
                  checked={outputFormat === "png"}
                  onChange={() => setOutputFormat("png")}
                />
                PNG (lossless, true transparency)
              </label>
              <label className="flex items-center gap-1.5">
                <input
                  type="radio"
                  name="output-format"
                  value="webp"
                  checked={outputFormat === "webp"}
                  onChange={() => setOutputFormat("webp")}
                  disabled={!webpSupported}
                />
                WebP
                {!webpSupported && <span className="text-xs text-slate-400">(not supported here)</span>}
              </label>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={download}
              disabled={busy}
              className={primaryBtn}
              data-lead-action="download"
            >
              Download {outputFormat === "png" ? "PNG" : "WebP"}
            </button>
            <button type="button" onClick={reset} className={secondaryBtn}>
              Start over
            </button>
          </div>
        </div>
      )}
    </div>
  );
}