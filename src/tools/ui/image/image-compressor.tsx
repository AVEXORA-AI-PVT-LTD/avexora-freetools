"use client";

import { useEffect, useState } from "react";
import {
  useAuthDownload,
  useRestoredDownload,
} from "@/components/account/use-auth-download";
import {
  ImagePicker, canvasToBlob, compressionCandidates, drawToCanvas,
  encodePngCandidates, imageCompressionType, labelCls, primaryBtn, secondaryBtn, useImageFile,
} from "./image-shared";

function fmtSize(bytes: number): string {
  return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(2)} MB` : `${Math.round(bytes / 1024)} KB`;
}

function outputExt(name: string, type: string): string {
  const inputExt = name.split(".").pop()?.toLowerCase() ?? "";
  const mimeExt = type === "image/png" ? "png" : type === "image/webp" ? "webp" : "jpg";
  // Keep the user's own extension when it already matches the output format
  // (so photo.jpeg → photo-compressed.jpeg, photo.jpg → photo-compressed.jpg);
  // otherwise fall back to the MIME-correct extension.
  if (type === "image/jpeg" && (inputExt === "jpg" || inputExt === "jpeg")) {
    return "." + inputExt;
  }
  return "." + mimeExt;
}

export function outputName(name: string, type: string): string {
  return name.replace(/\.\w+$/, "") + "-compressed" + outputExt(name, type);
}

export default function ImageCompressor() {
  const { downloadOne } = useAuthDownload();
  const { restored } = useRestoredDownload();
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultFilename, setResultFilename] = useState<string>("downloaded_file");
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);

  const { file, image, error, setError, pick } = useImageFile();
  const [quality, setQuality] = useState("80");
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [reportKind, setReportKind] = useState<"success" | "notice">("success");

  useEffect(() => {
    if (!restored) return;
    queueMicrotask(() => {
      setResultUrl(URL.createObjectURL(restored.blob));
      setResultFilename(restored.filename);
      setResultBlob(restored.blob);
      setReportKind("success");
      setReport("Your compressed image is ready — sign in to download.");
    });
  }, [restored]);

  const compress = async () => {
    if (!file || !image) return;
    setBusy(true);
    setError(null);
    setReport(null);
    try {
      const original = file.size;
      // The original file type is the single source of truth for the output
      // format. PNG → PNG, JPEG → JPEG, WebP → WebP — never converted.
      const type = imageCompressionType(file.type);
      if (!type) {
        setError("This image format cannot be compressed without changing its type.");
        return;
      }

      const canvas = drawToCanvas(image, image.naturalWidth, image.naturalHeight);
      const requested = Math.min(95, Math.max(10, Math.round(Number(quality))));

      let bestBlob: Blob | null = null;

      if (type === "image/png") {
        // PNG path: UPNG.js re-encodes the decoded RGBA as real PNGs (lossless
        // plus alpha-preserving palette-quantised variants). Each stays PNG and
        // keeps the alpha channel; pick the smallest that beats the original.
        for (const candidate of encodePngCandidates(canvas)) {
          if (candidate.blob.size < original && (!bestBlob || candidate.blob.size < bestBlob.size)) {
            bestBlob = candidate.blob;
          }
        }
      } else {
        // JPEG/WebP path: bounded same-format quality walk-down via the
        // browser canvas encoder, never leaving the original format.
        for (const c of compressionCandidates(file.type, requested)) {
          const blob = await canvasToBlob(canvas, c.type, c.quality / 100);
          if (blob.size < original && (!bestBlob || blob.size < bestBlob.size)) {
            bestBlob = blob;
          }
        }
      }

      if (bestBlob) {
        const saved = original - bestBlob.size;
        setReportKind("success");
        setReport(
          `Compressed from ${fmtSize(original)} to ${fmtSize(bestBlob.size)}` +
            ` (${Math.round((saved / original) * 100)}% smaller).`,
        );
        setResultUrl(URL.createObjectURL(bestBlob)); setResultFilename(outputName(file.name, type)); setResultBlob(bestBlob);
      } else {
        setReportKind("notice");
        setReport(
          "This image could not be reduced further while preserving its original format.",
        );
      }
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
      {report && (
        <p
          className={
            reportKind === "success"
              ? "rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800"
              : "rounded-lg bg-amber-50 p-3 text-sm text-amber-800"
          }
        >
          {report}
        </p>
      )}
      
      <button
        type="button"
        disabled={busy || !image}
        onClick={compress}
        className={primaryBtn}
      >
        {busy ? "Processing..." : "Compress Image"}
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
              Download Compressed Image
            </button>
            <button
              type="button"
              onClick={() => { pick(null); setResultUrl(null); setResultBlob(null); setReport(null); }}
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