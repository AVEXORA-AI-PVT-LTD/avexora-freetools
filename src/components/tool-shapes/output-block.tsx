"use client";

import { useState } from "react";

export function OutputBlock({
  text,
  filename,
  gated = false,
  onGatedAction,
}: {
  text: string;
  filename?: string;
  /** When true, copy/download must pass the email gate first (wired in lead capture). */
  gated?: boolean;
  onGatedAction?: (proceed: () => void) => void;
}) {
  const [copied, setCopied] = useState(false);

  const run = (action: () => void) => {
    if (gated && onGatedAction) onGatedAction(action);
    else action();
  };

  const copy = () =>
    run(() => {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      });
    });

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
      <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-900">
        {text}
      </pre>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={copy}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          {copied ? "Copied ✓" : "Copy"}
        </button>
        <button
          type="button"
          onClick={download}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Download
        </button>
      </div>
    </div>
  );
}
