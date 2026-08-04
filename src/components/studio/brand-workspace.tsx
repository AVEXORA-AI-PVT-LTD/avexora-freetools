"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Brand, BrandKit, Employee } from "@prisma/client";
import { toComplianceInput, toTokens } from "@/studio/brand-context";
import { composeLogo, LOGO_LAYOUTS, LOGO_VARIANTS } from "@/studio/engine/logo";
import { renderSvg } from "@/studio/engine/render/svg";
import { downloadBlob, downloadText, renderRaster, watermarkBlob } from "@/studio/engine/render/raster";
import { letterheadSpec, LETTERHEAD_VARIANTS } from "@/studio/engine/layouts/letterhead";
import { envelopeSpec, ENVELOPE_SIZES, type EnvelopeSize } from "@/studio/engine/layouts/envelope";
import { businessCardSpec } from "@/studio/engine/layouts/business-card";
import { idCardSpec } from "@/studio/engine/layouts/id-card";
import { socialPostSpec, SOCIAL_FORMATS, type SocialFormat } from "@/studio/engine/layouts/social-post";
import { emailSignatureHtml } from "@/studio/engine/layouts/email-signature";
import type { DocSpec } from "@/studio/engine/doc-spec";

type Tab =
  | "logo"
  | "letterhead"
  | "envelope"
  | "business-card"
  | "id-cards"
  | "social"
  | "signature";

const TABS: { id: Tab; label: string }[] = [
  { id: "logo", label: "Logo" },
  { id: "letterhead", label: "Letterhead" },
  { id: "envelope", label: "Envelope" },
  { id: "business-card", label: "Visiting card" },
  { id: "id-cards", label: "ID cards" },
  { id: "social", label: "Social & ads" },
  { id: "signature", label: "Email signature" },
];

const btn =
  "rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300";
const btnGhost =
  "rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-400 disabled:opacity-50";
const inputCls =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none";
const labelCls = "block text-xs font-medium text-slate-600 mb-1";

