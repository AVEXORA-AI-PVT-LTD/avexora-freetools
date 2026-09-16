"use client";

import { useEffect, useState } from "react";
import { zipSync } from "fflate";
import {
  useAuthDownload,
  useRestoredDownload,
} from "@/components/account/use-auth-download";
import { ImagePicker, canvasToBlob, drawToCanvas, primaryBtn, secondaryBtn, useImageFile } from "./image-shared";

const SIZES = [16, 32, 48, 180, 192, 512];

export function FaviconGenerator() {
  const { file, image, error, setError, pick } = useImageFile();
  const [busy, setBusy] = useState(false);
  const [snippet, setSnippet] = useState<string | null>(null);
  const { downloadOne } = useAuthDownload();
  const { restored } = useRestoredDownload();
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultFilename, setResultFilename] = useState<string>("favicon-package.zip");
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);

  useEffect(() => {
    if (!restored) return;
    queueMicrotask(() => {
      setResultUrl(URL.createObjectURL(restored.blob));
      setResultFilename(restored.filename);
      setResultBlob(restored.blob);
    });
  }, [restored]);

  const generate = async () => {
    if (!file || !image) return;
    setBusy(true);
    setError(null);
    setSnippet(null);
    try {
      const entries: Record<string, Uint8Array> = {};
      for (const size of SIZES) {
        const canvas = drawToCanvas(image, size, size);
        const blob = await canvasToBlob(canvas, "image/png");
        entries[`favicon-${size}x${size}.png`] = new Uint8Array(await blob.arrayBuffer());
      }
      // One single download: package every generated asset into a single ZIP so
      // the browser is not asked to run many independent downloads at once.
      const zipped = zipSync(entries, { level: 0 });
      const zippedCopy = new Uint8Array(zipped.length);
      zippedCopy.set(zipped);
      const zipBlob = new Blob([zippedCopy], { type: "application/zip" });
      setResultUrl(URL.createObjectURL(zipBlob));
      setResultFilename("favicon-package.zip");
      setResultBlob(zipBlob);
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
        Generates PNG favicons at {SIZES.join(", ")}px and packages them together as one ZIP, plus the HTML snippet to reference them.
      </p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="button" onClick={generate} disabled={!image || busy} className={primaryBtn}>
        {busy ? "Generating…" : "Generate favicon set"}
      </button>
      {resultUrl && resultBlob && (
        <div className="space-y-2">
          <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800" role="status">
            Favicon set ready — download the ZIP.
          </p>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => void downloadOne(resultBlob, resultFilename)}
              className={primaryBtn} data-lead-action="download">
              Download favicon ZIP
            </button>
            <button type="button" onClick={() => { pick(null); setResultUrl(null); setResultBlob(null); }}
              className={secondaryBtn}>
              Start over
            </button>
          </div>
        </div>
      )}
      {snippet && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">Add this to your page &lt;head&gt;:</p>
          <pre className="overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs">{snippet}</pre>
        </div>
      )}
    </div>
  );
}
