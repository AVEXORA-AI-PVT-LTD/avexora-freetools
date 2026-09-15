"use client";

import { useState } from "react";
import { inputCls, labelCls, panelCls, primaryBtn, secondaryBtn } from "../ui-tokens";

/**
 * Looks up a bank branch by IFSC code against Razorpay's free, public IFSC
 * API (https://ifsc.razorpay.com) — the same open dataset (originally
 * published by the RBI) that most "IFSC finder" tools on the web query.
 * Nothing you type is stored by this site; the request goes straight from
 * your browser to that public endpoint.
 */

interface IfscBranch {
  BANK: string;
  BRANCH: string;
  ADDRESS: string;
  CITY: string;
  DISTRICT: string;
  STATE: string;
  CONTACT?: string;
  IFSC: string;
  MICR: string | null;
  UPI?: boolean;
  IMPS?: boolean;
  NEFT?: boolean;
  RTGS?: boolean;
}

const IFSC_RE = /^[A-Z]{4}0[A-Z0-9]{6}$/;

const badgeCls = "rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700";

export default function IfscCodeFinder() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<IfscBranch | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const lookup = async () => {
    const ifsc = code.trim().toUpperCase();
    if (!IFSC_RE.test(ifsc)) {
      setError(
        "An IFSC code is 11 characters — 4 bank letters, then a 0, then 6 branch characters. For example: HDFC0000001.",
      );
      setResult(null);
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`https://ifsc.razorpay.com/${ifsc}`);
      if (!res.ok) {
        setError("No bank branch found for this IFSC code. Double-check it and try again.");
        return;
      }
      setResult((await res.json()) as IfscBranch);
    } catch {
      setError("Couldn't reach the bank-branch lookup service. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setCode("");
    setResult(null);
    setError(null);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className={labelCls} htmlFor="ifsc-input">
          IFSC code
        </label>
        <div className="flex flex-wrap gap-3">
          <input
            id="ifsc-input"
            className={`${inputCls} max-w-xs uppercase`}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void lookup();
              }
            }}
            placeholder="HDFC0000001"
            maxLength={11}
          />
          <button type="button" onClick={() => void lookup()} disabled={loading} className={primaryBtn}>
            {loading ? "Looking up…" : "Find branch"}
          </button>
          <button type="button" onClick={reset} className={secondaryBtn}>
            Clear
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {result && (
        <div className={`${panelCls} p-5`}>
          <h3 className="text-lg font-semibold text-slate-900">{result.BANK}</h3>
          <p className="text-sm text-slate-600">{result.BRANCH} branch</p>

          <dl className="mt-4 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-medium text-slate-500">IFSC</dt>
              <dd className="text-slate-900">{result.IFSC}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-500">MICR code</dt>
              <dd className="text-slate-900">{result.MICR ?? "Not available"}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="font-medium text-slate-500">Address</dt>
              <dd className="text-slate-900">{result.ADDRESS}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-500">City / district</dt>
              <dd className="text-slate-900">
                {result.CITY}
                {result.DISTRICT && result.DISTRICT !== result.CITY ? `, ${result.DISTRICT}` : ""}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-slate-500">State</dt>
              <dd className="text-slate-900">{result.STATE}</dd>
            </div>
            {result.CONTACT && (
              <div>
                <dt className="font-medium text-slate-500">Contact</dt>
                <dd className="text-slate-900">{result.CONTACT}</dd>
              </div>
            )}
          </dl>

          <div className="mt-4 flex flex-wrap gap-2">
            {result.NEFT && <span className={badgeCls}>NEFT</span>}
            {result.RTGS && <span className={badgeCls}>RTGS</span>}
            {result.IMPS && <span className={badgeCls}>IMPS</span>}
            {result.UPI && <span className={badgeCls}>UPI</span>}
          </div>
        </div>
      )}
    </div>
  );
}
