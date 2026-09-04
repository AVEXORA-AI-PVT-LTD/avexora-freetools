import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME, SITE_URL } from "@/tools/categories";
import { PLANS, PLAN_ORDER, formatINR } from "@/server/studio/plans";

const title = "Brand Studio — compliance-ready business stationery for Indian startups";
const description =
  "Generate your logo, letterhead, envelopes, visiting cards, employee ID cards, social posts and ads — with the CIN and registered-office particulars the Companies Act actually requires.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/studio` },
  openGraph: {
    title: `${title} | ${SITE_NAME}`,
    description,
    url: `${SITE_URL}/studio`,
    siteName: SITE_NAME,
    type: "website",
  },
  twitter: { card: "summary_large_image", title, description },
};

const ASSETS = [
  { name: "Logo suite", detail: "SVG, PNG, mono, reversed — four layouts" },
  { name: "Letterhead", detail: "A4 with the statutory footer block" },
  { name: "Envelopes", detail: "DL, C5 and C4 with bleed and crop marks" },
  { name: "Visiting cards", detail: "89 × 54 mm — the Indian standard size" },
  { name: "Employee ID cards", detail: "CR80 badges with vCard QR, generated in batches" },
  { name: "Social posts", detail: "Square, portrait, story and link-preview sizes" },
  { name: "Ad creatives", detail: "Meta feed and Google Display units" },
  { name: "Email signatures", detail: "Inline-styled HTML that survives Outlook" },
];

export default function StudioLandingPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Avexora Brand Studio",
    applicationCategory: "DesignApplication",
    operatingSystem: "Web",
    description,
    offers: PLAN_ORDER.map((id) => ({
      "@type": "Offer",
      name: PLANS[id].name,
      price: (PLANS[id].monthlyPaise / 100).toFixed(2),
      priceCurrency: "INR",
    })),
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
          Avexora Brand Studio
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Business stationery that is <span className="text-indigo-600">correct</span>,
          not just pretty
        </h1>
        <p className="mt-5 text-lg text-slate-600">
          Logo to employee ID cards in minutes — built around the particulars an
          Indian company is legally required to print. Canva and Looka will
          happily sell you a non-compliant letterhead. We won&apos;t.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/studio/app/new"
            className="rounded-md bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Create your brand — free
          </Link>
          <Link
            href="/business-legal/letterhead-compliance-checker"
            className="rounded-md border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:border-slate-400"
          >
            Check my letterhead first
          </Link>
        </div>
      </section>

      <section className="mt-14 rounded-lg border border-amber-200 bg-amber-50 p-6">
        <h2 className="text-lg font-semibold text-slate-900">
          The rule almost every founder misses
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-700">
          Section 12(3)(c) of the Companies Act 2013 requires every company to
          print its <strong>name</strong>, the <strong>address of its registered
          office</strong> and its <strong>CIN</strong> — along with its telephone
          number and, where they exist, email and website — on all business
          letters, billheads, letter papers, notices and other official
          publications. LLPs carry the equivalent duty for their LLPIN under
          section 21 of the LLP Act.
        </p>
        <p className="mt-3 text-sm font-medium text-amber-900">
          Default attracts ₹1,000 for every day it continues, up to ₹1,00,000.
        </p>
        <p className="mt-3 text-xs text-slate-500">
          This is an automated formatting check, not legal advice. Confirm with
          your company secretary or chartered accountant.
        </p>
      </section>

      <section className="mt-14">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Everything a newly incorporated company needs
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ASSETS.map((asset) => (
            <div
              key={asset.name}
              className="rounded-lg border border-slate-200 p-4"
            >
              <h3 className="text-sm font-semibold text-slate-900">{asset.name}</h3>
              <p className="mt-1 text-sm text-slate-600">{asset.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-14 grid gap-6 sm:grid-cols-3">
        {[
          {
            title: "Vector, not pixels",
            body: "Logos are composed as real SVG and print PDFs are true vector with bleed and crop marks. Send them straight to a press.",
          },
          {
            title: "ID cards from your employee list",
            body: "HR platforms track that a badge is due; design tools have the template but none of your data. We generate the batch from the roster.",
          },
          {
            title: "Honest billing",
            body: "Monthly by default, a reminder seven days before every charge, and cancellation in one click. No retention maze.",
          },
        ].map((item) => (
          <div key={item.title}>
            <h3 className="text-base font-semibold text-slate-900">{item.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.body}</p>
          </div>
        ))}
      </section>

      <section className="mt-14 rounded-lg bg-slate-900 p-8 text-center">
        <h2 className="text-2xl font-bold text-white">
          Start free. The compliance report costs nothing.
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-300">
          Run your CIN and GSTIN through the checker, see exactly what is missing
          and why it matters, then fix it in one click when you&apos;re ready.
          Paid plans start at {formatINR(PLANS.launch.monthlyPaise)}/month.
        </p>
        <Link
          href="/studio/app/new"
          className="mt-6 inline-block rounded-md bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100"
        >
          Create your brand
        </Link>
      </section>
    </main>
  );
}
