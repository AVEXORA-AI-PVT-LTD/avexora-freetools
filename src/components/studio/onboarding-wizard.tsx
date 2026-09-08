"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ENTITY_TYPES, type EntityType } from "@/studio/compliance/india";
import { resolveTokens } from "@/studio/engine/tokens";
import { composeLogo } from "@/studio/engine/logo";
import { getPalette } from "@/studio/engine/palettes";
import { getFontPair } from "@/studio/engine/fonts";
import type { BrandDirection } from "@/studio/ai/brand-brief";

/**
 * Two-step onboarding: particulars, then pick a direction.
 *
 * Step 1 collects statutory fields up front rather than treating them as an
 * afterthought — the compliance report is the product's hook, and it needs the
 * CIN before it can say anything useful.
 */

const TONES = [
  "modern",
  "professional",
  "trustworthy",
  "premium",
  "approachable",
  "technical",
  "traditional",
  "bold",
];

const inputCls =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none";
const labelCls = "block text-xs font-medium text-slate-600 mb-1";

interface FormState {
  name: string;
  industry: string;
  entityType: EntityType;
  description: string;
  audience: string;
  legalName: string;
  cin: string;
  llpin: string;
  gstin: string;
  pan: string;
  registeredAddress: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  website: string;
}

const EMPTY: FormState = {
  name: "",
  industry: "",
  entityType: "pvt-ltd",
  description: "",
  audience: "",
  legalName: "",
  cin: "",
  llpin: "",
  gstin: "",
  pan: "",
  registeredAddress: "",
  city: "",
  state: "",
  pincode: "",
  phone: "",
  email: "",
  website: "",
};

