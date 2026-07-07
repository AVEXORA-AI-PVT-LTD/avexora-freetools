"use client";

import { useState } from "react";
import { ImagePicker, canvasToBlob, drawToCanvas, primaryBtn, useImageFile } from "./image-shared";

const SIZES = [16, 32, 48, 180, 192, 512];

export function FaviconGenerator() {
  const { file, image, error, setError, pick } = useImageFile();
  const [busy, setBusy] = useState(false);
  const [snippet, setSnippet] = useState<string | null>(null);

  const generate = async () => {
    if (!file || !image) return;
    setBusy(true);
    setError(null);
    setSnippet(null);
    try {
      for (const size of SIZES) {
        const canvas = drawToCanvas(image, size, size);
        const blob = await canvasToBlob(canvas, "image/png");
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `favicon-${size}x${size}.png`;
        a.click();
        URL.revokeObjectURL(url);
        // Small delay so the browser doesn't block rapid-fire downloads as a pop-up flood.
        await new Promise((r) => setTimeout(r, 150));
      }
      setSnippet(
        [
          '<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />',
          '<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />',
          '<link rel="apple-touch-icon" sizes="180x180" href="/favicon-180x180.png" />',
          '<link rel="icon" type="image/png" sizes="192x192" href="/favicon-192x192.png" />',
        ].join("\n"),
      );
    } catch {
      setError("Something went wrong while generating favicons.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <ImagePicker file={file} image={image} onPick={pick} />
      <p className="text-xs text-slate-500">
        Generates PNG favicons at {SIZES.join(", ")}px (each downloads separately) plus the HTML snippet to reference them.
      </p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="button" onClick={generate} disabled={!image || busy} className={primaryBtn} data-lead-action="download">
        {busy ? "Generating…" : "Generate favicon set"}
      </button>
      {snippet && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">Add this to your page &lt;head&gt;:</p>
          <pre className="overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs">{snippet}</pre>
        </div>
      )}
    </div>
  );
}
