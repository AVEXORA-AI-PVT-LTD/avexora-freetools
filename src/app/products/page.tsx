import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME, SITE_URL } from "@/tools/categories";
import { AVEXORA_ORGANIZATION, AVEXORA_PRODUCTS, productUrl } from "@/config/avexora-products";
import { HeaderNav } from "@/components/editorial/header-nav";
import { FooterSection } from "@/components/editorial/footer-section";
import { ArrowLeft, ExternalLink, Sparkles, CheckCircle2 } from "lucide-react";

const CANONICAL = `${SITE_URL}/products`;
const TITLE = "Avexora Products: AI CRM, WhatsApp API, Voice Agents & More";
const DESCRIPTION =
  "Explore Avexora's business software: AI CRM, AvexWA WhatsApp Business API, AI EBOS, AI voice agents in Indian languages and ExamOS OMR exam software.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: CANONICAL },
  openGraph: { title: TITLE, description: DESCRIPTION, url: CANONICAL, siteName: SITE_NAME, type: "website" },
};

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Avexora products",
    url: CANONICAL,
    numberOfItems: AVEXORA_PRODUCTS.length,
    itemListElement: AVEXORA_PRODUCTS.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "SoftwareApplication",
        name: p.name,
        url: p.url,
        description: p.description,
        applicationCategory: p.category,
        operatingSystem: "Web",
        publisher: AVEXORA_ORGANIZATION,
      },
    })),
  },
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: SITE_NAME, item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Avexora products", item: CANONICAL },
    ],
  },
];

export default function ProductsPage() {
  return (
    <div className="min-h-screen bg-white text-stone-900 font-sans selection:bg-orange-500 selection:text-white flex flex-col justify-between relative">
      <div className="absolute inset-0 bg-matrix-grid opacity-35 pointer-events-none" />
      <HeaderNav />

      <div className="flex-1 pt-24 sm:pt-28 pb-16 relative z-10">
        <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-10">
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

          {/* Back to Tools Navigation */}
          <div className="flex items-center justify-between pb-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-mono font-semibold text-stone-600 hover:text-orange-600 bg-white border border-stone-200 hover:border-orange-300 px-3.5 py-2 rounded-xl shadow-2xs transition group"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              <span>Back to Avexora Free Tools Website</span>
            </Link>
            <div className="flex items-center gap-2 text-xs font-mono text-stone-500 bg-stone-50 border border-stone-200/80 px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Enterprise Suite</span>
            </div>
          </div>

          {/* Hero Header */}
          <div className="relative overflow-hidden rounded-3xl border border-orange-200/90 bg-gradient-to-br from-orange-50/80 via-white to-amber-50/40 p-8 sm:p-12 shadow-xl space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-200/80 bg-orange-100/70 px-3.5 py-1 text-xs font-mono font-bold uppercase tracking-wider text-orange-800 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-orange-600" />
              <span>ECOSYSTEM PLATFORM</span>
            </div>

            <div>
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-stone-900">Avexora Enterprise Products</h1>
              <p className="mt-3 max-w-2xl text-xs sm:text-sm text-stone-600 leading-relaxed">
                Beyond 130+ free business utilities, Avexora builds state-of-the-art enterprise software for
                sales, automated WhatsApp marketing, AI voice agents in Indian regional languages and academic assessments.
              </p>
            </div>

            <nav aria-label="Products on this page" className="pt-2 flex flex-wrap gap-2">
              {AVEXORA_PRODUCTS.map((p) => (
                <a
                  key={p.id}
                  href={`#${p.id}`}
                  className="rounded-full border border-orange-200/90 bg-white px-3.5 py-1.5 text-xs font-medium text-stone-700 transition hover:bg-orange-50 hover:border-orange-300 hover:text-orange-600 shadow-2xs"
                >
                  {p.name}
                </a>
              ))}
            </nav>
          </div>

          <div className="space-y-6">
            {AVEXORA_PRODUCTS.map((p) => (
              <section
                key={p.id}
                id={p.id}
                aria-labelledby={`${p.id}-heading`}
                className="scroll-mt-28 rounded-3xl border border-stone-200/90 bg-white p-6 sm:p-8 shadow-2xs hover:border-orange-300 hover:shadow-md transition-all space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-orange-100/80 px-3 py-1 text-[11px] font-mono font-bold uppercase tracking-wider text-orange-800 border border-orange-200">
                    {p.kind}
                  </span>
                </div>

                <h2 id={`${p.id}-heading`} className="text-2xl font-extrabold text-stone-900">
                  {p.name}
                </h2>
                <p className="text-sm font-semibold text-orange-600">{p.tagline}</p>
                <p className="text-xs sm:text-sm leading-relaxed text-stone-600">{p.description}</p>
                
                <div className="pt-2">
                  <span className="text-xs font-mono font-bold text-stone-900 uppercase tracking-wider block mb-2">Key Highlights:</span>
                  <ul className="space-y-2 text-xs sm:text-sm text-stone-700">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <p className="text-xs text-stone-500">
                    <span className="font-bold text-stone-800">Target Audience:</span> {p.audience}
                  </p>
                  <a
                    href={productUrl(p, "products-page")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-orange-glow !text-white px-5 py-2.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm transition self-start sm:self-auto"
                  >
                    <span>Visit {p.name}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </section>
            ))}
          </div>
        </main>
      </div>

      <FooterSection />
    </div>
  );
}
