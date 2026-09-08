"use client";

import { useState } from "react";
import { primaryBtn, secondaryBtn } from "@/tools/ui/ui-tokens";

export function OutputBlock({
  text,
  filename,
  gated = false,
  onGatedAction,
}: {
  text: string;
  filename?: string;
  /** When true, the download (only) must pass the email gate first (wired in lead capture). Copy always runs ungated. */
  gated?: boolean;
  onGatedAction?: (proceed: () => void) => void;
}) {
  const [copied, setCopied] = useState(false);

  const run = (action: () => void) => {
    if (gated && onGatedAction) {
      onGatedAction(action);
      return;
    }
    action();
  };

  // Copy is never gated: it only writes the document text to the clipboard. It
  // must not open the email modal or trigger the download flow.
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  // Download stays gated: it must pass the email gate before saving the file.
  const download = () =>
    run(() => {
      const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = filename ?? "output.txt";
      a.click();
      URL.revokeObjectURL(url);
    });

  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-lg border border-slate-200">
        {filename && (
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 px-4 py-2">
            <span className="truncate text-xs font-medium text-slate-600">{filename}</span>
            <span className="shrink-0 text-xs text-slate-400">text/plain</span>
          </div>
        )}
        <pre className="max-h-96 overflow-auto whitespace-pre-wrap bg-white p-4 text-sm text-slate-900">
          {text}
        </pre>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={copy} className={primaryBtn}>
          {copied ? "Copied ✓" : "Copy"}
        </button>
        <button type="button" onClick={download} className={secondaryBtn}>
          Download
        </button>
      </div>
    </div>
  );
}
