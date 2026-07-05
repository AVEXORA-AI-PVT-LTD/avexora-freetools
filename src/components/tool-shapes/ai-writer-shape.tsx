"use client";

import { useRef, useState } from "react";
import type { AiWriterTool, FieldValues } from "@/tools/types";
import { FieldInput, initialValues } from "./field-input";
import { OutputBlock } from "./output-block";

export function AiWriterShape({
  tool,
  aiEnabled,
}: {
  tool: AiWriterTool;
  aiEnabled: boolean;
}) {
  const [values, setValues] = useState<FieldValues>(() => initialValues(tool.fields));
  const [output, setOutput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  if (!aiEnabled) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        This AI tool is temporarily unavailable. Please check back soon — our other
        free tools are all working.
      </div>
    );
  }

  const generate = async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setBusy(true);
    setError(null);
    setOutput("");
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: tool.slug, values }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Something went wrong. Please try again.");
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        setOutput((prev) => prev + decoder.decode(value, { stream: true }));
      }
    } catch {
      if (!controller.signal.aborted) {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        generate();
      }}
    >
      <div className={tool.fields.length > 2 ? "grid gap-4 sm:grid-cols-2" : "space-y-4"}>
        {tool.fields.map((f) => (
          <div key={f.name} className={f.type === "textarea" ? "sm:col-span-2" : undefined}>
            <FieldInput
              field={f}
              value={values[f.name]}
              idPrefix={tool.slug}
              onChange={(v) => setValues((prev) => ({ ...prev, [f.name]: v }))}
            />
          </div>
        ))}
      </div>
      <button
        type="submit"
        disabled={busy}
        className="rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {busy ? "Generating…" : (tool.submitLabel ?? "Generate")}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {output && <OutputBlock text={output} filename={`${tool.slug}.md`} />}
    </form>
  );
}
