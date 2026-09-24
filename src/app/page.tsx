import Link from "next/link";
import { SITE_NAME, SITE_URL } from "@/tools/categories";
import { DISPLAYED_TOOL_COUNT } from "@/tools/registry";
import { buildSearchItems, type SearchItem } from "@/components/tools/search-items";
import { ToolSearch } from "@/components/tools/tool-search";
import { getEffectiveCategories } from "@/server/categories";
import { AVEXORA_ORGANIZATION } from "@/config/avexora-products";
import { STUDIO_ASSETS } from "@/studio/assets";
import { getPlanAsync, formatINR } from "@/server/studio/plans";

const homepageJsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description:
      "Free calculators, generators, PDF & image utilities and AI writing tools for your business.",
  },
  { "@context": "https://schema.org", ...AVEXORA_ORGANIZATION },
];



import { getEffectiveToolsByCategory } from "@/server/tools";
import { getHomepageSections } from "@/server/homepage-service";

export default async function HomePage() {
  const effectiveCategories = await getEffectiveCategories();
  const effectiveToolsByCategory = await getEffectiveToolsByCategory();
  const searchItems: SearchItem[] = buildSearchItems(effectiveCategories, effectiveToolsByCategory);
  
  const sections = await getHomepageSections();
  const heroConfig = sections.find(s => s.sectionKey === "hero");
  const brandStudioConfig = sections.find(s => s.sectionKey === "brand_studio");
  const categoriesConfig = sections.find(s => s.sectionKey === "categories");
  const popularToolsConfig = sections.find(s => s.sectionKey === "popular_tools");

  const heroTitle = heroConfig?.heading || "";
  const heroDescription = heroConfig?.description || "";
  const searchPlaceholder = heroConfig?.config?.searchPlaceholder || "Search from 130+ free tools...";


  return (
    <div className="mx-auto max-w-6xl px-4">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homepageJsonLd) }}
      />
      {heroConfig?.enabled && (<section className="py-16 text-center">
        <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          {heroTitle}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
          {heroDescription}
        </p>
        <div className="mt-8">
          <ToolSearch items={searchItems} displayCount={DISPLAYED_TOOL_COUNT} />
        </div>
      </section>)}

      {brandStudioConfig?.enabled && (<section id="brand-studio" className="pb-16">
        <div className="rounded-2xl border border-orange-200 bg-orange-50/60 p-8 sm:p-10">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-xl">
              <p className="text-sm font-semibold uppercase tracking-wide text-orange-700">
                Avexora Brand Studio
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Business stationery that is correct, not just pretty
              </h2>
              <p className="mt-3 text-slate-600">
                Logo to employee ID cards in minutes — built around the name,
                registered office and CIN particulars an Indian company is legally
                required to print under section 12(3)(c) of the Companies Act.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/studio"
                  className="rounded-md bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-700"
                >
                  Explore Brand Studio
                </Link>
                <Link
                  href="/studio/pricing"
                  className="rounded-md border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:border-slate-400"
                >
                  See pricing
                </Link>
              </div>
              <p className="mt-3 text-xs text-slate-500">
                Free to start — the compliance report costs nothing. Paid plans from{" "}
                {formatINR((await getPlanAsync("launch")).monthlyPaise)}/month.
              </p>
            </div>

            <ul className="grid flex-1 gap-x-6 gap-y-2 sm:grid-cols-2 lg:max-w-md">
              {STUDIO_ASSETS.map((asset) => (
                <li key={asset.name} className="flex gap-2 text-sm text-slate-700">
                  <span aria-hidden className="text-orange-700">
                    •
                  </span>
                  <span>{asset.name}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>)}

      {categoriesConfig?.enabled && (<section id="categories" className="pb-20">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {effectiveCategories.map((c) => {
            const tools = effectiveToolsByCategory[c.slug] || [];
            return (
              <div
                key={c.slug}
                className="flex flex-col rounded-xl border border-slate-200 p-6 transition hover:border-orange-300 hover:shadow-sm"
              >
                <h2 className="text-lg font-semibold text-slate-900">
                  <Link href={`/${c.slug}`} className="hover:text-orange-800">
                    {c.name}
                  </Link>
                </h2>
                <p className="mt-1 flex-1 text-sm text-slate-600">{c.description}</p>
                {tools.length > 0 && (
                  <ul className="mt-3 space-y-1">
                    {tools.slice(0, 4).map((t) => (
                      <li key={t.slug}>
                        <Link
                          href={`/${c.slug}/${t.slug}`}
                          className="text-sm text-orange-700 hover:text-orange-900 hover:underline"
                        >
                          {t.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="mt-3 text-xs font-medium text-slate-400">
                  {tools.length > 0
                    ? `${tools.length} tool${tools.length > 1 ? "s" : ""} live`
                    : "Coming soon"}
                </p>
              </div>
            );
          })}
        </div>
      </section>)}
    </div>
  );
}
