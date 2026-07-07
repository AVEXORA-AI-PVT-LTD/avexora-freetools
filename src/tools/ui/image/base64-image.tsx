"use client";

import { useState } from "react";
import { ImagePicker, useImageFile } from "./image-shared";

export function ImageToBase64() {
  const { file, image, error, pick } = useImageFile();
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const onPick = async (f: File | null) => {
    await pick(f);
    setDataUrl(null);
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setDataUrl(reader.result as string);
    reader.readAsDataURL(f);
  };

  return (
    <div className="space-y-4">
      <ImagePicker file={file} image={image} onPick={onPick} />
      {error && <p className="text-sm text-red-600">{error}</p>}
      {dataUrl && (
        <div className="space-y-2">
          <textarea readOnly value={dataUrl} rows={8}
            className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-xs" />
          <button type="button"
            onClick={() => {
              navigator.clipboard.writeText(dataUrl).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              });
            }}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
            {copied ? "Copied ✓" : "Copy Base64 string"}
          </button>
        </div>
      )}
    </div>
  );
}

export function Base64ToImage() {
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const decode = () => {
    setError(null);
    setPreviewUrl(null);
    const trimmed = input.trim();
    const isDataUrl = /^data:image\/[a-zA-Z+.-]+;base64,/.test(trimmed);
    const dataUrl = isDataUrl ? trimmed : `data:image/png;base64,${trimmed}`;
    const img = new Image();
    img.onload = () => setPreviewUrl(dataUrl);
    img.onerror = () => setError("That doesn't look like valid base64 image data.");
    img.src = dataUrl;
  };

  const download = () => {
    if (!previewUrl) return;
    const a = document.createElement("a");
    a.href = previewUrl;
    const ext = previewUrl.match(/^data:image\/(\w+);/)?.[1] ?? "png";
    a.download = `image.${ext === "jpeg" ? "jpg" : ext}`;
    a.click();
  };

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="b64-input" className="mb-1 block text-sm font-medium text-slate-700">
          Base64 string (with or without the data:image/… prefix)
        </label>
        <textarea id="b64-input" rows={8}
          className="w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-xs focus:border-indigo-500 focus:outline-none"
          placeholder="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA…"
          value={input} onChange={(e) => setInput(e.target.value)} />
      </div>
      <button type="button" onClick={decode}
        className="rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">
        Decode
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {previewUrl && (
        <div className="space-y-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt="Decoded preview" className="max-w-full rounded-lg border border-slate-200" />
          <button type="button" onClick={download}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            data-lead-action="download">
            Download image
          </button>
        </div>
      )}
    </div>
  );
}
