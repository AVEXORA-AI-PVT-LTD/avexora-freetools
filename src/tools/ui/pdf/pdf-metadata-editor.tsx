"use client";

import { useEffect, useState } from "react";
import { PdfPicker, downloadBytes, inputCls, labelCls, primaryBtn } from "./pdf-shared";

interface Meta {
  title: string;
  author: string;
  subject: string;
  keywords: string;
}

const empty: Meta = { title: "", author: "", subject: "", keywords: "" };

export default function PdfMetadataEditor() {
  const [file, setFile] = useState<File | null>(null);
  const [meta, setMeta] = useState<Meta>(empty);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!file) {
      setMeta(empty);
      return;
    }
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
      downloadBytes(await doc.save(), file.name.replace(/\.pdf$/i, "") + "-updated.pdf");
    } catch {
      setError("Something went wrong while saving the metadata.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <PdfPicker file={file} pageCount={null} onPick={setFile} />
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
      <button type="button" onClick={save} disabled={!file || busy} className={primaryBtn} data-lead-action="download">
        {busy ? "Saving…" : "Save metadata & download"}
      </button>
    </div>
  );
}
