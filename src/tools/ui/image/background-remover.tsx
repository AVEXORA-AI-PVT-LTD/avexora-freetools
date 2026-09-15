"use client";

import { useState } from "react";
import { downloadBlob, ImagePicker, panelCls, primaryBtn, secondaryBtn, useImageFile } from "./image-shared";

/**
 * Client-side background removal using @imgly/background-removal — an
 * open-source (MIT) ONNX model that runs entirely in the browser via
 * WebAssembly. The model itself (a few MB) is fetched from imgly's CDN the
 * first time the tool runs and cached by the browser after that; the image
 * itself is never uploaded anywhere.
 */

const CHECKER_BG = {
  backgroundImage:
    "linear-gradient(45deg,#e5e7eb 25%,transparent 25%),linear-gradient(-45deg,#e5e7eb 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#e5e7eb 75%),linear-gradient(-45deg,transparent 75%,#e5e7eb 75%)",
  backgroundSize: "16px 16px",
  backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
} as const;

export default function BackgroundRemover() {
  const { file, image, error: pickError, pick } = useImageFile();
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    if (!file) return;
    setBusy(true);
    setError(null);
    setResultUrl(null);
    setResultBlob(null);
    try {
      const { removeBackground } = await import("@imgly/background-removal");
      const blob = await removeBackground(file, {
        progress: (key: string, current: number, total: number) => {
          setProgress(total > 0 ? `${key} — ${Math.round((current / total) * 100)}%` : key);
        },
      });
      setResultBlob(blob);
      setResultUrl(URL.createObjectURL(blob));
    } catch {
      setError("Couldn't process this image — try a different photo (ideally under 10MB).");
    } finally {
      setBusy(false);
      setProgress(null);
    }
  };

  const download = () => {
    if (!resultBlob || !file) return;
    downloadBlob(resultBlob, file.name.replace(/\.[^.]+$/, "") + "-no-bg.png");
  };

  const tryAnother = () => {
    setResultUrl(null);
    setResultBlob(null);
    setError(null);
  };

  return (
    <div className="space-y-4">
      <ImagePicker file={file} image={image} onPick={pick} />
      {(pickError ?? error) && <p className="text-sm text-red-600">{pickError ?? error}</p>}

      {file && !resultUrl && (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void run()}
              disabled={busy}
              className={primaryBtn}
              data-lead-action="download"
            >
              {busy ? (progress ?? "Removing background…") : "Remove background"}
            </button>
          </div>
          {busy && (
            <p className="text-xs text-slate-500">
              First use downloads a small AI model to your browser (a few seconds on a normal
              connection) — after that, this and future images process instantly and entirely on
              your device.
            </p>
          )}
        </div>
      )}

      {resultUrl && (
        <div className="space-y-3">
          <div className={`${panelCls} grid gap-3 p-3 sm:grid-cols-2`}>
            <figure>
              <figcaption className="mb-1 text-xs font-medium text-slate-500">Original</figcaption>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image?.src}
                alt="Original"
                className="h-72 w-full rounded border border-slate-200 object-contain"
              />
            </figure>
            <figure>
              <figcaption className="mb-1 text-xs font-medium text-slate-500">
                Background removed
              </figcaption>
              <div style={CHECKER_BG} className="h-72 w-full rounded border border-slate-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={resultUrl} alt="Background removed" className="h-72 w-full object-contain" />
              </div>
            </figure>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={download} className={primaryBtn}>
              Download PNG
            </button>
            <button type="button" onClick={tryAnother} className={secondaryBtn}>
              Try again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
