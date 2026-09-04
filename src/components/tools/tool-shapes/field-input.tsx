"use client";

import type { FieldDef, FieldValue } from "@/types/tools";

const inputCls =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";

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
}: {
  field: FieldDef;
  value: FieldValue;
  onChange: (value: FieldValue) => void;
  idPrefix: string;
}) {
  const id = `${idPrefix}-${field.name}`;

  if (field.type === "checkbox") {
    return (
      <label className="flex items-center gap-2 text-sm text-slate-700" htmlFor={id}>
        <input
          id={id}
          type="checkbox"
          checked={value === true}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-indigo-600"
        />
        {field.label}
      </label>
    );
  }

  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-700">
        {field.label}
        {field.unit && <span className="ml-1 text-slate-400">({field.unit})</span>}
        {field.optional && <span className="ml-1 text-xs text-slate-400">optional</span>}
      </label>
      {field.type === "select" ? (
        <select
          id={id}
          className={inputCls}
          value={String(value)}
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
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          id={id}
          type={field.type}
          className={inputCls}
          value={String(value)}
          placeholder={field.placeholder}
          min={field.min}
          max={field.max}
          step={field.step}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {field.help && <p className="mt-1 text-xs text-slate-500">{field.help}</p>}
    </div>
  );
}
