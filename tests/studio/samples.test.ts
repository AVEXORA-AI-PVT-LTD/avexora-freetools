import fs from "node:fs";
import path from "node:path";
import { describe, it } from "vitest";

import { resolveTokens } from "@/studio/engine/tokens";
import { renderPdf } from "@/studio/engine/render/pdf";
import { renderSvg } from "@/studio/engine/render/svg";
import { composeLogo, LOGO_VARIANTS } from "@/studio/engine/logo";
import { letterheadSpec } from "@/studio/engine/layouts/letterhead";
import { envelopeSpec } from "@/studio/engine/layouts/envelope";
import { businessCardSpec } from "@/studio/engine/layouts/business-card";
import { idCardSpec, idCardBatch } from "@/studio/engine/layouts/id-card";
import { socialPostSpec } from "@/studio/engine/layouts/social-post";
import { emailSignatureHtml } from "@/studio/engine/layouts/email-signature";
import { auditBrand, validateStationery } from "@/studio/compliance/india";
import type { ComplianceInput } from "@/studio/compliance/india";

/**
 * Sample renderer — a review tool, not an assertion.
 *
 * Produces one of everything the product sells from a single brand record: a
 * browsable contact sheet of SVG previews, the print-ready PDFs, and the
 * compliance report for the same brand with and without its CIN. Use it to
 * eyeball the output before a release, or to regenerate marketing samples.
 *
 *   SAMPLE_OUT=./samples npx vitest run tests/studio/samples.test.ts
 *
 * Skipped unless SAMPLE_OUT is set, so it stays out of the normal test run.
 */

const OUT = process.env.SAMPLE_OUT ?? "";

const BRAND: ComplianceInput = {
  entityType: "pvt-ltd",
  name: "Northwind Labs",
  legalName: "Northwind Labs Private Limited",
  cin: "U72900KA2021PTC145678",
  gstin: "29AAGCB7383J1Z4",
  pan: "AAGCB7383J",
  registeredAddress: "4th Floor, Prestige Tower, MG Road",
  city: "Bengaluru",
  state: "Karnataka",
  pincode: "560001",
  phone: "+91 80 4567 8900",
  email: "hello@northwind.in",
};

const TOKENS = resolveTokens(
  { name: "Northwind Labs", legalName: BRAND.legalName ?? undefined, tagline: "Ship it right" },
  { paletteId: "indigo-slate", fontPairId: "inter-inter", markStyle: "monogram", logoLayout: "horizontal" },
);

const HOLDER = {
  name: "Ananya Rao",
  designation: "Head of Operations",
  phone: "+91 98450 12345",
  email: "ananya@northwind.in",
  website: "northwind.in",
};

const EMPLOYEES = [
  { name: "Ananya Rao", designation: "Head of Operations", empCode: "NWL-004", bloodGroup: "O+", department: "Operations", phone: "+91 98450 12345", email: "ananya@northwind.in" },
  { name: "Rahul Menon", designation: "Backend Engineer", empCode: "NWL-011", bloodGroup: "B+", department: "Engineering", phone: "+91 98450 99881", email: "rahul@northwind.in" },
];

