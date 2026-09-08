"use client";

import { useState } from "react";
import type { FieldValues, GeneratorTool } from "@/types/tools";
import { FieldInput, initialValues } from "./field-input";
import { OutputBlock } from "./output-block";
import { GateProvider, useEmailGate } from "@/components/lead/email-gate";

export function GeneratorShape({ tool }: { tool: GeneratorTool }) {
  const gate = useEmailGate(tool);

  if (tool.component) {
    const Custom = tool.component;
    return (
      <GateProvider value={gate.requireEmail}>
        <Custom />
        {gate.modal}
      </GateProvider>
    );
  }
  if (!tool.fields || !tool.generate) return null;
  return <DeclarativeGenerator tool={tool} />;
}

function DeclarativeGenerator({ tool }: { tool: GeneratorTool }) {
  const fields = tool.fields!;
  const generate = tool.generate!;
  const [values, setValues] = useState<FieldValues>(() => initialValues(fields));
  const [output, setOutput] = useState<{ text: string; filename?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const gate = useEmailGate(tool);

  const reset = () => {
    setValues(initialValues(fields));
    setOutput(null);
    setError(null);
  };

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const result = generate(values);
        if ("error" in result) {
          setError(result.error);
          setOutput(null);
        } else {
          setError(null);
          setOutput(result);
        }
      }}
    >
      <div className={fields.length > 2 ? "grid gap-4 sm:grid-cols-2" : "space-y-4"}>
        {fields.map((f) => (
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
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          className="rounded-md bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-700"
        >
          {tool.submitLabel ?? "Generate"}
        </button>
        <button
          type="button"
          onClick={reset}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Clear
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {output && (
        <OutputBlock
          text={output.text}
          filename={output.filename}
          gated={Boolean(tool.emailGate)}
          onGatedAction={gate.requireEmail}
        />
      )}
      {gate.modal}
    </form>
  );
}
