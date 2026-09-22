import type { Metadata } from "next";
import Link from "next/link";
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
  
  const defaultTitle = `${cat.name} — ${SITE_NAME}`;
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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: SITE_NAME, item: SITE_URL },
      { "@type": "ListItem", position: 2, name: cat.name, item: canonical },
    ],
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav className="text-sm text-slate-500">
        <Link href="/" className="hover:text-orange-800">
          {SITE_NAME}
        </Link>{" "}
        / <span className="text-slate-700">{cat.name}</span>
      </nav>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
        {cat.name}
      </h1>
      <p className="mt-2 max-w-2xl text-slate-600">{cat.description}</p>

      {tools.length === 0 ? (
        <p className="mt-10 rounded-lg border border-dashed border-slate-300 p-10 text-center text-slate-500">
          Tools in this category are coming soon.
        </p>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((t) => (
            <Link
              key={t.slug}
              href={`/${cat.slug}/${t.slug}`}
              className="rounded-xl border border-slate-200 p-5 transition hover:border-orange-300 hover:shadow-sm"
            >
              <h2 className="font-semibold text-slate-900">{t.name}</h2>
              <p className="mt-1 text-sm text-slate-600">{t.tagline}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
