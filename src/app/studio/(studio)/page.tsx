import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME, SITE_OG_IMAGE, SITE_URL } from "@/tools/categories";
import { getPlanAsync, formatINR } from "@/server/studio/plans";
import { HeaderNav } from "@/components/editorial/header-nav";
import { FooterSection } from "@/components/editorial/footer-section";
import { ArrowLeft, CheckCircle2, ArrowRight, ShieldCheck, Sparkles, AlertTriangle } from "lucide-react";

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
  { name: "Letterhead", detail: "A4 with statutory legal particulars" },
  { name: "Envelopes", detail: "DL, C5 and C4 with bleed and crop marks" },
  { name: "Visiting cards", detail: "89 × 54 mm — the Indian standard size" },
  { name: "Employee ID cards", detail: "CR80 badges with vCard QR, batch ready" },
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
    <div className="min-h-screen bg-white text-stone-900 font-sans selection:bg-orange-500 selection:text-white flex flex-col justify-between relative">
      {/* Background Matrix Grid */}
      <div className="absolute inset-0 bg-matrix-grid opacity-35 pointer-events-none" />

      <HeaderNav />

      <div className="flex-1 pt-24 sm:pt-28 pb-16 relative z-10">
        <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-12">
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />

          {/* Back to Main Website Bar */}
          <div className="flex items-center justify-between pb-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-mono font-semibold text-stone-600 hover:text-orange-600 bg-white border border-stone-200 hover:border-orange-300 px-3.5 py-2 rounded-xl shadow-2xs transition group"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              <span>Back to Avexora Tools Directory</span>
            </Link>
            <div className="flex items-center gap-2 text-xs font-mono text-stone-500 bg-stone-50 border border-stone-200/80 px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Brand Studio Cloud</span>
            </div>
          </div>

          {/* HERO SECTION */}
          <section className="relative overflow-hidden rounded-3xl border border-orange-200/90 bg-gradient-to-br from-orange-50/80 via-white to-amber-50/40 p-8 sm:p-12 shadow-xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-200/80 bg-orange-100/70 px-3.5 py-1.5 text-xs font-mono font-bold uppercase tracking-wider text-orange-800 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-orange-600" />
              <span>AVEXORA BRAND STUDIO</span>
            </div>

            <h1 className="max-w-4xl text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-stone-900 leading-[1.12]">
              Business stationery that is{" "}
              <span className="text-orange-600 underline decoration-orange-300">legally compliant</span>,
              not just pretty.
            </h1>

            <p className="max-w-2xl text-base sm:text-lg text-stone-600 leading-relaxed font-normal">
              Logo to employee ID cards in minutes — built around the statutory particulars an
              Indian company is legally required to print. Canva and Looka will
              happily sell you a non-compliant letterhead. We won&apos;t.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link
                href="/studio/app/new"
                className="btn-orange-glow !text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 shadow-sm transition"
              >
                <span>Create your brand — free</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/business-legal/letterhead-compliance-checker"
                className="rounded-xl border border-stone-300 bg-white px-6 py-3 text-sm font-semibold text-stone-700 hover:border-orange-400 hover:text-orange-600 hover:bg-stone-50 transition shadow-2xs"
              >
                Check my letterhead first
              </Link>
            </div>
          </section>

          {/* COMPLIANCE STATUTORY RULE */}
          <section className="rounded-3xl border border-amber-200/90 bg-gradient-to-br from-amber-50/80 via-white to-amber-50/30 p-6 sm:p-8 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Important Legal Rule</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-stone-900">
              The Companies Act rule almost every founder misses
            </h2>
            <p className="max-w-3xl text-sm leading-relaxed text-stone-700">
              Section 12(3)(c) of the Companies Act 2013 requires every company to
              print its <strong>name</strong>, the <strong>address of its registered
              office</strong> and its <strong>CIN</strong> — along with its telephone
              number and, where they exist, email and website — on all business
              letters, billheads, letter papers, notices and other official
              publications. LLPs carry the equivalent duty for their LLPIN under
              section 21 of the LLP Act.
            </p>
            <div className="rounded-xl bg-amber-100/90 border border-amber-300 px-3.5 py-2 text-xs font-bold text-amber-950 inline-block font-mono">
              Default attracts ₹1,000 for every day it continues, up to ₹1,00,000.
            </div>
          </section>

          {/* ASSETS INCLUDED GRID */}
          <section className="space-y-6">
            <div className="border-b border-stone-200 pb-3">
              <h2 className="text-2xl font-bold tracking-tight text-stone-900">
                Everything a newly incorporated company needs
              </h2>
              <p className="text-xs sm:text-sm text-stone-500 mt-1">Generated instantly with verified statutory particulars.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {ASSETS.map((asset) => (
                <div
                  key={asset.name}
                  className="group rounded-2xl border border-stone-200/90 bg-white p-5 transition-all duration-200 hover:-translate-y-1 hover:border-orange-400 hover:shadow-md space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-stone-900 group-hover:text-orange-600 transition-colors">
                      {asset.name}
                    </h3>
                    <CheckCircle2 className="w-3.5 h-3.5 text-stone-300 group-hover:text-orange-600 transition-colors" />
                  </div>
                  <p className="text-xs text-stone-600 leading-relaxed">{asset.detail}</p>
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
                title: "ID cards from your roster",
                body: "HR platforms track that a badge is due; design tools have the template but none of your data. We generate the batch from the roster.",
              },
              {
                title: "Honest billing",
                body: "Monthly by default, a reminder seven days before every charge, and cancellation in one click. No retention maze.",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-stone-200 bg-white p-6 shadow-2xs space-y-2 hover:border-orange-300 transition-colors">
                <h3 className="text-base font-bold text-stone-900">{item.title}</h3>
                <p className="text-xs sm:text-sm leading-relaxed text-stone-600">{item.body}</p>
              </div>
            ))}
          </section>

          {/* BOTTOM CTA BANNER */}
          <section className="rounded-3xl bg-stone-900 border border-stone-800 p-8 sm:p-12 text-center text-white space-y-4 shadow-xl">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Start free. The compliance report costs nothing.
            </h2>
            <p className="mx-auto max-w-2xl text-xs sm:text-sm text-stone-300 leading-relaxed">
              Run your CIN and GSTIN through the checker, see exactly what is missing
              and why it matters, then fix it in one click when you&apos;re ready.
              Paid plans start at <span className="font-bold text-orange-400">{formatINR(getPlanLocal("launch").monthlyPaise)}/month</span>.
            </p>
            <div className="pt-2 flex justify-center">
              <Link
                href="/studio/app/new"
                className="btn-orange-glow !text-white px-6 py-3 rounded-xl font-bold text-sm inline-flex items-center gap-2 shadow-md transition"
              >
                <span>Create your brand now</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </section>
        </main>
      </div>

      <FooterSection />
    </div>
  );
}
