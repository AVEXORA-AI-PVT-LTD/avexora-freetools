"use client";

import { useState } from "react";

const ALGORITHMS = [
  { id: "SHA-1", note: "legacy — avoid for security uses" },
  { id: "SHA-256", note: "recommended" },
  { id: "SHA-512", note: "longer digest" },
] as const;

async function digestHex(algorithm: string, text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest(algorithm, data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export default function HashGenerator() {
  const [text, setText] = useState("");
  const [selected, setSelected] = useState<string[]>(["SHA-256"]);
  const [results, setResults] = useState<{ algorithm: string; hex: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]));

  const generate = async () => {
    if (text === "") {
      setError("Enter some text to hash.");
      return;
    }
    if (selected.length === 0) {
      setError("Select at least one algorithm.");
      return;
    }
    setError(null);
    const out = [];
    for (const alg of ALGORITHMS.map((a) => a.id).filter((a) => selected.includes(a))) {
      out.push({ algorithm: alg, hex: await digestHex(alg, text) });
    }
    setResults(out);
  };

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="hash-text" className="mb-1 block text-sm font-medium text-slate-700">
          Text to hash
        </label>
        <textarea
          id="hash-text"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          rows={5}
          placeholder="Paste or type the text…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>
      <fieldset className="flex flex-wrap gap-4">
        <legend className="mb-1 w-full text-sm font-medium text-slate-700">Algorithms</legend>
        {ALGORITHMS.map((a) => (
          <label key={a.id} className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={selected.includes(a.id)}
              onChange={() => toggle(a.id)}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600"
            />
            {a.id} <span className="text-xs text-slate-400">({a.note})</span>
          </label>
        ))}
      </fieldset>
      <button
        type="button"
        onClick={generate}
        className="rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
      >
        Generate hashes
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {results.length > 0 && (
        <dl className="space-y-3">
          {results.map((r) => (
            <div key={r.algorithm} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between">
                <dt className="text-sm font-semibold text-slate-700">{r.algorithm}</dt>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(r.hex).then(() => {
                      setCopied(r.algorithm);
                      setTimeout(() => setCopied(null), 1500);
                    });
                  }}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
                >
                  {copied === r.algorithm ? "Copied ✓" : "Copy"}
                </button>
              </div>
              <dd className="mt-1 break-all font-mono text-xs text-slate-900">{r.hex}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