export function OnboardingWizard() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [tone, setTone] = useState<string[]>(["professional"]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [upgradeHint, setUpgradeHint] = useState(false);
  const [brandId, setBrandId] = useState<string | null>(null);
  const [directions, setDirections] = useState<BrandDirection[] | null>(null);
  const [source, setSource] = useState<"ai" | "heuristic">("heuristic");
  const [chosen, setChosen] = useState(0);

  const set = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));

  const isCompany = ["pvt-ltd", "public-ltd", "opc"].includes(form.entityType);
  const isLlp = form.entityType === "llp";

  async function submitDetails(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setUpgradeHint(false);

    // Only send the fields that apply to the chosen entity type — an LLPIN on
    // a Pvt Ltd would just be noise in the record.
    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      industry: form.industry.trim(),
      entityType: form.entityType,
      tone,
    };
    for (const key of [
      "description",
      "audience",
      "legalName",
      "gstin",
      "pan",
      "registeredAddress",
      "city",
      "state",
      "pincode",
      "phone",
      "email",
      "website",
    ] as const) {
      const value = form[key].trim();
      if (value) payload[key] = value;
    }
    if (isCompany && form.cin.trim()) payload.cin = form.cin.trim();
    if (isLlp && form.llpin.trim()) payload.llpin = form.llpin.trim();

    try {
      const res = await fetch("/api/studio/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status === 401) {
        router.push("/studio/signin?next=/studio/app/new");
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not create the brand.");
        setUpgradeHint(res.status === 402);
        return;
      }

      setBrandId(data.brand.id);
      setDirections(data.directions);
      setSource(data.source);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  async function chooseDirection() {
    if (!brandId || !directions) return;
    setBusy(true);
    setError(null);
    const direction = directions[chosen];

    try {
      const res = await fetch(`/api/studio/brands/${brandId}/kit`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paletteId: direction.paletteId,
          fontPairId: direction.fontPairId,
          markStyle: direction.markStyle,
          markSeed: direction.markSeed,
          tagline: direction.taglines[0],
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Could not save your choice.");
        return;
      }
      router.push(`/studio/app/${brandId}`);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  if (directions && brandId) {
    return (
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Pick a direction
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Three options for {form.name}.{" "}
          {source === "heuristic" &&
            "Generated from the curated design system — AI curation is off in this environment."}
        </p>

        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {directions.map((direction, i) => {
            const tokens = resolveTokens(
              { name: form.name, tagline: direction.taglines[0] },
              direction,
            );
            const logo = composeLogo(tokens, { layout: "stacked" });
            const palette = getPalette(direction.paletteId);
            const selected = chosen === i;

            return (
              <button
                key={`${direction.paletteId}-${i}`}
                type="button"
                onClick={() => setChosen(i)}
                aria-pressed={selected}
                className={`rounded-lg border p-5 text-left transition ${
                  selected
                    ? "border-orange-500 ring-2 ring-orange-500"
                    : "border-slate-200 hover:border-slate-400"
                }`}
              >
                <div
                  className="mx-auto flex h-36 items-center justify-center [&>svg]:h-full [&>svg]:w-auto"
                  dangerouslySetInnerHTML={{ __html: logo.svg }}
                />
                <h2 className="mt-4 text-sm font-semibold text-slate-900">
                  {direction.label}
                </h2>
                <div className="mt-2 flex gap-1.5">
                  {[palette.primary, palette.secondary, palette.accent].map((c) => (
                    <span
                      key={c}
                      className="h-5 w-5 rounded-full ring-1 ring-inset ring-black/10"
                      style={{ backgroundColor: c }}
                      title={c}
                    />
                  ))}
                </div>
                <p className="mt-3 text-xs text-slate-500">
                  {getFontPair(direction.fontPairId).name}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  {direction.rationale}
                </p>
              </button>
            );
          })}
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <div className="mt-8 flex gap-3">
          <button
            type="button"
            onClick={chooseDirection}
            disabled={busy}
            className="rounded-md bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 disabled:bg-slate-300"
          >
            {busy ? "Saving…" : "Use this direction"}
          </button>
          <button
            type="button"
            onClick={() => router.push(`/studio/app/${brandId}`)}
            className="rounded-md border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:border-slate-400"
          >
            Decide later
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submitDetails}>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">
        Create your brand
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-600">
        The statutory fields drive the compliance engine. Leave anything you
        don&apos;t have yet blank — we&apos;ll tell you exactly what&apos;s missing and
        why it matters.
      </p>

      <fieldset className="mt-8 space-y-4">
        <legend className="text-sm font-semibold text-slate-900">The business</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls} htmlFor="name">
              Trading name *
            </label>
            <input
              id="name"
              required
              maxLength={120}
              className={inputCls}
              value={form.name}
              onChange={(e) => set({ name: e.target.value })}
              placeholder="Northwind Labs"
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="industry">
              Industry *
            </label>
            <input
              id="industry"
              required
              maxLength={80}
              className={inputCls}
              value={form.industry}
              onChange={(e) => set({ industry: e.target.value })}
              placeholder="SaaS, logistics, food…"
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="entityType">
              Entity type *
            </label>
            <select
              id="entityType"
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
            <label className={labelCls} htmlFor="legalName">
              Registered legal name
            </label>
            <input
              id="legalName"
              maxLength={200}
              className={inputCls}
              value={form.legalName}
              onChange={(e) => set({ legalName: e.target.value })}
              placeholder="Northwind Labs Private Limited"
            />
          </div>
        </div>

        <div>
          <label className={labelCls} htmlFor="description">
            What does the business do?
          </label>
          <textarea
            id="description"
            rows={2}
            maxLength={600}
            className={inputCls}
            value={form.description}
            onChange={(e) => set({ description: e.target.value })}
            placeholder="Warehouse management software for mid-sized Indian retailers."
          />
        </div>

        <div>
          <span className={labelCls}>Tone</span>
          <div className="flex flex-wrap gap-2">
            {TONES.map((t) => {
              const on = tone.includes(t);
              return (
                <button
                  key={t}
                  type="button"
                  aria-pressed={on}
                  onClick={() =>
                    setTone((prev) =>
                      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t].slice(0, 4),
                    )
                  }
                  className={`rounded-full border px-3 py-1 text-xs font-medium ${
                    on
                      ? "border-orange-500 bg-orange-50 text-orange-800"
                      : "border-slate-300 text-slate-600 hover:border-slate-400"
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>
      </fieldset>

      <fieldset className="mt-8 space-y-4">
        <legend className="text-sm font-semibold text-slate-900">
          Statutory particulars
        </legend>
        <p className="text-xs text-slate-500">
          {isCompany
            ? "A company must print its name, registered office address and CIN on all business letters and billheads — Companies Act 2013, s.12(3)(c)."
            : isLlp
              ? "An LLP must print its name, registered office address and LLPIN on invoices, correspondence and official publications — LLP Act 2008, s.21."
              : "Unincorporated businesses have no CIN. GST-registered businesses must show their GSTIN on tax invoices."}
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          {isCompany && (
            <div>
              <label className={labelCls} htmlFor="cin">
                CIN
              </label>
              <input
                id="cin"
                maxLength={30}
                className={inputCls}
                value={form.cin}
                onChange={(e) => set({ cin: e.target.value })}
                placeholder="U72900KA2020PTC123456"
              />
            </div>
          )}
          {isLlp && (
            <div>
              <label className={labelCls} htmlFor="llpin">
                LLPIN
              </label>
              <input
                id="llpin"
                maxLength={20}
                className={inputCls}
                value={form.llpin}
                onChange={(e) => set({ llpin: e.target.value })}
                placeholder="AAB-1234"
              />
            </div>
          )}
          <div>
            <label className={labelCls} htmlFor="gstin">
              GSTIN
            </label>
            <input
              id="gstin"
              maxLength={20}
              className={inputCls}
              value={form.gstin}
              onChange={(e) => set({ gstin: e.target.value })}
              placeholder="29AABCU9603R1ZM"
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="pan">
              PAN
            </label>
            <input
              id="pan"
              maxLength={15}
              className={inputCls}
              value={form.pan}
              onChange={(e) => set({ pan: e.target.value })}
              placeholder="AABCU9603R"
            />
          </div>
        </div>

        <div>
          <label className={labelCls} htmlFor="registeredAddress">
            Registered office address
          </label>
          <textarea
            id="registeredAddress"
            rows={2}
            maxLength={400}
            className={inputCls}
            value={form.registeredAddress}
            onChange={(e) => set({ registeredAddress: e.target.value })}
            placeholder="4th Floor, Mistry Building, Residency Road"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className={labelCls} htmlFor="city">
              City
            </label>
            <input
              id="city"
              maxLength={80}
              className={inputCls}
              value={form.city}
              onChange={(e) => set({ city: e.target.value })}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="state">
              State
            </label>
            <input
              id="state"
              maxLength={80}
              className={inputCls}
              value={form.state}
              onChange={(e) => set({ state: e.target.value })}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="pincode">
              PIN code
            </label>
            <input
              id="pincode"
              maxLength={10}
              inputMode="numeric"
              className={inputCls}
              value={form.pincode}
              onChange={(e) => set({ pincode: e.target.value })}
              placeholder="560025"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className={labelCls} htmlFor="phone">
              Telephone
            </label>
            <input
              id="phone"
              maxLength={30}
              className={inputCls}
              value={form.phone}
              onChange={(e) => set({ phone: e.target.value })}
              placeholder="+91 80 4123 9000"
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              maxLength={254}
              className={inputCls}
              value={form.email}
              onChange={(e) => set({ email: e.target.value })}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="website">
              Website
            </label>
            <input
              id="website"
              maxLength={200}
              className={inputCls}
              value={form.website}
              onChange={(e) => set({ website: e.target.value })}
            />
          </div>
        </div>
      </fieldset>

      {error && (
        <div className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
          {upgradeHint && (
            <>
              {" "}
              <Link href="/studio/pricing" className="font-semibold underline">
                See plans
              </Link>
            </>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={busy}
        className="mt-8 rounded-md bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 disabled:bg-slate-300"
      >
        {busy ? "Generating directions…" : "Generate brand directions"}
      </button>
    </form>
  );
}
