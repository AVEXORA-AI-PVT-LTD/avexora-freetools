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
    <div className="mx-auto max-w-4xl px-4 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav className="text-sm text-slate-500">
        <Link href="/" className="hover:text-orange-800">
          {SITE_NAME}
        </Link>{" "}
        / <span className="text-slate-700">Products</span>
      </nav>

      <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">Avexora products</h1>
      <p className="mt-2 text-slate-600">
        {SITE_NAME} is built by Avexora. Beyond these free tools, Avexora makes business software for
        sales, customer messaging, AI automation, phone calls and exams. Here is what each product does and who
        it is for.
      </p>

      <nav aria-label="Products on this page" className="mt-6 flex flex-wrap gap-2">
        {AVEXORA_PRODUCTS.map((p) => (
          <a
            key={p.id}
            href={`#${p.id}`}
            className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-600 hover:border-orange-300 hover:text-orange-800"
          >
            {p.name}
          </a>
        ))}
      </nav>

      <div className="mt-8 space-y-6">
        {AVEXORA_PRODUCTS.map((p) => (
          <section
            key={p.id}
            id={p.id}
            aria-labelledby={`${p.id}-heading`}
            className="scroll-mt-20 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <span className="text-xs font-medium uppercase tracking-wide text-orange-700">{p.kind}</span>
            <h2 id={`${p.id}-heading`} className="mt-1 text-xl font-semibold text-slate-900">
              {p.name}
            </h2>
            <p className="mt-1 font-medium text-slate-800">{p.tagline}</p>
            <p className="mt-2 text-[15px] leading-relaxed text-slate-700">{p.description}</p>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-[15px] text-slate-700">
              {p.features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            <p className="mt-3 text-sm text-slate-600">
              <span className="font-medium text-slate-800">Best for:</span> {p.audience}
            </p>
            <a
              href={productUrl(p, "products-page")}
              target="_blank"
              rel="noopener"
              className="mt-4 inline-block rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
            >
              Visit {p.name} <span aria-hidden="true">↗</span>
            </a>
          </section>
        ))}
      </div>
    </div>
  );
}