export function BrandWorkspace({
  brand,
  kit,
  employees,
  canPrintPdf,
  watermark,
}: {
  brand: Brand;
  kit: BrandKit | null;
  employees: Employee[];
  canPrintPdf: boolean;
  watermark: boolean;
}) {
  const [tab, setTab] = useState<Tab>("logo");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [upgradeTo, setUpgradeTo] = useState<string | null>(null);

  const tokens = useMemo(() => toTokens(brand, kit), [brand, kit]);
  const compliance = useMemo(() => toComplianceInput(brand), [brand]);

  // Per-tab local state
  const [logoLayout, setLogoLayout] = useState<(typeof LOGO_LAYOUTS)[number]>(
    (kit?.logoLayout as (typeof LOGO_LAYOUTS)[number]) ?? "horizontal",
  );
  const [logoVariant, setLogoVariant] = useState<(typeof LOGO_VARIANTS)[number]>("full");
  const [letterVariant, setLetterVariant] =
    useState<(typeof LETTERHEAD_VARIANTS)[number]>("classic");
  const [envelopeSize, setEnvelopeSize] = useState<EnvelopeSize>("dl");
  const [holder, setHolder] = useState({
    name: "",
    designation: "",
    phone: brand.phone ?? "",
    email: brand.email ?? "",
    website: brand.website ?? "",
  });
  const [socialFormat, setSocialFormat] = useState<SocialFormat>("square");
  const [post, setPost] = useState({
    headline: "We're open for business",
    subhead: "",
    cta: "Get in touch",
  });
  const [idOrientation, setIdOrientation] = useState<"portrait" | "landscape">("portrait");

  /** Download a print PDF from the server, surfacing entitlement failures. */
  async function exportPdf(payload: Record<string, unknown>, filename: string) {
    setBusy(true);
    setError(null);
    setUpgradeTo(null);
    try {
      const res = await fetch("/api/studio/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandId: brand.id, ...payload }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Export failed.");
        if (res.status === 402) setUpgradeTo(data.requiredPlan ?? "launch");
        return;
      }

      downloadBlob(await res.blob(), filename);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  /** Rasterise a screen asset entirely in the browser. */
  async function exportPng(spec: DocSpec, filename: string) {
    setBusy(true);
    setError(null);
    try {
      let blob = await renderRaster(spec, { scale: 1, format: "png" });
      if (watermark) blob = await watermarkBlob(blob);
      downloadBlob(blob, filename);
    } catch {
      setError("Could not render the image.");
    } finally {
      setBusy(false);
    }
  }

  const preview = (spec: DocSpec, maxHeight = 520) => (
    <div
      className="overflow-auto rounded-lg border border-slate-200 bg-slate-100 p-4"
      style={{ maxHeight }}
    >
      <div
        className="mx-auto w-full [&>svg]:h-auto [&>svg]:w-full [&>svg]:max-w-full [&>svg]:bg-white [&>svg]:shadow-sm"
        dangerouslySetInnerHTML={{ __html: renderSvg(spec, { includeBleed: false }) }}
      />
    </div>
  );

  return (
    <div>
      <nav className="flex flex-wrap gap-1 border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setTab(t.id);
              setError(null);
              setUpgradeTo(null);
            }}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${
              tab === t.id
                ? "border-indigo-600 text-indigo-700"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {error && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
          {upgradeTo && (
            <>
              {" "}
              <Link href="/studio/pricing" className="font-semibold underline">
                Upgrade to {upgradeTo}
              </Link>
            </>
          )}
        </div>
      )}

      <div className="mt-6">
        {tab === "logo" && (
          <LogoTab
            tokens={tokens}
            layout={logoLayout}
            variant={logoVariant}
            onLayout={setLogoLayout}
            onVariant={setLogoVariant}
            busy={busy}
            canPrintPdf={canPrintPdf}
            onSvg={() => {
              const logo = composeLogo(tokens, { layout: logoLayout, variant: logoVariant });
              downloadText(logo.svg, `logo-${logoLayout}-${logoVariant}.svg`);
            }}
            onPdf={() => exportPdf({ asset: "logo-pack" }, "logo-pack.pdf")}
          />
        )}

        {tab === "letterhead" && (
          <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
            {preview(
              letterheadSpec(tokens, compliance, {
                variant: letterVariant,
                showBodyPlaceholder: true,
              }),
              620,
            )}
            <aside className="space-y-4">
              <div>
                <span className={labelCls}>Style</span>
                <div className="flex flex-wrap gap-2">
                  {LETTERHEAD_VARIANTS.map((v) => (
                    <Chip
                      key={v}
                      on={letterVariant === v}
                      onClick={() => setLetterVariant(v)}
                    >
                      {v}
                    </Chip>
                  ))}
                </div>
              </div>
              <p className="text-xs leading-relaxed text-slate-500">
                A4, 210 × 297 mm. The statutory footer is placed before anything
                else so it can never be pushed off the page.
              </p>
              <button
                type="button"
                disabled={busy}
                className={btn}
                onClick={() =>
                  exportPdf(
                    { asset: "letterhead", variant: letterVariant },
                    "letterhead.pdf",
                  )
                }
              >
                {busy ? "Preparing…" : "Download print PDF"}
              </button>
              {!canPrintPdf && (
                <p className="text-xs text-amber-700">
                  Print PDFs need a paid plan.
                </p>
              )}
            </aside>
          </div>
        )}

        {tab === "envelope" && (
          <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
            {preview(envelopeSpec(tokens, compliance, { size: envelopeSize }), 420)}
            <aside className="space-y-4">
              <div>
                <span className={labelCls}>Size</span>
                <div className="space-y-2">
                  {ENVELOPE_SIZES.map((s) => (
                    <label
                      key={s.value}
                      className="flex items-start gap-2 text-sm text-slate-700"
                    >
                      <input
                        type="radio"
                        name="envelope-size"
                        className="mt-1"
                        checked={envelopeSize === s.value}
                        onChange={() => setEnvelopeSize(s.value)}
                      />
                      <span>
                        {s.label}
                        <span className="block text-xs text-slate-500">{s.note}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <button
                type="button"
                disabled={busy}
                className={btn}
                onClick={() =>
                  exportPdf(
                    { asset: "envelope", envelopeSize },
                    `envelope-${envelopeSize}.pdf`,
                  )
                }
              >
                {busy ? "Preparing…" : "Download print PDF"}
              </button>
              <p className="text-xs text-slate-500">
                Includes 3 mm bleed and crop marks.
              </p>
            </aside>
          </div>
        )}

        {tab === "business-card" && (
          <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
            <div className="space-y-4">
              {preview(
                businessCardSpec(tokens, compliance, {
                  holder: { ...holder, name: holder.name || "Your name" },
                  side: "front",
                }),
                260,
              )}
              {preview(
                businessCardSpec(tokens, compliance, {
                  holder: { ...holder, name: holder.name || "Your name" },
                  side: "back",
                }),
                260,
              )}
            </div>
            <aside className="space-y-3">
              {(
                [
                  ["name", "Name"],
                  ["designation", "Designation"],
                  ["phone", "Phone"],
                  ["email", "Email"],
                  ["website", "Website"],
                ] as const
              ).map(([key, label]) => (
                <div key={key}>
                  <label className={labelCls} htmlFor={`card-${key}`}>
                    {label}
                  </label>
                  <input
                    id={`card-${key}`}
                    className={inputCls}
                    value={holder[key]}
                    onChange={(e) => setHolder({ ...holder, [key]: e.target.value })}
                  />
                </div>
              ))}
              <button
                type="button"
                disabled={busy || !holder.name.trim()}
                className={btn}
                onClick={() =>
                  exportPdf(
                    { asset: "business-card", holder: cleanHolder(holder) },
                    "business-card.pdf",
                  )
                }
              >
                {busy ? "Preparing…" : "Download print PDF"}
              </button>
              <p className="text-xs text-slate-500">
                89 × 54 mm — the Indian standard, not the US 3.5 × 2 in.
              </p>
            </aside>
          </div>
        )}

        {tab === "id-cards" && (
          <IdCardsTab
            brandId={brand.id}
            employees={employees}
            orientation={idOrientation}
            onOrientation={setIdOrientation}
            preview={(employee) =>
              preview(
                idCardSpec(tokens, compliance, {
                  employee,
                  orientation: idOrientation,
                  side: "front",
                }),
                380,
              )
            }
            busy={busy}
            onExport={() =>
              exportPdf(
                { asset: "id-cards", orientation: idOrientation },
                `id-cards-${employees.length}.pdf`,
              )
            }
          />
        )}

        {tab === "social" && (
          <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
            {preview(
              socialPostSpec(tokens, compliance, {
                ...post,
                subhead: post.subhead || undefined,
                cta: post.cta || undefined,
                format: socialFormat,
                handle: brand.website ?? undefined,
              }),
              560,
            )}
            <aside className="space-y-3">
              <div>
                <label className={labelCls} htmlFor="social-format">
                  Format
                </label>
                <select
                  id="social-format"
                  className={inputCls}
                  value={socialFormat}
                  onChange={(e) => setSocialFormat(e.target.value as SocialFormat)}
                >
                  {SOCIAL_FORMATS.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-slate-500">
                  {SOCIAL_FORMATS.find((f) => f.value === socialFormat)?.note}
                </p>
              </div>
              <div>
                <label className={labelCls} htmlFor="social-headline">
                  Headline
                </label>
                <textarea
                  id="social-headline"
                  rows={2}
                  className={inputCls}
                  value={post.headline}
                  onChange={(e) => setPost({ ...post, headline: e.target.value })}
                />
              </div>
              <div>
                <label className={labelCls} htmlFor="social-subhead">
                  Subhead
                </label>
                <input
                  id="social-subhead"
                  className={inputCls}
                  value={post.subhead}
                  onChange={(e) => setPost({ ...post, subhead: e.target.value })}
                />
              </div>
              <div>
                <label className={labelCls} htmlFor="social-cta">
                  Call to action
                </label>
                <input
                  id="social-cta"
                  className={inputCls}
                  value={post.cta}
                  onChange={(e) => setPost({ ...post, cta: e.target.value })}
                />
              </div>
              <button
                type="button"
                disabled={busy}
                className={btn}
                onClick={() =>
                  exportPng(
                    socialPostSpec(tokens, compliance, {
                      ...post,
                      subhead: post.subhead || undefined,
                      cta: post.cta || undefined,
                      format: socialFormat,
                      handle: brand.website ?? undefined,
                    }),
                    `${socialFormat}.png`,
                  )
                }
              >
                {busy ? "Rendering…" : "Download PNG"}
              </button>
              <p className="text-xs text-slate-500">
                Rendered in your browser — the image is never uploaded.
                {watermark && " Free-plan exports carry a watermark."}
              </p>
            </aside>
          </div>
        )}

        {tab === "signature" && (
          <SignatureTab
            html={emailSignatureHtml(tokens, compliance, {
              name: holder.name || "Your name",
              designation: holder.designation || undefined,
              phone: holder.phone || undefined,
              email: holder.email || undefined,
            })}
          />
        )}
      </div>
    </div>
  );
}

function cleanHolder(holder: Record<string, string>) {
  const out: Record<string, string> = { name: holder.name.trim() };
  for (const key of ["designation", "phone", "email", "website"]) {
    const value = holder[key]?.trim();
    if (value) out[key] = value;
  }
  return out;
}

function Chip({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs font-medium capitalize ${
        on
          ? "border-indigo-500 bg-indigo-50 text-indigo-700"
          : "border-slate-300 text-slate-600 hover:border-slate-400"
      }`}
    >
      {children}
    </button>
  );
}

function LogoTab({
  tokens,
  layout,
  variant,
  onLayout,
  onVariant,
  busy,
  canPrintPdf,
  onSvg,
  onPdf,
}: {
  tokens: ReturnType<typeof toTokens>;
  layout: (typeof LOGO_LAYOUTS)[number];
  variant: (typeof LOGO_VARIANTS)[number];
  onLayout: (l: (typeof LOGO_LAYOUTS)[number]) => void;
  onVariant: (v: (typeof LOGO_VARIANTS)[number]) => void;
  busy: boolean;
  canPrintPdf: boolean;
  onSvg: () => void;
  onPdf: () => void;
}) {
  const logo = composeLogo(tokens, { layout, variant });
  const dark = variant === "mono-light";

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <div
        className="flex min-h-72 items-center justify-center rounded-lg border border-slate-200 p-10"
        style={{ backgroundColor: dark ? tokens.palette.ink : "#ffffff" }}
      >
        <div
          className="max-h-52 w-full max-w-md [&>svg]:h-auto [&>svg]:w-full"
          dangerouslySetInnerHTML={{ __html: logo.svg }}
        />
      </div>
      <aside className="space-y-4">
        <div>
          <span className={labelCls}>Layout</span>
          <div className="flex flex-wrap gap-2">
            {LOGO_LAYOUTS.map((l) => (
              <Chip key={l} on={layout === l} onClick={() => onLayout(l)}>
                {l}
              </Chip>
            ))}
          </div>
        </div>
        <div>
          <span className={labelCls}>Variant</span>
          <div className="flex flex-wrap gap-2">
            {LOGO_VARIANTS.map((v) => (
              <Chip key={v} on={variant === v} onClick={() => onVariant(v)}>
                {v.replace("-", " ")}
              </Chip>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <button type="button" className={btnGhost} onClick={onSvg}>
            Download SVG
          </button>
          <button type="button" disabled={busy} className={btn} onClick={onPdf}>
            {busy ? "Preparing…" : "Download logo pack (PDF)"}
          </button>
          {!canPrintPdf && (
            <p className="text-xs text-amber-700">
              The vector logo pack needs a paid plan.
            </p>
          )}
        </div>
        <p className="text-xs leading-relaxed text-slate-500">
          Marks are drawn programmatically from a seed, not pulled from a stock
          library — so the same brand always renders the same logo, and nothing
          here is licensed from anyone else.
        </p>
      </aside>
    </div>
  );
}

function IdCardsTab({
  brandId,
  employees,
  orientation,
  onOrientation,
  preview,
  busy,
  onExport,
}: {
  brandId: string;
  employees: Employee[];
  orientation: "portrait" | "landscape";
  onOrientation: (o: "portrait" | "landscape") => void;
  preview: (employee: Employee) => React.ReactNode;
  busy: boolean;
  onExport: () => void;
}) {
  const [csv, setCsv] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function importRoster() {
    const rows = csv
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => line.split(",").map((c) => c.trim()));

    const parsed = rows
      .filter((cols) => cols[0] && cols[0].toLowerCase() !== "name")
      .map((cols) => ({
        name: cols[0],
        designation: cols[1] || undefined,
        empCode: cols[2] || undefined,
        bloodGroup: cols[3] || undefined,
      }));

    if (parsed.length === 0) {
      setMessage("No rows found. One employee per line.");
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/studio/brands/${brandId}/employees`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employees: parsed, replace: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? "Could not save the roster.");
        return;
      }
      setMessage(`${data.employees.length} employees saved. Reload to preview.`);
    } catch {
      setMessage("Could not reach the server.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        {employees.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 p-10 text-center">
            <p className="text-sm text-slate-600">
              No employees yet. Paste your roster on the right to generate a batch
              of CR80 badges.
            </p>
          </div>
        ) : (
          employees.slice(0, 3).map((employee) => (
            <div key={employee.id}>{preview(employee)}</div>
          ))
        )}
        {employees.length > 3 && (
          <p className="text-xs text-slate-500">
            Showing 3 of {employees.length}. All are included in the export.
          </p>
        )}
      </div>

      <aside className="space-y-4">
        <div>
          <span className={labelCls}>Orientation</span>
          <div className="flex gap-2">
            {(["portrait", "landscape"] as const).map((o) => (
              <Chip key={o} on={orientation === o} onClick={() => onOrientation(o)}>
                {o}
              </Chip>
            ))}
          </div>
        </div>

        <div>
          <label className={labelCls} htmlFor="roster">
            Roster — name, designation, employee code, blood group
          </label>
          <textarea
            id="roster"
            rows={6}
            className={`${inputCls} font-mono text-xs`}
            placeholder={"R Iyer, Head of Ops, NW-001, O+\nS Kulkarni, Engineer, NW-002, B+"}
            value={csv}
            onChange={(e) => setCsv(e.target.value)}
          />
          <button
            type="button"
            disabled={saving}
            className={`${btnGhost} mt-2`}
            onClick={importRoster}
          >
            {saving ? "Saving…" : "Save roster"}
          </button>
          {message && <p className="mt-2 text-xs text-slate-600">{message}</p>}
        </div>

        <button
          type="button"
          disabled={busy || employees.length === 0}
          className={btn}
          onClick={onExport}
        >
          {busy ? "Preparing…" : `Download ${employees.length} badges (PDF)`}
        </button>
        <p className="text-xs leading-relaxed text-slate-500">
          CR80, 85.6 × 54 mm — the size every badge printer and lanyard holder
          expects. Each card carries a vCard QR so scanning it saves the contact.
        </p>
      </aside>
    </div>
  );
}

function SignatureTab({ html }: { html: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </div>
      <aside className="space-y-3">
        <button
          type="button"
          className={btn}
          onClick={async () => {
            await navigator.clipboard.writeText(html);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
        >
          {copied ? "Copied" : "Copy HTML"}
        </button>
        <button
          type="button"
          className={btnGhost}
          onClick={() => downloadText(html, "email-signature.html", "text/html")}
        >
          Download .html
        </button>
        <p className="text-xs leading-relaxed text-slate-500">
          Uses an inline-styled table, which is the only layout primitive Outlook
          renders reliably. The statutory block is included because an external
          business email is correspondence.
        </p>
        <p className="text-xs text-slate-500">
          Card holder details come from the Visiting card tab.
        </p>
      </aside>
    </div>
  );
}
