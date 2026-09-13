"use client";

import { useEffect, useState } from "react";
import {
  useAuthDownload,
  useRestoredDownload,
} from "@/components/account/use-auth-download";
import { ImagePicker, canvasToBlob, drawToCanvas, primaryBtn, secondaryBtn, useImageFile } from "./image-shared";

/** Shared implementation for png-to-jpg, jpg-to-png, and webp-converter. */
function FormatConverter({
  toType,
  extension,
  accept,
}: {
  toType: string;
  extension: string;
  accept: string;
}) {
  const { file, image, error, setError, pick } = useImageFile();
  const [busy, setBusy] = useState(false);
  const { downloadOne } = useAuthDownload();
  const { restored } = useRestoredDownload();
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultFilename, setResultFilename] = useState<string>("converted_image");
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);

  useEffect(() => {
    if (!restored) return;
    queueMicrotask(() => {
      setResultUrl(URL.createObjectURL(restored.blob));
      setResultFilename(restored.filename);
      setResultBlob(restored.blob);
    });
  }, [restored]);

  const convert = async () => {
    if (!file || !image) return;
    setBusy(true);
    setError(null);
    try {
      const canvas = drawToCanvas(image, image.naturalWidth, image.naturalHeight);
      let blob: Blob;
      if (toType === "image/jpeg") {
        // JPEG has no alpha channel; flatten onto white first.
        const ctx = canvas.getContext("2d")!;
        const flattened = document.createElement("canvas");
        flattened.width = canvas.width;
        flattened.height = canvas.height;
        const fctx = flattened.getContext("2d")!;
        fctx.fillStyle = "#ffffff";
        fctx.fillRect(0, 0, flattened.width, flattened.height);
        fctx.drawImage(canvas, 0, 0);
        void ctx;
        blob = await canvasToBlob(flattened, toType, 0.92);
      } else {
        blob = await canvasToBlob(canvas, toType, 0.92);
      }
      setResultUrl(URL.createObjectURL(blob));
      setResultFilename(file.name.replace(/\.\w+$/, "") + extension);
      setResultBlob(blob);
    } catch {
      setError("Something went wrong while converting this image.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <ImagePicker file={file} image={image} onPick={pick} accept={accept} />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="button" onClick={convert} disabled={!image || busy} className={primaryBtn}>
        {busy ? "Converting…" : "Convert"}
      </button>
      {resultUrl && resultBlob && (
        <div className="space-y-2">
          <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800" role="status">
            Converted image ready — review it, then download.
          </p>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => void downloadOne(resultBlob, resultFilename)}
              className={primaryBtn} data-lead-action="download">
              Download image
            </button>
            <button type="button" onClick={() => { pick(null); setResultUrl(null); setResultBlob(null); }}
              className={secondaryBtn}>
              Start over
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function PngToJpg() {
  return <FormatConverter toType="image/jpeg" extension=".jpg" accept="image/png,.png" />;
}

export function JpgToPng() {
  return <FormatConverter toType="image/png" extension=".png" accept="image/jpeg,.jpg,.jpeg" />;
}

export function WebpConverter() {
  return <FormatConverter toType="image/webp" extension=".webp" accept="image/*" />;
}
