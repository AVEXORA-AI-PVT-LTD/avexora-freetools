"use client";

import { useState } from "react";
import { useToolTracking } from "./use-tool-tracking";
import { usePathname } from "next/navigation";
import type { FieldValues, GeneratorTool } from "@/types/tools";
import { FieldInput, initialValues } from "./field-input";
import { OutputBlock } from "./output-block";
import { GateProvider, useEmailGate } from "@/components/lead/email-gate";
import { useAuthGate } from "@/components/account/auth-gate";
import {
  consumeDownloadResume,
  saveDownloadResume,
} from "@/components/account/account-resume";

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
  const pathname = usePathname();
  // On a return from the sign-in page, the document the visitor tried to
  // download is rehydrated from sessionStorage in the initial state so the
  // result is never lost and nothing needs regenerating.
  const [output, setOutput] = useState<{ text: string; filename?: string } | null>(() => {
    if (!tool.requireAuth) return null;
    const resume = consumeDownloadResume(pathname);
    return resume ? { text: resume.text, filename: resume.filename } : null;
  });
  const [error, setError] = useState<string | null>(null);
  const gate = useEmailGate(tool);
  const { authGate, modal: authModal } = useAuthGate(Boolean(tool.requireAuth));

  useToolTracking(tool.slug, output !== null, JSON.stringify(values));

  const reset = () => {
    setValues(initialValues(fields));
    setOutput(null);
    setError(null);
  };

  // Downloads must pass sign-in first (auth-required tools), otherwise the
  // anonymous email gate (emailGate tools). Either way the download action
  // itself is only ever invoked after the gate succeeds.
  const gated = Boolean(tool.requireAuth) || Boolean(tool.emailGate);
  const onGatedAction = (action: () => void) => {
    if (tool.requireAuth) {
      authGate(action, () => {
        if (output) saveDownloadResume({ path: pathname, text: output.text, filename: output.filename });
      });
      return;
    }
    if (tool.emailGate) {
      gate.requireEmail(action);
      return;
    }
    action();
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
          gated={gated}
          onGatedAction={onGatedAction}
        />
      )}
      {gate.modal}
      {authModal}
    </form>
  );
}
