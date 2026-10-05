import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ebosCtaUrl, getCategory, SITE_NAME, SITE_URL } from "@/tools/categories";
import { allTools, getTool, toolsByCategory } from "@/tools/registry";
import { resolveToolSeo } from "@/server/seo-manager";
import { getToolFormData } from "@/server/admin-tools";
import { ToolRunner } from "@/components/tools/tool-shapes/tool-runner";
import { ToolAboutText } from "@/components/tools/tool-about-text";
import { ViewTracker } from "@/components/tools/ViewTracker";
import { CtaBlock } from "@/components/lead/cta-block";
import { NewsletterBlock } from "@/components/lead/newsletter";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { checkAdminPermission } from "@/server/admin-auth";
import { AvexoraProductCards } from "@/components/avexora/avexora-product-cards";
import {
  toolCanonical,
  toolPageDescription,
  toolPageJsonLd,
  toolPageKeywords,
  toolPageTitle,
} from "@/lib/tool-page-seo";
import { AdSlot } from "@/components/ads/ad-slot";
import { HeaderNav } from "@/components/editorial/header-nav";
import { FooterSection } from "@/components/editorial/footer-section";

export const dynamicParams = true;

export function generateStaticParams() {
  return allTools.map((t) => ({ category: t.category, slug: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}): Promise<Metadata> {
  const { slug, category } = await params;
  const toolData = await getToolFormData(slug);
  if (!toolData || toolData.category !== category) return {};
  
  // The layout's title template appends the site name, so the title here is bare.
  const fallback = {
    title: toolPageTitle(toolData),
    description: toolPageDescription(toolData),
    canonical: toolData.canonicalUrl || toolCanonical(toolData),
    siteName: SITE_NAME,
    ogImage: toolData.ogImage || `${SITE_URL}/logo.png`,
  };

  const keywords = toolPageKeywords(toolData);
  const seo = await resolveToolSeo(slug, category, fallback);
  return keywords.length ? { ...seo, keywords } : seo;
}

export default async function ToolPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string; slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { category, slug } = await params;
  const query = await searchParams;
  // ?preview=true only lets logged-in staff see unpublished tools — never the public.
  const isPreview = query.preview === "true" && (await checkAdminPermission("tools.edit"));
  
  const toolData = await getToolFormData(slug);
  const cat = getCategory(category);
  
  if (!toolData || !cat || toolData.category !== cat.slug) notFound();
  if (toolData.status !== "Published" && !isPreview) notFound();

  const defaultCanonical = toolCanonical(toolData);
  const fallback = {
    title: toolPageTitle(toolData),
    description: toolPageDescription(toolData),
    canonical: toolData.canonicalUrl || defaultCanonical,
    siteName: SITE_NAME,
    ogImage: toolData.ogImage || "",
  };
  const resolvedSeo = await resolveToolSeo(slug, category, fallback);
  const canonical = resolvedSeo.alternates?.canonical || defaultCanonical;

  // We still need the static tool for the ToolRunner (to know if it's an AI writer etc)
  const staticTool = getTool(slug);
  const aiEnabled = staticTool?.kind === "ai-writer" && Boolean(process.env.ANTHROPIC_API_KEY);
  
  // Resolve related tools
  const related = [];
  for (const rSlug of toolData.relatedTools) {
    const rData = await getToolFormData(rSlug);
    if (rData && rData.status === "Published") {
      related.push(rData);
    }
  }

  const jsonLd = toolPageJsonLd(toolData, cat, {
    canonical,
    description: resolvedSeo.description || undefined,
  });

  return (
    <div className="min-h-screen bg-white text-stone-900 font-sans selection:bg-orange-500 selection:text-white">
      <HeaderNav />
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pb-16 space-y-8" style={{ paddingTop: "calc(var(--nav-h) + 28px)" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Header & Breadcrumbs */}
      <div className="space-y-4 print:hidden">
        <nav className="flex items-center gap-2 text-xs font-mono text-stone-500">
          <Link href="/" className="hover:text-stone-900 transition">
            Home
          </Link>
          <span>/</span>
          <Link href={`/${cat.slug}`} className="hover:text-stone-900 transition">
            {cat.name}
          </Link>
          <span>/</span>
          <span className="text-orange-600 font-semibold">{toolData.name}</span>
        </nav>

        {isPreview && (
          <div className="p-3 bg-amber-50 border border-amber-300 text-amber-900 rounded-xl flex items-center justify-between text-xs font-semibold">
            <span className="inline-flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              Admin Preview Mode
            </span>
            <span>Status: {toolData.status}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pt-1">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2">
              <span className="rounded-md bg-orange-100/80 px-2.5 py-0.5 text-xs font-mono font-bold text-orange-800 uppercase tracking-wider border border-orange-200">
                {cat.shortName}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-md bg-stone-100 px-2.5 py-0.5 text-xs font-mono font-medium text-stone-700 border border-stone-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                100% In-Browser · Zero Data Upload
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-stone-950">
              {toolData.pageHeading || toolData.name}
            </h1>
            <p className="text-sm sm:text-base text-stone-600 leading-relaxed max-w-2xl">
              {toolData.shortDescription || toolData.description}
            </p>
          </div>
        </div>
      </div>

      {toolData.maintenanceMode && (
         <div className="p-6 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl">
           <h3 className="font-bold">Maintenance Mode</h3>
           <p className="text-sm mt-1">This tool is currently undergoing maintenance. Please check back shortly.</p>
         </div>
      )}

      {/* WORKSPACE TOOL RUNNER CONTAINER */}
      {!toolData.maintenanceMode && (
        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-lg shadow-orange-500/5 print:border-none print:p-0 print:shadow-none relative">
          {toolData.loginRequired && (
            <div className="absolute inset-0 z-10 bg-white/90 backdrop-blur-xs flex flex-col items-center justify-center rounded-3xl p-6 text-center">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Sign In Required</h3>
              <p className="text-sm text-slate-600 mb-4 max-w-md">You must be signed in to use {toolData.name}. Accounts are free.</p>
              <Link href="/login" className="px-6 py-2.5 bg-orange-600 text-white rounded-xl font-semibold text-sm hover:bg-orange-700 shadow-sm transition-colors">
                Sign In Now
              </Link>
            </div>
          )}
          <ToolRunner category={toolData.category} slug={toolData.slug} aiEnabled={aiEnabled} />
        </div>
      )}

      <AdSlot placement="tool_page" categorySlug={category} toolSlug={slug} />

      <div className="space-y-10 print:hidden pt-4">
        <CtaBlock
          headline={cat.ctaHeadline}
          body={cat.ctaBody}
          href={ebosCtaUrl(cat, toolData.slug)}
          moduleName={cat.ebosModule}
          toolSlug={toolData.slug}
          category={toolData.category}
        />

        {/* ABOUT TOOL SECTION */}
        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 space-y-6 shadow-2xs">
          <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-3">
            About {toolData.name}
          </h2>
          <div className="space-y-4 text-sm leading-relaxed text-slate-700">
            {toolData.introduction && (
              <p className="font-semibold text-slate-900 text-base">{toolData.introduction}</p>
            )}
            
            {toolData.description && toolData.description.split('\n').map((p, i) => {
              const text = p.trim();
              return text ? <p key={i} className="text-slate-600"><ToolAboutText text={text} /></p> : null;
            })}
            
            {toolData.steps.length > 0 && (
              <div className="pt-2">
                <h3 className="text-base font-bold text-slate-900 mb-3">How to use {toolData.name}</h3>
                <ol className="space-y-2 pl-2">
                  {toolData.steps.map((step, i) => (
                    <li key={i} className="flex gap-3 text-slate-700">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-700 font-bold text-xs">
                        {i + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {toolData.examples.filter(Boolean).length > 0 && (
              <div className="pt-2">
                <h3 className="text-base font-bold text-slate-900 mb-2">Worked example</h3>
                {toolData.examples.filter(Boolean).map((example, i) => (
                  <div key={i} className="rounded-xl bg-slate-50 p-4 border border-slate-200/80 text-xs sm:text-sm font-mono text-slate-800">
                    {example.replace(/^Example:\s*/, "")}
                  </div>
                ))}
              </div>
            )}

            {toolData.howToUse && (
              <div className="pt-2">
                <h3 className="text-base font-bold text-slate-900 mb-2">Instructions</h3>
                <div
                  className="prose prose-slate max-w-none text-sm"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(toolData.howToUse) }}
                />
              </div>
            )}
            
            {toolData.formula && (
              <div className="rounded-xl bg-orange-50/80 border border-orange-200/80 p-4 space-y-1.5">
                <h3 className="text-xs font-bold text-orange-900 uppercase tracking-wider">Formula</h3>
                <code className="block font-mono text-xs sm:text-sm font-bold text-orange-800">{toolData.formula}</code>
              </div>
            )}
          </div>
        </section>

        {/* FAQS SECTION */}
        {toolData.faqs.filter(f => f.active).length > 0 && (
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">
              Frequently Asked Questions
            </h2>
            <div className="grid gap-3">
              {toolData.faqs.filter(f => f.active).sort((a,b) => a.order - b.order).map((f) => (
                <div key={f.id} className="rounded-2xl border border-slate-200/80 bg-white p-5 space-y-2 shadow-2xs">
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">{f.question}</h3>
                  <p className="text-xs sm:text-sm leading-relaxed text-slate-600">
                    {f.answer}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {staticTool?.showAvexoraProducts !== false && <AvexoraProductCards placement={toolData.slug} />}

        <NewsletterBlock toolSlug={toolData.slug} category={toolData.category} />

        {/* RELATED TOOLS */}
        {related.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">Related Tools</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/${r.category}/${r.slug}`}
                  className="group rounded-2xl border border-slate-200/80 bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-md space-y-1"
                >
                  <span className="font-bold text-slate-900 text-sm group-hover:text-orange-700 transition-colors flex items-center justify-between">
                    <span>{r.name}</span>
                    <span className="text-slate-300 group-hover:text-orange-500 transition-colors text-xs">→</span>
                  </span>
                  <p className="text-xs text-slate-600 line-clamp-2">{r.shortDescription || r.description}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* MORE IN CATEGORY */}
        <section className="border-t border-slate-200/80 pt-6 space-y-3">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            More {cat.name}
          </h2>
          <div className="flex flex-wrap gap-2">
            {toolsByCategory[cat.slug as keyof typeof toolsByCategory]
              ?.filter((t) => t.slug !== toolData.slug)
              .map((t) => (
                <Link
                  key={t.slug}
                  href={`/${t.category}/${t.slug}`}
                  className="rounded-full border border-slate-200/80 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-900"
                >
                  {t.name}
                </Link>
              ))}
          </div>
        </section>

      </div>
      </div>
      <FooterSection />
    </div>
  );
}
