"use client";

import { useEffect, useState } from "react";
import { PdfPicker, inputCls, labelCls, primaryBtn, secondaryBtn } from "./pdf-shared";
import {
  useAuthDownload,
  useRestoredDownload,
} from "@/components/account/use-auth-download";

interface Meta {
  title: string;
  author: string;
  subject: string;
  keywords: string;
}

const empty: Meta = { title: "", author: "", subject: "", keywords: "" };

export default function PdfMetadataEditor() {
  const { downloadOne } = useAuthDownload();
  const { restored } = useRestoredDownload();
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultFilename, setResultFilename] = useState<string>("");
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [meta, setMeta] = useState<Meta>(empty);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!restored) return;
    queueMicrotask(() => {
      setResultUrl(URL.createObjectURL(restored.blob));
      setResultFilename(restored.filename);
      setResultBlob(restored.blob);
    });
  }, [restored]);

  // Clearing the picker resets the form here rather than in the effect below:
  // onPick is the only thing that changes `file`, so this is the same
  // behaviour without a synchronous setState inside an effect.
  const pick = (next: File | null) => {
    setFile(next);
    if (!next) {
      setMeta(empty);
      setError(null);
    }
  };

  useEffect(() => {
    if (!file) return;
    let active = true;
    (async () => {
      try {
        const { PDFDocument } = await import("pdf-lib");
        const doc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
        if (!active) return;
        setMeta({
          title: doc.getTitle() ?? "",
          author: doc.getAuthor() ?? "",
          subject: doc.getSubject() ?? "",
          keywords: (doc.getKeywords() ?? "").toString(),
        });
        setError(null);
      } catch {
        if (active) setError("This file could not be read as a PDF. Password-protected PDFs are not supported.");
      }
    })();
    return () => {
      active = false;
    };
  }, [file]);

  const save = async () => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const { PDFDocument } = await import("pdf-lib");
      const doc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
      doc.setTitle(meta.title);
      doc.setAuthor(meta.author);
      doc.setSubject(meta.subject);
      doc.setKeywords(meta.keywords.split(",").map((k) => k.trim()).filter(Boolean));
      const bytes = await doc.save();
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
      setResultUrl(URL.createObjectURL(blob));
      setResultFilename(file.name.replace(/\.pdf$/i, "") + "-updated.pdf");
      setResultBlob(blob);
    } catch {
      setError("Something went wrong while saving the metadata.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <PdfPicker file={file} pageCount={null} onPick={pick} />
      {file && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="meta-title" className={labelCls}>Title</label>
            <input id="meta-title" type="text" className={inputCls} value={meta.title}
              onChange={(e) => setMeta({ ...meta, title: e.target.value })} />
          </div>
          <div>
            <label htmlFor="meta-author" className={labelCls}>Author</label>
            <input id="meta-author" type="text" className={inputCls} value={meta.author}
              onChange={(e) => setMeta({ ...meta, author: e.target.value })} />
          </div>
          <div>
            <label htmlFor="meta-subject" className={labelCls}>Subject</label>
            <input id="meta-subject" type="text" className={inputCls} value={meta.subject}
              onChange={(e) => setMeta({ ...meta, subject: e.target.value })} />
          </div>
          <div>
            <label htmlFor="meta-keywords" className={labelCls}>Keywords (comma-separated)</label>
            <input id="meta-keywords" type="text" className={inputCls} value={meta.keywords}
              onChange={(e) => setMeta({ ...meta, keywords: e.target.value })} />
          </div>
        </div>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!resultUrl ? (
        <button type="button" onClick={save} disabled={!file || busy} className={primaryBtn}>
          {busy ? "Saving…" : "Save metadata"}
        </button>
      ) : (
        <div className="space-y-2">
          <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800" role="status">
            Metadata updated — review it, then download.
          </p>
          <div className="flex flex-wrap gap-3">
            {resultUrl && resultBlob && (
              <button
                type="button"
                onClick={() => void downloadOne(resultBlob, resultFilename)}
                className={primaryBtn}
                data-lead-action="download"
              >
                Download PDF
              </button>
            )}
            <button
              type="button"
              onClick={() => { pick(null); setResultUrl(null); setResultBlob(null); }}
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