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

      {!tool.autoCompute && (
        <button
          type="submit"
          className="rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          {tool.submitLabel ?? "Calculate"}
        </button>
      )}

      {outcome && "error" in outcome && hasInput && !tool.autoCompute && (
        <p className="text-sm text-red-600">{outcome.error}</p>
      )}
      {outcome && "results" in outcome && <ResultsPanel results={outcome.results} />}
    </form>
  );
}
