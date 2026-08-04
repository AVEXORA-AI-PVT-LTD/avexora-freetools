import {
  type ComplianceInput,
  type DocType,
  auditBrand,
  entityLabel,
  validateStationery,
} from "@/studio/compliance/india";
import { StatusPill } from "./status-pill";

/**
 * The compliance report — the product's differentiator made visible.
 *
 * Every finding carries its statutory citation and the penalty exposure, so a
 * founder can hand this to their CA rather than take our word for it.
 */

const SEVERITY_STYLE = {
  fail: "border-red-200 bg-red-50",
  warn: "border-amber-200 bg-amber-50",
  info: "border-slate-200 bg-slate-50",
} as const;

const SEVERITY_LABEL = {
  fail: "Must fix",
  warn: "Should fix",
  info: "For information",
} as const;

const DOC_LABELS: Partial<Record<DocType, string>> = {
  letterhead: "Letterhead",
  invoice: "Invoice / billhead",
  envelope: "Envelope",
  "business-card": "Visiting card",
};

export function ComplianceReport({ brand }: { brand: ComplianceInput }) {
  const audit = auditBrand(brand);
  const docs = Object.keys(audit.byDoc) as DocType[];

  return (
    <section className="rounded-lg border border-slate-200">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Compliance report
          </h2>
          <p className="text-xs text-slate-500">
            {entityLabel(brand.entityType)} · India
          </p>
        </div>
        <StatusPill status={audit.status} />
      </header>

      <div className="divide-y divide-slate-200">
        {docs.map((doc) => {
          const result = audit.byDoc[doc];
          const actionable = result.findings.filter((f) => f.severity !== "info");

          return (
            <div key={doc} className="px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-medium text-slate-900">
                  {DOC_LABELS[doc] ?? doc}
                </h3>
                <StatusPill
                  status={result.status}
                  label={
                    result.status === "pass"
                      ? "OK"
                      : `${actionable.length} issue${actionable.length === 1 ? "" : "s"}`
                  }
                />
              </div>

              {result.findings.length > 0 && (
                <ul className="mt-3 space-y-3">
                  {result.findings.map((finding) => (
                    <li
                      key={finding.id}
                      className={`rounded-md border px-4 py-3 ${SEVERITY_STYLE[finding.severity]}`}
                    >
                      <div className="flex flex-wrap items-baseline gap-x-2">
                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          {SEVERITY_LABEL[finding.severity]}
                        </span>
                        <span className="text-sm font-semibold text-slate-900">
                          {finding.title}
                        </span>
                      </div>
                      <p className="mt-1 text-sm leading-relaxed text-slate-700">
                        {finding.detail}
                      </p>
                      {finding.citation && (
                        <p className="mt-2 border-l-2 border-slate-300 pl-3 text-xs leading-relaxed text-slate-600">
                          {finding.citation}
                        </p>
                      )}
                      {finding.penalty && (
                        <p className="mt-2 text-xs font-semibold text-red-700">
                          {finding.penalty}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      <footer className="border-t border-slate-200 px-5 py-3">
        <p className="text-xs leading-relaxed text-slate-500">{audit.disclaimer}</p>
      </footer>
    </section>
  );
}

/** Compact single-document variant, for an editor sidebar. */
export function DocumentCompliance({
  brand,
  docType,
}: {
  brand: ComplianceInput;
  docType: DocType;
}) {
  const result = validateStationery(brand, docType);

  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-900">Compliance</h3>
        <StatusPill status={result.status} />
      </div>
      {result.findings.length === 0 ? (
        <p className="mt-2 text-sm text-slate-600">
          Every required particular is present on this document.
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {result.findings.map((f) => (
            <li key={f.id} className="text-sm">
              <span
                className={
                  f.severity === "fail"
                    ? "font-semibold text-red-700"
                    : f.severity === "warn"
                      ? "font-semibold text-amber-800"
                      : "font-medium text-slate-600"
                }
              >
                {f.title}
              </span>
              <span className="block text-xs leading-relaxed text-slate-600">
                {f.detail}
              </span>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-xs leading-relaxed text-slate-400">
        {result.disclaimer}
      </p>
    </div>
  );
}
