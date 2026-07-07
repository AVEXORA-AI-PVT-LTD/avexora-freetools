"use client";

import { useRef, useState } from "react";

interface PickedFile {
  file: File;
  id: string;
}

export default function MergePdf() {
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    setError(null);
    const picked = Array.from(list)
      .filter((f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"))
      .map((file) => ({ file, id: crypto.randomUUID() }));
    if (picked.length === 0) {
      setError("Please choose PDF files.");
      return;
    }
    setFiles((prev) => [...prev, ...picked]);
  };

  const move = (i: number, dir: -1 | 1) =>
    setFiles((prev) => {
      const next = [...prev];
      const j = i + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const merge = async () => {
    setBusy(true);
    setError(null);
    try {
      const { PDFDocument } = await import("pdf-lib");
      const out = await PDFDocument.create();
      for (const { file } of files) {
        const bytes = await file.arrayBuffer();
        const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
        const pages = await out.copyPages(doc, doc.getPageIndices());
        pages.forEach((p) => out.addPage(p));
      }
      const merged = await out.save();
      const url = URL.createObjectURL(new Blob([merged as BlobPart], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = "merged.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("One of the files could not be read. Password-protected PDFs are not supported.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        multiple
        className="hidden"
        onChange={(e) => {
          addFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="w-full rounded-lg border-2 border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-600 hover:border-indigo-400 hover:text-indigo-600"
      >
        <span className="block text-2xl">📄</span>
        Click to choose PDF files (or add more)
        <span className="mt-1 block text-xs text-slate-400">
          Files are processed in your browser and never uploaded.
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

      <button
        type="button"
        disabled={files.length < 2 || busy}
        onClick={merge}
        className="rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        data-lead-action="download"
      >
        {busy ? "Merging…" : `Merge ${files.length || ""} PDFs & download`}
      </button>
    </div>
  );
}