describe.runIf(OUT)("samples", () => {
  it("writes a contact sheet and print-ready PDFs", async () => {
    fs.mkdirSync(OUT, { recursive: true });

    const panels: { title: string; note: string; svg: string; maxW: number }[] = [];

    for (const variant of LOGO_VARIANTS) {
      const logo = composeLogo(TOKENS, { variant });
      panels.push({
        title: `Logo — ${variant}`,
        note: `${logo.width} × ${logo.height} units, vector`,
        svg: `<svg viewBox="${logo.viewBox}" xmlns="http://www.w3.org/2000/svg" style="background:${variant === "mono-light" ? "#1f2430" : "#fff"}">${logo.content}</svg>`,
        maxW: 260,
      });
    }

    const sheets: [string, string, ReturnType<typeof letterheadSpec>][] = [
      ["Letterhead — classic", "A4, statutory footer", letterheadSpec(TOKENS, BRAND, { variant: "classic" })],
      ["Letterhead — band", "A4", letterheadSpec(TOKENS, BRAND, { variant: "band" })],
      ["Letterhead — sidebar", "A4", letterheadSpec(TOKENS, BRAND, { variant: "sidebar" })],
      ["Envelope — DL", "220 × 110 mm + 3 mm bleed", envelopeSpec(TOKENS, BRAND, { size: "dl" })],
      ["Visiting card — front", "89 × 54 mm + bleed", businessCardSpec(TOKENS, BRAND, { holder: HOLDER, side: "front" })],
      ["Visiting card — back", "89 × 54 mm + bleed", businessCardSpec(TOKENS, BRAND, { holder: HOLDER, side: "back" })],
      ["ID card — front", "CR80 portrait, vCard QR", idCardSpec(TOKENS, BRAND, { employee: EMPLOYEES[0], side: "front" })],
      ["ID card — back", "CR80 portrait", idCardSpec(TOKENS, BRAND, { employee: EMPLOYEES[0], side: "back" })],
      ["Social — square", "1080 × 1080", socialPostSpec(TOKENS, BRAND, { headline: "Your letterhead is missing its CIN.", subhead: "Companies Act 2013, s.12(3)(c).", cta: "Fix it free", format: "square" })],
      ["Social — story", "1080 × 1920", socialPostSpec(TOKENS, BRAND, { headline: "Stationery that is correct, not just pretty.", cta: "Start free", format: "story", theme: "gradient" })],
      ["Ad — Meta feed", "1200 × 628", socialPostSpec(TOKENS, BRAND, { headline: "Incorporated last week?", subhead: "Compliant letterhead in 4 minutes.", cta: "Try it", format: "metaFeed", theme: "split" })],
      ["Ad — leaderboard", "728 × 90", socialPostSpec(TOKENS, BRAND, { headline: "Compliant stationery, instantly", format: "displayLeaderboard", theme: "light" })],
    ];

    for (const [title, note, spec] of sheets) {
      panels.push({ title, note, svg: renderSvg(spec), maxW: spec.size.unit === "mm" ? 320 : 340 });
    }

    // Print-ready PDFs.
    const pdfs: [string, Uint8Array][] = [
      ["letterhead.pdf", await renderPdf([letterheadSpec(TOKENS, BRAND, { showBodyPlaceholder: false })], { title: "Northwind Labs — letterhead", author: BRAND.legalName! })],
      ["envelope-dl.pdf", await renderPdf([envelopeSpec(TOKENS, BRAND, { size: "dl" })])],
      ["visiting-card.pdf", await renderPdf([
        businessCardSpec(TOKENS, BRAND, { holder: HOLDER, side: "front" }),
        businessCardSpec(TOKENS, BRAND, { holder: HOLDER, side: "back" }),
      ])],
      ["id-cards.pdf", await renderPdf(idCardBatch(TOKENS, BRAND, EMPLOYEES, { orientation: "portrait" }))],
      ["logo-pack.pdf", await renderPdf(LOGO_VARIANTS.map((variant) => {
        const logo = composeLogo(TOKENS, { variant });
        const width = 160;
        const height = (logo.height / logo.width) * width;
        return {
          size: { w: width, h: height + 20, unit: "mm" as const },
          background: { type: "solid" as const, color: variant === "mono-light" ? TOKENS.palette.ink : TOKENS.palette.surface },
          elements: [{ kind: "svg" as const, x: 10, y: 10, w: width - 20, h: height, viewBox: logo.viewBox, content: logo.content }],
        };
      }))],
    ];
    for (const [name, bytes] of pdfs) {
      fs.writeFileSync(path.join(OUT, name), Buffer.from(bytes));
    }

    // Compliance: the same brand with and without its CIN.
    const good = validateStationery(BRAND, "letterhead");
    const bad = validateStationery({ ...BRAND, cin: null, registeredAddress: null }, "letterhead");
    const audit = auditBrand({ ...BRAND, cin: null });

    const complianceRows = (r: typeof good) =>
      r.findings
        .map(
          (f) =>
            `<tr><td class="${f.severity}">${f.severity}</td><td><strong>${f.title}</strong><br>${f.detail}</td><td class="cite">${f.citation ?? ""}</td></tr>`,
        )
        .join("");

    const html = `<!doctype html><meta charset="utf-8"><title>Brand Studio — sample output</title>
<style>
 :root{color-scheme:light dark}
 body{font:15px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;margin:0;padding:32px;background:#f6f7f9;color:#14161a}
 @media (prefers-color-scheme:dark){body{background:#0e1014;color:#e8eaed}.card{background:#171a20;border-color:#282d37}}
 h1{font-size:24px;margin:0 0 4px} .sub{opacity:.65;margin:0 0 28px}
 h2{font-size:13px;text-transform:uppercase;letter-spacing:.08em;opacity:.6;margin:36px 0 12px}
 .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px}
 .card{background:#fff;border:1px solid #e3e6ea;border-radius:10px;padding:14px;overflow:hidden}
 .card h3{font-size:13px;margin:0 0 2px} .card p{font-size:11px;opacity:.6;margin:0 0 10px}
 .card svg{max-width:100%;height:auto;display:block;border-radius:4px}
 table{border-collapse:collapse;width:100%;font-size:13px;background:#fff;border-radius:10px;overflow:hidden}
 @media (prefers-color-scheme:dark){table{background:#171a20}}
 td{padding:8px 10px;border-bottom:1px solid #e3e6ea;vertical-align:top}
 @media (prefers-color-scheme:dark){td{border-color:#282d37}}
 td.fail{color:#b3261e;font-weight:600} td.warn{color:#8a6100;font-weight:600} td.pass{color:#146c2e;font-weight:600}
 .cite{opacity:.6;font-size:11px}
 .sig{background:#fff;border:1px solid #e3e6ea;border-radius:10px;padding:14px}
</style>
<h1>Avexora Brand Studio — sample output</h1>
<p class="sub">Every asset below was produced by the shipped engine from one brand record: <strong>Northwind Labs Private Limited</strong>, CIN ${BRAND.cin}.</p>

<h2>Logo suite</h2><div class="grid">${panels.slice(0, LOGO_VARIANTS.length).map((p) => `<div class="card"><h3>${p.title}</h3><p>${p.note}</p>${p.svg}</div>`).join("")}</div>

<h2>Stationery &amp; screen assets</h2><div class="grid">${panels.slice(LOGO_VARIANTS.length).map((p) => `<div class="card"><h3>${p.title}</h3><p>${p.note}</p>${p.svg}</div>`).join("")}</div>

<h2>Compliance — complete brand (status: ${good.status})</h2><table>${complianceRows(good) || "<tr><td colspan=3>No findings.</td></tr>"}</table>

<h2>Compliance — CIN and registered office missing (status: ${bad.status})</h2><table>${complianceRows(bad)}</table>

<h2>Brand audit without a CIN — overall ${audit.status}</h2><table>${Object.entries(audit.byDoc).map(([doc, r]) => `<tr><td class="${r.status}">${r.status}</td><td><strong>${doc}</strong><br>${r.findings.map((f) => f.title).join("; ") || "No findings."}</td><td class="cite">${r.findings.map((f) => f.citation).filter(Boolean).join(" · ")}</td></tr>`).join("")}</table>
<p class="sub" style="font-size:12px;margin-top:10px">${audit.disclaimer}</p>

<h2>Email signature</h2><div class="sig">${emailSignatureHtml(TOKENS, BRAND, HOLDER)}</div>
`;

    fs.writeFileSync(path.join(OUT, "contact-sheet.html"), html);
    fs.writeFileSync(
      path.join(OUT, "summary.json"),
      JSON.stringify(
        {
          panels: panels.length,
          pdfs: pdfs.map(([n, b]) => ({ name: n, bytes: b.byteLength })),
          complianceComplete: good.status,
          complianceMissing: { status: bad.status, findings: bad.findings.length },
        },
        null,
        2,
      ),
    );
  });
});
