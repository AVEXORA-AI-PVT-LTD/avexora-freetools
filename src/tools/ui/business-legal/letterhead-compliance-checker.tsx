"use client";

import { useState } from "react";
import Link from "next/link";
import {
  type ComplianceInput,
  type EntityType,
  ENTITY_TYPES,
  auditBrand,
  entityLabel,
} from "@/studio/compliance/india";

/**
 * Free-tool wedge (spec 21 §6 phase 0).
 *
 * Runs the same rule table as the paid Studio, so the diagnosis is genuinely
 * the product — not a teaser. The conversion is "now fix it in one click",
 * which is what the CTA at the bottom offers.
 */

const inputCls =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none";
const labelCls = "block text-xs font-medium text-slate-600 mb-1";

const SEVERITY = {
  fail: { box: "border-red-200 bg-red-50", label: "Must fix", tone: "text-red-700" },
  warn: { box: "border-amber-200 bg-amber-50", label: "Should fix", tone: "text-amber-800" },
  info: { box: "border-slate-200 bg-slate-50", label: "Note", tone: "text-slate-600" },
} as const;

const STATUS_TEXT = {
  pass: { title: "Looks compliant", tone: "text-emerald-700" },
  warn: { title: "Some gaps to close", tone: "text-amber-800" },
  fail: { title: "Not compliant", tone: "text-red-700" },
} as const;

const DOC_LABELS: Record<string, string> = {
  letterhead: "Letterhead",
  invoice: "Invoice / billhead",
  envelope: "Envelope",
  "business-card": "Visiting card",
};

