import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME, SITE_URL } from "@/tools/categories";
import { AVEXORA_ORGANIZATION, AVEXORA_PRODUCTS, productUrl } from "@/config/avexora-products";

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
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl border border-orange-200/80 bg-gradient-to-r from-orange-50/90 via-orange-50/30 to-white p-8 sm:p-10 shadow-xs space-y-4">
        <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Link href="/" className="hover:text-orange-600 transition-colors">
            {SITE_NAME}
          </Link>
          <span>/</span>
          <span className="text-orange-700 font-bold">Products</span>
        </nav>

        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">Avexora Products</h1>
          <p className="mt-2 max-w-2xl text-xs sm:text-sm text-slate-600 leading-relaxed">
            {SITE_NAME} is built by Avexora. Beyond these free tools, Avexora makes enterprise business software for
            sales, customer messaging, AI automation, phone calls and exams.
          </p>
        </div>

        <nav aria-label="Products on this page" className="pt-2 flex flex-wrap gap-2">
          {AVEXORA_PRODUCTS.map((p) => (
            <a
              key={p.id}
              href={`#${p.id}`}
              className="rounded-full border border-orange-200/80 bg-orange-50/80 px-3.5 py-1 text-xs font-medium text-orange-900 transition hover:bg-orange-100 hover:border-orange-300"
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
            className="scroll-mt-20 rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-2xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="rounded-lg bg-orange-100/80 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-orange-800">
                {p.kind}
              </span>
            </div>

            <h2 id={`${p.id}-heading`} className="text-xl font-extrabold text-slate-900 pt-1">
              {p.name}
            </h2>
            <p className="text-sm font-semibold text-slate-800">{p.tagline}</p>
            <p className="text-xs sm:text-sm leading-relaxed text-slate-600">{p.description}</p>
            
            <div className="pt-2">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block mb-2">Key Features:</span>
              <ul className="space-y-1.5 text-xs sm:text-sm text-slate-700">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="text-orange-600 font-bold">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <p className="text-xs text-slate-500">
                <span className="font-bold text-slate-800">Best for:</span> {p.audience}
              </p>
              <a
                href={productUrl(p, "products-page")}
                target="_blank"
                rel="noopener"
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-orange-600 px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-orange-700 transition-colors self-start sm:self-auto"
              >
                <span>Visit {p.name}</span>
                <span>↗</span>
              </a>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
