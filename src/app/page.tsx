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
import { AdSlot } from "@/components/ads/ad-slot";

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
    <div className="mx-auto max-w-6xl px-4 space-y-16 py-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homepageJsonLd) }}
      />
      
      {/* HERO SECTION */}
      {heroConfig?.enabled && (
        <section className="pt-6 pb-10 text-center relative overflow-hidden">
          {/* Subtle warm background glow */}
          <div className="absolute top-1/2 left-1/2 -z-10 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-tr from-orange-200/30 via-orange-100/20 to-transparent blur-3xl rounded-full pointer-events-none" />

          {/* Floating Pill Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-200/80 bg-orange-50/80 px-4 py-1.5 text-xs font-semibold text-orange-800 shadow-2xs mb-6">
            <span className="flex h-2 w-2 rounded-full bg-orange-600 animate-pulse" />
            <span>130+ Free Online Tools</span>
            <span className="text-orange-300">•</span>
            <span>100% In-Browser Privacy</span>
            <span className="text-orange-300">•</span>
            <span>No Sign-Up</span>
          </div>

          <h1 className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl md:text-6xl leading-[1.15]">
            {heroTitle || "Essential online tools for smart builders, creators & businesses."}
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            {heroDescription || "Calculate, convert, compress, edit & write — completely free in your browser with zero data collection."}
          </p>

          <div className="mt-8">
            <ToolSearch items={searchItems} displayCount={DISPLAYED_TOOL_COUNT} />
          </div>

          {/* Feature Badges */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-slate-500">
            <div className="flex items-center gap-2">
              <span className="text-orange-600 font-bold">✓</span> Fast & Free Forever
            </div>
            <div className="flex items-center gap-2">
              <span className="text-orange-600 font-bold">✓</span> No File Upload to Cloud
            </div>
            <div className="flex items-center gap-2">
              <span className="text-orange-600 font-bold">✓</span> Verified Legal & Tax Rules
            </div>
          </div>
        </section>
      )}

      <AdSlot placement="homepage" />

      {/* BRAND STUDIO SPOTLIGHT BANNER */}
      {brandStudioConfig?.enabled && (
        <section id="brand-studio">
          <div className="relative overflow-hidden rounded-3xl border border-orange-200/90 bg-gradient-to-r from-orange-50/90 via-orange-50/30 to-white p-8 sm:p-10 shadow-sm">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-xl space-y-3">
                <div className="inline-flex items-center gap-2 rounded-lg bg-orange-100/80 px-3 py-1 text-xs font-bold uppercase tracking-wider text-orange-800">
                  <span>🏢 Avexora Brand Studio</span>
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  Business stationery that is legally compliant, not just pretty
                </h2>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                  Logo to employee ID cards in minutes — built around the name,
                  registered office and CIN particulars an Indian company is legally
                  required to print under section 12(3)(c) of the Companies Act.
                </p>
                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <Link
                    href="/studio"
                    className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-orange-700 transition-colors"
                  >
                    <span>Explore Brand Studio</span>
                    <span>→</span>
                  </Link>
                  <Link
                    href="/studio/pricing"
                    className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:border-slate-400 hover:bg-slate-50 transition-colors"
                  >
                    See pricing
                  </Link>
                </div>
                <p className="text-xs text-slate-500">
                  Free to start — compliance report costs nothing. Paid plans from{" "}
                  <span className="font-bold text-slate-800">{formatINR((await getPlanAsync("launch")).monthlyPaise)}/month</span>.
                </p>
              </div>

              <ul className="grid flex-1 gap-x-4 gap-y-3 sm:grid-cols-2 lg:max-w-md bg-white/70 backdrop-blur-xs rounded-2xl p-5 border border-orange-100">
                {STUDIO_ASSETS.map((asset) => (
                  <li key={asset.name} className="flex items-center gap-2.5 text-xs sm:text-sm font-medium text-slate-700">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600 font-bold text-xs">
                      ✓
                    </span>
                    <span>{asset.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* CATEGORY GRID */}
      {categoriesConfig?.enabled && (
        <section id="categories" className="pb-12 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-slate-200/80 pb-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">Explore Tool Categories</h2>
              <p className="text-sm text-slate-500 mt-1">Select a category to browse specific calculators, utilities & AI tools.</p>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {effectiveCategories.map((c) => {
              const tools = effectiveToolsByCategory[c.slug] || [];
              return (
                <div
                  key={c.slug}
                  className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs transition-all duration-200 hover:-translate-y-1 hover:border-orange-300 hover:shadow-xl hover:shadow-orange-500/5"
                >
                  <div>
                    {/* Header Badge */}
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="inline-flex items-center gap-2 rounded-lg bg-orange-50/80 px-2.5 py-1 text-xs font-semibold text-orange-800 border border-orange-200/60">
                        <span>●</span>
                        <span className="capitalize">{c.slug.split("-")[0]}</span>
                      </div>
                      <span className="rounded-full border border-slate-200/80 bg-slate-50 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                        {tools.length > 0 ? `${tools.length} Tools` : "Soon"}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-orange-700 transition-colors">
                      <Link href={`/${c.slug}`}>
                        <span className="absolute inset-0" aria-hidden="true" />
                        {c.name}
                      </Link>
                    </h3>

                    <p className="mt-1.5 text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed">
                      {c.description}
                    </p>

                    {/* Quick Tool Links */}
                    {tools.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
                        {tools.slice(0, 4).map((t) => (
                          <div key={t.slug} className="relative z-10 flex items-center justify-between text-xs text-slate-700 hover:text-orange-900 group/tool py-0.5">
                            <Link
                              href={`/${c.slug}/${t.slug}`}
                              className="font-medium hover:text-orange-600 transition-colors truncate pr-2"
                            >
                              {t.name}
                            </Link>
                            <span className="text-slate-300 group-hover/tool:text-orange-500 transition-colors shrink-0">→</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-5 pt-3 flex items-center justify-between border-t border-slate-100 text-xs font-semibold text-orange-600 group-hover:text-orange-700">
                    <span>View all {c.name}</span>
                    <span className="transition-transform group-hover:translate-x-1">→</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
