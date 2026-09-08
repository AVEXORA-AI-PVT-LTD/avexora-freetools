"use client";

import { useRef, useState } from "react";
import { downloadBytes, primaryBtn } from "./pdf-shared";

interface Picked {
  file: File;
  id: string;
}

/** Shared implementation for jpg-to-pdf and png-to-pdf. */
function ImagesToPdf({ format }: { format: "jpg" | "png" }) {
  const [files, setFiles] = useState<Picked[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const accept = format === "jpg" ? "image/jpeg,.jpg,.jpeg" : "image/png,.png";
  const label = format === "jpg" ? "JPG images" : "PNG images";

  const move = (i: number, dir: -1 | 1) =>
    setFiles((prev) => {
      const next = [...prev];
      const j = i + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const convert = async () => {
    setBusy(true);
    setError(null);
    try {
      const { PDFDocument } = await import("pdf-lib");
      const doc = await PDFDocument.create();
      for (const { file } of files) {
        const bytes = await file.arrayBuffer();
        const image =
          format === "jpg" ? await doc.embedJpg(bytes) : await doc.embedPng(bytes);
        const page = doc.addPage([image.width, image.height]);
        page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
      }
      downloadBytes(await doc.save(), "images.pdf");
    } catch {
      setError(`One of the files could not be read as a ${format.toUpperCase()} image.`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        className="hidden"
        onChange={(e) => {
          const picked = Array.from(e.target.files ?? []).map((file) => ({
            file,
            id: crypto.randomUUID(),
          }));
          if (picked.length) setFiles((prev) => [...prev, ...picked]);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="w-full rounded-lg border-2 border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-600 hover:border-orange-400 hover:text-orange-700"
      >
        <span className="block text-2xl">🖼️</span>
        Click to choose {label} (or add more)
        <span className="mt-1 block text-xs text-slate-400">
          Each image becomes one PDF page, in the order listed. Nothing is uploaded.
        </span>
      </button>
      {files.length > 0 && (
        <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
          {files.map((f, i) => (
            <li key={f.id} className="flex items-center gap-2 px-3 py-2 text-sm">
              <span className="w-6 text-slate-400">{i + 1}.</span>
              <span className="min-w-0 flex-1 truncate">{f.file.name}</span>
              <button type="button" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}
                className="rounded px-2 py-1 text-slate-500 hover:bg-slate-100 disabled:opacity-30">↑</button>
              <button type="button" aria-label="Move down" disabled={i === files.length - 1} onClick={() => move(i, 1)}
                className="rounded px-2 py-1 text-slate-500 hover:bg-slate-100 disabled:opacity-30">↓</button>
              <button type="button" aria-label="Remove"
                onClick={() => setFiles((prev) => prev.filter((x) => x.id !== f.id))}
                className="rounded px-2 py-1 text-slate-500 hover:text-red-600">✕</button>
            </li>
          ))}
        </ul>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="button" onClick={convert} disabled={files.length === 0 || busy} className={primaryBtn} data-lead-action="download">
        {busy ? "Converting…" : `Convert ${files.length || ""} image${files.length === 1 ? "" : "s"} to PDF`}
      </button>
    </div>
  );
}

export function JpgToPdf() {
  return <ImagesToPdf format="jpg" />;
}

export function PngToPdf() {
  return <ImagesToPdf format="png" />;
}
