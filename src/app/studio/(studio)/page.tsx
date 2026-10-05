import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME, SITE_OG_IMAGE, SITE_URL } from "@/tools/categories";
import { getPlanAsync, formatINR } from "@/server/studio/plans";

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
    images: [SITE_OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: `${title} | ${SITE_NAME}`,
    description,
    images: [SITE_OG_IMAGE],
  },
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

export default async function StudioLandingPage() {
  const plans = await import("@/server/studio/plans").then(m => m.getAllPlans());
  const getPlanLocal = (id: string) => plans.find(p => p.id === id) || plans[0];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Avexora Brand Studio",
    applicationCategory: "DesignApplication",
    operatingSystem: "Web",
    description,
    offers: ["free", "launch", "growth", "agency"].map((id) => ({
      "@type": "Offer",
      name: getPlanLocal(id).name,
      price: (getPlanLocal(id).monthlyPaise / 100).toFixed(2),
      priceCurrency: "INR",
    })),
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 space-y-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* HERO SECTION */}
      <section className="relative overflow-hidden rounded-3xl border border-orange-200/80 bg-gradient-to-r from-orange-50/90 via-orange-50/30 to-white p-8 sm:p-12 shadow-xs space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-orange-200/80 bg-orange-50 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-orange-800 shadow-2xs">
          <svg className="w-3.5 h-3.5 text-orange-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
            <path d="M9 22v-4h6v4" />
            <path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01" />
          </svg>
          <span>Avexora Brand Studio</span>
        </div>

        <h1 className="max-w-4xl text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl leading-[1.15]">
          Business stationery that is <span className="text-orange-600 underline decoration-orange-300">legally compliant</span>, not just pretty.
        </h1>

        <p className="max-w-2xl text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
          Logo to employee ID cards in minutes — built around the statutory particulars an
          Indian company is legally required to print. Canva and Looka will
          happily sell you a non-compliant letterhead. We won&apos;t.
        </p>

        <div className="pt-2 flex flex-wrap gap-3">
          <Link
            href="/studio/app/new"
            className="rounded-xl bg-orange-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-orange-700 transition-all hover:shadow-md"
          >
            Create your brand — free →
          </Link>
          <Link
            href="/business-legal/letterhead-compliance-checker"
            className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:border-slate-400 hover:bg-slate-50 transition-colors"
          >
            Check my letterhead first
          </Link>
        </div>
      </section>

      {/* COMPLIANCE STATUTORY RULE */}
      <section className="rounded-2xl border border-amber-200/80 bg-amber-50/70 p-6 sm:p-8 space-y-3 shadow-2xs">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-900">
          <svg className="w-3.5 h-3.5 text-amber-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span>Important Legal Rule</span>
        </div>
        <h2 className="text-xl font-bold text-slate-900">
          The Companies Act rule almost every founder misses
        </h2>
        <p className="max-w-3xl text-sm leading-relaxed text-slate-700">
          Section 12(3)(c) of the Companies Act 2013 requires every company to
          print its <strong>name</strong>, the <strong>address of its registered
          office</strong> and its <strong>CIN</strong> — along with its telephone
          number and, where they exist, email and website — on all business
          letters, billheads, letter papers, notices and other official
          publications. LLPs carry the equivalent duty for their LLPIN under
          section 21 of the LLP Act.
        </p>
        <div className="rounded-xl bg-amber-100/70 border border-amber-200 p-3 text-xs font-bold text-amber-950 inline-block">
          Default attracts ₹1,000 for every day it continues, up to ₹1,00,000.
        </div>
      </section>

      {/* ASSETS INCLUDED GRID */}
      <section className="space-y-6">
        <div className="border-b border-slate-200/80 pb-3">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Everything a newly incorporated company needs
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Generated instantly with verified legal footer blocks.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ASSETS.map((asset) => (
            <div
              key={asset.name}
              className="group rounded-2xl border border-slate-200/80 bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-md space-y-1"
            >
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-orange-700 transition-colors">{asset.name}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{asset.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES LIST */}
      <section className="grid gap-6 sm:grid-cols-3">
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
          <div key={item.title} className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs space-y-2">
            <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
            <p className="text-xs sm:text-sm leading-relaxed text-slate-600">{item.body}</p>
          </div>
        ))}
      </section>

      {/* BOTTOM CTA BANNER */}
      <section className="rounded-3xl bg-slate-900 p-8 sm:p-12 text-center text-white space-y-4 shadow-xl">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
          Start free. The compliance report costs nothing.
        </h2>
        <p className="mx-auto max-w-2xl text-xs sm:text-sm text-slate-300 leading-relaxed">
          Run your CIN and GSTIN through the checker, see exactly what is missing
          and why it matters, then fix it in one click when you&apos;re ready.
          Paid plans start at <span className="font-bold text-orange-400">{formatINR(getPlanLocal("launch").monthlyPaise)}/month</span>.
        </p>
        <div className="pt-2">
          <Link
            href="/studio/app/new"
            className="inline-block rounded-xl bg-orange-600 px-6 py-3 text-sm font-semibold text-white hover:bg-orange-700 shadow-md transition-all"
          >
            Create your brand now →
          </Link>
        </div>
      </section>
    </main>
  );
}
