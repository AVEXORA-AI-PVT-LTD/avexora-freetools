"use client";

import { useState } from "react";
import { ImagePicker, canvasToBlob, downloadBlob, drawToCanvas, primaryBtn, useImageFile } from "./image-shared";

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

  const convert = async () => {
    if (!file || !image) return;
    setBusy(true);
    setError(null);
    try {
      const canvas = drawToCanvas(image, image.naturalWidth, image.naturalHeight);
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
        downloadBlob(await canvasToBlob(flattened, toType, 0.92), file.name.replace(/\.\w+$/, "") + extension);
      } else {
        downloadBlob(await canvasToBlob(canvas, toType, 0.92), file.name.replace(/\.\w+$/, "") + extension);
      }
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
      <button type="button" onClick={convert} disabled={!image || busy} className={primaryBtn} data-lead-action="download">
        {busy ? "Converting…" : `Convert & download`}
      </button>
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
