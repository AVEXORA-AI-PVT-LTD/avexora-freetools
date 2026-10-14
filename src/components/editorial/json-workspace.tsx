"use client";

import { useState, useTransition, useMemo, useEffect } from "react";

const SAMPLE_JSON = `{
  "name": "Avexora",
  "tools": 130,
  "fast": true,
  "state": "ready"
}`;

function highlightJson(src: string): string {
  const escCode = (str: string) =>
    str.replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] || c)
    );

  const re = /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false)\b|\bnull\b|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g;
  let out = "";
  let last = 0;
  let m: RegExpExecArray | null;

  while ((m = re.exec(src)) !== null) {
    out += escCode(src.slice(last, m.index));
    if (m[1]) {
      out += `<span class="${m[2] ? "t-key" : "t-str"}">${escCode(m[1])}</span>`;
      if (m[2]) out += `<span class="t-op">${escCode(m[2])}</span>`;
    } else if (m[3]) {
      out += `<span class="t-bool">${m[3]}</span>`;
    } else if (m[4]) {
      out += `<span class="t-num">${m[4]}</span>`;
    }
    last = re.lastIndex;
  }
  return out + escCode(src.slice(last));
}

export function JsonWorkspace() {
  const [input, setInput] = useState(SAMPLE_JSON);
  const [copied, setCopied] = useState(false);
  const [execTime, setExecTime] = useState("0.4 ms");
  const [, startTransition] = useTransition();

  const { formattedHtml, rawText, statusText, statusClass } = useMemo(() => {
    let formattedHtml = "";
    let rawText = "";
    let statusText = "READY";
    let statusClass = "ws-status";

    const trimmed = input.trim();
    if (!trimmed) {
      statusText = "EMPTY";
    } else {
      try {
        const parsed = JSON.parse(trimmed);
        rawText = JSON.stringify(parsed, null, 2);
        formattedHtml = highlightJson(rawText);
        statusText = "VALID";
        statusClass = "ws-status is-ok";
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        formattedHtml = `<span class="err">${errMsg}</span>`;
        statusText = "INVALID";
        statusClass = "ws-status is-err";
      }
    }

    return { formattedHtml, rawText, statusText, statusClass };
  }, [input]);

  useEffect(() => {
    const trimmed = input.trim();
    if (!trimmed) {
      setExecTime("0.4 ms");
      return;
    }
    try {
      const startTime = performance.now();
      JSON.parse(trimmed);
      const duration = (performance.now() - startTime).toFixed(1);
      setExecTime(`${duration} ms`);
    } catch {
      setExecTime("0.4 ms");
    }
  }, [input]);

  const handleMinify = () => {
    try {
      const parsed = JSON.parse(input);
      const minified = JSON.stringify(parsed);
      setInput(minified);
    } catch {}
  };

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(input);
      const pretty = JSON.stringify(parsed, null, 2);
      setInput(pretty);
    } catch {}
  };

  const handleCopy = () => {
    if (!rawText) return;
    navigator.clipboard.writeText(rawText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const handleClear = () => {
    setInput("");
  };

  return (
    <div className="ws">
      <div className="ws-bar">
        <span className="ws-dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span className="ws-url">tools.avexora.in/json-formatter</span>
        <span className="ws-flag">Runs locally</span>
      </div>
      <div className="ws-body">
        <div className="ws-pane">
          <div className="ws-pane-head">
            <span className="eyebrow-mono">Input</span>
            <span className="mono">JSON</span>
          </div>
          <textarea
            className="ws-input"
            spellCheck={false}
            aria-label="JSON input"
            value={input}
            onChange={(e) => {
              const val = e.target.value;
              startTransition(() => {
                setInput(val);
              });
            }}
          />
        </div>
        <div className="ws-pane">
          <div className="ws-pane-head">
            <span className="eyebrow-mono">Output</span>
            <div className="flex items-center gap-2">
              <span className="mono t-mut text-[11px]">{execTime}</span>
              <span className={statusClass} role="status">
                {statusText}
              </span>
            </div>
          </div>
          <pre
            className="ws-output overflow-auto"
            dangerouslySetInnerHTML={{ __html: formattedHtml }}
          />
        </div>
      </div>
      <div className="ws-actions">
        <button className="btn btn-primary btn-sm" type="button" onClick={handleFormat}>
          Format JSON
        </button>
        <button className="btn btn-secondary btn-sm" type="button" onClick={handleMinify}>
          Minify
        </button>
        <button className="btn btn-ghost btn-sm" type="button" onClick={handleCopy}>
          {copied ? "Copied!" : "Copy"}
        </button>
        <button className="btn btn-ghost btn-sm" type="button" onClick={handleClear}>
          Clear
        </button>
      </div>
    </div>
  );
}
