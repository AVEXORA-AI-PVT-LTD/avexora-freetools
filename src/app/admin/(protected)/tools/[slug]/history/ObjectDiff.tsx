"use client";

import React from "react";

function isObject(val: unknown): val is Record<string, unknown> {
  return val !== null && typeof val === "object" && !Array.isArray(val);
}

/** Equivalent to `obj?.[key]` for an arbitrary (possibly non-object) value. */
function getKey(obj: unknown, key: string): unknown {
  return obj == null ? undefined : (obj as Record<string, unknown>)[key];
}

function gatherKeys(obj1: unknown, obj2: unknown): string[] {
  const keys = new Set<string>();
  if (isObject(obj1)) Object.keys(obj1).forEach((k) => keys.add(k));
  if (isObject(obj2)) Object.keys(obj2).forEach((k) => keys.add(k));
  return Array.from(keys).sort();
}

export function ObjectDiff({ oldObj, newObj }: { oldObj: unknown; newObj: unknown }) {
  if (!isObject(oldObj) && !isObject(newObj)) {
    return null;
  }

  const keys = gatherKeys(oldObj, newObj);

  return (
    <div className="space-y-4">
      {keys.map((key) => {
        const oldVal = getKey(oldObj, key);
        const newVal = getKey(newObj, key);

        const oldStr = typeof oldVal === "object" ? JSON.stringify(oldVal, null, 2) : String(oldVal ?? "");
        const newStr = typeof newVal === "object" ? JSON.stringify(newVal, null, 2) : String(newVal ?? "");

        if (oldStr === newStr) return null; // hide unchanged

        return (
          <div key={key} className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-slate-100 px-4 py-2 font-semibold text-slate-800 border-b border-slate-200">
              {key}
            </div>
            <div className="grid grid-cols-2 divide-x divide-slate-200">
              <div className="p-4 bg-red-50/50">
                <span className="text-xs font-bold text-red-800 uppercase mb-2 block">Previous</span>
                <pre className="text-sm text-red-900 whitespace-pre-wrap font-mono">{oldStr || "(empty)"}</pre>
              </div>
              <div className="p-4 bg-green-50/50">
                <span className="text-xs font-bold text-green-800 uppercase mb-2 block">New</span>
                <pre className="text-sm text-green-900 whitespace-pre-wrap font-mono">{newStr || "(empty)"}</pre>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
