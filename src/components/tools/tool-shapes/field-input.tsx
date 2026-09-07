"use client";

import type { FieldDef, FieldValue } from "@/types/tools";
import { inputCls } from "@/tools/ui/ui-tokens";

export function initialValues(fields: FieldDef[]): Record<string, FieldValue> {
  const values: Record<string, FieldValue> = {};
  for (const f of fields) {
    values[f.name] =
      f.defaultValue ?? (f.type === "checkbox" ? false : "");
  }
  return values;
}

export function FieldInput({
  field,
  value,
  onChange,
  idPrefix,
  error,
}: {
  field: FieldDef;
  value: FieldValue;
  onChange: (value: FieldValue) => void;
  idPrefix: string;
  error?: string;
}) {
  const id = `${idPrefix}-${field.name}`;
  const describedBy = error ? `${id}-error` : undefined;

  if (field.type === "checkbox") {
    return (
      <label className="flex items-center gap-2 text-sm text-slate-700" htmlFor={id}>
        <input
          id={id}
          type="checkbox"
          checked={value === true}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        />
        {field.label}
      </label>
    );
  }

  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-700">
        {field.label}
        {field.required && (
          <span className="ml-0.5 text-sm text-red-500" aria-hidden="true">
            *
          </span>
        )}
        {field.unit && <span className="ml-1 text-slate-400">({field.unit})</span>}
        {field.optional && <span className="ml-1 text-xs text-slate-400">optional</span>}
      </label>
      {field.type === "select" ? (
        <select
          id={id}
          className={inputCls}
          value={String(value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          onChange={(e) => onChange(e.target.value)}
        >
          {field.options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : field.type === "textarea" ? (
        <textarea
          id={id}
          className={inputCls}
          value={String(value)}
          rows={field.rows ?? 4}
          maxLength={field.maxLength}
          placeholder={field.placeholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          id={id}
          type={field.type}
          className={inputCls}
          value={String(value)}
          maxLength={field.maxLength}
          placeholder={field.placeholder}
          min={field.min}
          max={field.max}
          step={field.step}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : field.help ? (
        <p className="mt-1 text-xs text-slate-500">{field.help}</p>
      ) : null}
    </div>
  );
}
