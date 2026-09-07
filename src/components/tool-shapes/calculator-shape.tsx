"use client";

import { useMemo, useState } from "react";
import type { CalculatorTool, FieldValues } from "@/tools/types";
import { FieldInput, initialValues } from "./field-input";
import { ResultsPanel } from "./results-panel";

export function CalculatorShape({ tool }: { tool: CalculatorTool }) {
  const [values, setValues] = useState<FieldValues>(() => initialValues(tool.fields));
  const [submitted, setSubmitted] = useState(false);

  const outcome = useMemo(() => {
    if (!tool.autoCompute && !submitted) return null;
    return tool.compute(values);
  }, [tool, values, submitted]);

  const hasInput = tool.fields.some((f) => {
    const v = values[f.name];
    return typeof v === "string" ? v.trim() !== "" : v !== undefined;
  });

  const reset = () => {
    setValues(initialValues(tool.fields));
    setSubmitted(false);
  };

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted(true);
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

      <div className="flex flex-wrap items-center gap-3">
        {!tool.autoCompute && (
          <button
            type="submit"
            className="rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            {tool.submitLabel ?? "Calculate"}
          </button>
        )}
        <button
          type="button"
          onClick={reset}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Reset
        </button>
      </div>

      {outcome && "error" in outcome && hasInput && (
        <p className="text-sm text-red-600">{outcome.error}</p>
      )}
      {outcome && "results" in outcome && <ResultsPanel results={outcome.results} />}
    </form>
  );
}
