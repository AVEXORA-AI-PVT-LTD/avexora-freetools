import type { Metadata } from "next";
import Link from "next/link";
import { AVEXORA_ORGANIZATION } from "@/config/avexora-products";
import { notFound } from "next/navigation";
import { categories, getCategory, SITE_NAME, SITE_URL } from "@/tools/categories";
import { toolsByCategory } from "@/tools/registry";
import { resolveCategorySeo } from "@/server/seo-manager";

export const dynamicParams = false;

export function generateStaticParams() {
  return categories.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const cat = getCategory(category);
  if (!cat) return {};
  
  // The layout's title template appends the site name.
  const defaultTitle = `Free Online ${cat.name}`;
  const defaultCanonical = `${SITE_URL}/${cat.slug}`;
  
  const fallback = {
    title: defaultTitle,
    description: cat.description,
    canonical: defaultCanonical,
    siteName: SITE_NAME,
    ogImage: `${SITE_URL}/logo.png`,
  };

  return resolveCategorySeo(category, fallback);
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const cat = getCategory(category);
  if (!cat) notFound();
  const tools = toolsByCategory[cat.slug];
  const canonical = `${SITE_URL}/${cat.slug}`;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: SITE_NAME, item: SITE_URL },
        { "@type": "ListItem", position: 2, name: cat.name, item: canonical },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: cat.name,
      description: cat.description,
      url: canonical,
      publisher: AVEXORA_ORGANIZATION,
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: tools.length,
        itemListElement: tools.map((t, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: t.name,
          url: `${SITE_URL}/${cat.slug}/${t.slug}`,
        })),
      },
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl border border-orange-200/80 bg-gradient-to-r from-orange-50/90 via-orange-50/30 to-white p-8 sm:p-10 shadow-xs space-y-4">
        <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Link href="/" className="hover:text-orange-600 transition-colors">
            {SITE_NAME}
          </Link>
          <span>/</span>
          <span className="text-orange-700">{cat.name}</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
              {cat.name}
            </h1>
            <p className="mt-2 max-w-2xl text-sm sm:text-base text-slate-600 leading-relaxed">
              {cat.description}
            </p>
          </div>

          <div className="shrink-0 self-start sm:self-auto">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-200/80 bg-orange-50 px-3.5 py-1.5 text-xs font-semibold text-orange-800 shadow-2xs">
              <span className="h-2 w-2 rounded-full bg-orange-600 animate-pulse" />
              {tools.length} Free Tools Available
            </span>
          </div>
        </div>
      </div>

      {tools.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-500 bg-slate-50/50">
          <p className="font-semibold text-slate-700">Tools coming soon</p>
          <p className="mt-1 text-xs text-slate-500">We are adding new tools to {cat.name}. Check back shortly!</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
            <h2 className="text-lg font-bold text-slate-900">All {cat.name}</h2>
            <span className="text-xs text-slate-500 font-medium">100% Free • No Registration Required</span>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {tools.map((t) => (
              <Link
                key={t.slug}
                href={`/${cat.slug}/${t.slug}`}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs transition-all duration-200 hover:-translate-y-1 hover:border-orange-300 hover:shadow-xl hover:shadow-orange-500/5"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="rounded-lg bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-800 border border-orange-200/60">
                      Free Tool
                    </span>
                    <span className="text-slate-300 group-hover:text-orange-500 transition-colors text-sm">→</span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 group-hover:text-orange-700 transition-colors pt-1">
                    {t.name}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed">
                    {t.tagline}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-orange-600 group-hover:text-orange-700">
                  <span>Open Tool</span>
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