export default function LetterheadComplianceChecker() {
  const [form, setForm] = useState({
    entityType: "pvt-ltd" as EntityType,
    legalName: "",
    cin: "",
    llpin: "",
    gstin: "",
    registeredAddress: "",
    city: "",
    state: "",
    pincode: "",
    phone: "",
    email: "",
  });
  const [checked, setChecked] = useState(false);

  const set = (patch: Partial<typeof form>) => {
    setForm((f) => ({ ...f, ...patch }));
    setChecked(false);
  };

  const reset = () => {
    setForm({
      entityType: "pvt-ltd" as EntityType,
      legalName: "",
      cin: "",
      llpin: "",
      gstin: "",
      registeredAddress: "",
      city: "",
      state: "",
      pincode: "",
      phone: "",
      email: "",
    });
    setChecked(false);
  };

  const isCompany = ["pvt-ltd", "public-ltd", "opc"].includes(form.entityType);
  const isLlp = form.entityType === "llp";

  const brand: ComplianceInput = {
    entityType: form.entityType,
    name: form.legalName || "Your company",
    legalName: form.legalName || undefined,
    cin: isCompany ? form.cin : undefined,
    llpin: isLlp ? form.llpin : undefined,
    gstin: form.gstin || undefined,
    registeredAddress: form.registeredAddress || undefined,
    city: form.city || undefined,
    state: form.state || undefined,
    pincode: form.pincode || undefined,
    phone: form.phone || undefined,
    email: form.email || undefined,
  };

  const audit = checked ? auditBrand(brand) : null;

  return (
    <div className="space-y-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setChecked(true);
        }}
        className="space-y-4"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls} htmlFor="lc-entity">
              Entity type
            </label>
            <select
              id="lc-entity"
              className={inputCls}
              value={form.entityType}
              onChange={(e) => set({ entityType: e.target.value as EntityType })}
            >
              {ENTITY_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls} htmlFor="lc-name">
              Registered name (as on the certificate)
            </label>
            <input
              id="lc-name"
              className={inputCls}
              value={form.legalName}
              onChange={(e) => set({ legalName: e.target.value })}
              placeholder="Northwind Labs Private Limited"
            />
          </div>
          {isCompany && (
            <div>
              <label className={labelCls} htmlFor="lc-cin">
                CIN
              </label>
              <input
                id="lc-cin"
                className={inputCls}
                value={form.cin}
                onChange={(e) => set({ cin: e.target.value })}
                placeholder="U72900KA2020PTC123456"
              />
            </div>
          )}
          {isLlp && (
            <div>
              <label className={labelCls} htmlFor="lc-llpin">
                LLPIN
              </label>
              <input
                id="lc-llpin"
                className={inputCls}
                value={form.llpin}
                onChange={(e) => set({ llpin: e.target.value })}
                placeholder="AAB-1234"
              />
            </div>
          )}
          <div>
            <label className={labelCls} htmlFor="lc-gstin">
              GSTIN (if registered)
            </label>
            <input
              id="lc-gstin"
              className={inputCls}
              value={form.gstin}
              onChange={(e) => set({ gstin: e.target.value })}
              placeholder="29AABCU9603R1ZM"
            />
          </div>
        </div>

        <div>
          <label className={labelCls} htmlFor="lc-address">
            Registered office address (as printed on your letterhead)
          </label>
          <textarea
            id="lc-address"
            rows={2}
            className={inputCls}
            value={form.registeredAddress}
            onChange={(e) => set({ registeredAddress: e.target.value })}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className={labelCls} htmlFor="lc-city">
              City
            </label>
            <input
              id="lc-city"
              className={inputCls}
              value={form.city}
              onChange={(e) => set({ city: e.target.value })}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="lc-state">
              State
            </label>
            <input
              id="lc-state"
              className={inputCls}
              value={form.state}
              onChange={(e) => set({ state: e.target.value })}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="lc-pin">
              PIN code
            </label>
            <input
              id="lc-pin"
              className={inputCls}
              value={form.pincode}
              onChange={(e) => set({ pincode: e.target.value })}
              placeholder="560025"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls} htmlFor="lc-phone">
              Telephone printed on the letterhead
            </label>
            <input
              id="lc-phone"
              className={inputCls}
              value={form.phone}
              onChange={(e) => set({ phone: e.target.value })}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="lc-email">
              Email printed on the letterhead
            </label>
            <input
              id="lc-email"
              className={inputCls}
              value={form.email}
              onChange={(e) => set({ email: e.target.value })}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            className="rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Check compliance
          </button>
          <button
            type="button"
            onClick={reset}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Clear
          </button>
        </div>
      </form>

      {audit && (
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 p-5">
            <h3 className={`text-lg font-semibold ${STATUS_TEXT[audit.status].tone}`}>
              {STATUS_TEXT[audit.status].title}
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Checked as a {entityLabel(form.entityType)} against Indian
              stationery requirements.
            </p>
          </div>

          {Object.entries(audit.byDoc).map(([doc, result]) => (
            <div key={doc} className="rounded-lg border border-slate-200 p-5">
              <h4 className="text-sm font-semibold text-slate-900">
                {DOC_LABELS[doc] ?? doc}
              </h4>
              {result.findings.length === 0 ? (
                <p className="mt-2 text-sm text-emerald-700">
                  Every required particular is present.
                </p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {result.findings.map((f) => {
                    const s = SEVERITY[f.severity];
                    return (
                      <li key={f.id} className={`rounded-md border px-4 py-3 ${s.box}`}>
                        <p className={`text-xs font-semibold uppercase tracking-wide ${s.tone}`}>
                          {s.label}
                        </p>
                        <p className="mt-0.5 text-sm font-semibold text-slate-900">
                          {f.title}
                        </p>
                        <p className="mt-1 text-sm leading-relaxed text-slate-700">
                          {f.detail}
                        </p>
                        {f.citation && (
                          <p className="mt-2 border-l-2 border-slate-300 pl-3 text-xs leading-relaxed text-slate-600">
                            {f.citation}
                          </p>
                        )}
                        {f.penalty && (
                          <p className="mt-2 text-xs font-semibold text-red-700">
                            {f.penalty}
                          </p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ))}

          <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-5">
            <h4 className="text-sm font-semibold text-slate-900">
              Fix it in one click
            </h4>
            <p className="mt-1 text-sm text-slate-700">
              Brand Studio generates a print-ready letterhead, envelope and
              visiting card with these particulars already in place — plus your
              logo, employee ID cards and social posts.
            </p>
            <Link
              href="/studio?utm_source=freetools&utm_medium=tool&utm_campaign=letterhead-compliance-checker"
              className="mt-3 inline-block rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Generate compliant stationery
            </Link>
          </div>

          <p className="text-xs leading-relaxed text-slate-500">{audit.disclaimer}</p>
        </div>
      )}
    </div>
  );
}
