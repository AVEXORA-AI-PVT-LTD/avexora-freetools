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
    <div className="mx-auto max-w-4xl px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav className="text-sm text-slate-500 print:hidden">
        <Link href="/" className="hover:text-orange-800">
          {SITE_NAME}
        </Link>{" "}
        /{" "}
        <Link href={`/${cat.slug}`} className="hover:text-orange-800">
          {cat.shortName}
        </Link>{" "}
        / <span className="text-slate-700">{toolData.name}</span>
      </nav>

      {isPreview && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-400 text-yellow-800 rounded-lg flex items-center justify-between print:hidden">
          <span className="font-medium">Admin Preview Mode</span>
          <span>Status: {toolData.status}</span>
        </div>
      )}

      <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 print:hidden">
        {toolData.pageHeading || toolData.name}
      </h1>
      <p className="mt-2 text-slate-600 print:hidden">{toolData.shortDescription || toolData.description}</p>

      {toolData.maintenanceMode && (
         <div className="mt-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
           <h3 className="font-bold">Maintenance Mode</h3>
           <p>This tool is currently unavailable. Please check back later.</p>
         </div>
      )}

      {!toolData.maintenanceMode && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm print:border-none print:p-0 print:shadow-none relative">
          {toolData.loginRequired && (
            <div className="absolute inset-0 z-10 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Login Required</h3>
              <p className="text-slate-600 mb-4">You must be logged in to use this tool.</p>
              <Link href="/login" className="px-6 py-2 bg-orange-600 text-white rounded-md font-medium hover:bg-orange-700">Login Now</Link>
            </div>
          )}
          <ToolRunner category={toolData.category} slug={toolData.slug} aiEnabled={aiEnabled} />
        </div>
      )}

      <AdSlot placement="tool_page" categorySlug={category} toolSlug={slug} />

      <div className="mt-10 space-y-10 print:hidden">
        <CtaBlock
          headline={cat.ctaHeadline}
          body={cat.ctaBody}
          href={ebosCtaUrl(cat, toolData.slug)}
          moduleName={cat.ebosModule}
          toolSlug={toolData.slug}
          category={toolData.category}
        />

        <section>
          <h2 className="text-xl font-semibold text-slate-900">
            About the {toolData.name}
          </h2>
          <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-slate-700">
            {toolData.introduction && (
              <p className="font-medium text-slate-900 mb-4">{toolData.introduction}</p>
            )}
            
            {toolData.description && toolData.description.split('\n').map((p, i) => {
              const text = p.trim();
              return text ? <p key={i}><ToolAboutText text={text} /></p> : null;
            })}
            
            {toolData.steps.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-slate-800">How to use the {toolData.name}</h3>
                <ol className="mt-2 list-decimal space-y-1.5 pl-5">
                  {toolData.steps.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              </div>
            )}

            {toolData.examples.filter(Boolean).length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-slate-800">Worked example</h3>
                {toolData.examples.filter(Boolean).map((example, i) => (
                  <p key={i} className="mt-2">{example.replace(/^Example:\s*/, "")}</p>
                ))}
              </div>
            )}

            {toolData.howToUse && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-slate-800">How to Use</h3>
                <div
                  className="mt-2"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(toolData.howToUse) }}
                />
              </div>
            )}
            
            {toolData.formula && (
              <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-2">Formula</h3>
                <code className="text-orange-700">{toolData.formula}</code>
              </div>
            )}
          </div>
        </section>

        {toolData.faqs.filter(f => f.active).length > 0 && (
          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              Frequently asked questions
            </h2>
            <dl className="mt-4 space-y-4">
              {toolData.faqs.filter(f => f.active).sort((a,b) => a.order - b.order).map((f) => (
                <div key={f.id}>
                  <dt className="font-medium text-slate-900">{f.question}</dt>
                  <dd className="mt-1 text-[15px] leading-relaxed text-slate-700">
                    {f.answer}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {staticTool?.showAvexoraProducts !== false && <AvexoraProductCards placement={toolData.slug} />}

        <NewsletterBlock toolSlug={toolData.slug} category={toolData.category} />

        {related.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold text-slate-900">Related tools</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/${r.category}/${r.slug}`}
                  className="rounded-lg border border-slate-200 p-4 transition hover:border-orange-300"
                >
                  <span className="font-medium text-slate-900">{r.name}</span>
                  <p className="mt-0.5 text-sm text-slate-600">{r.shortDescription || r.description}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="border-t border-slate-100 pt-6">
          <h2 className="text-sm font-semibold text-slate-500">
            More {cat.name.toLowerCase()}
          </h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {toolsByCategory[cat.slug as keyof typeof toolsByCategory]
              ?.filter((t) => t.slug !== toolData.slug)
              .map((t) => (
                <Link
                  key={t.slug}
                  href={`/${t.category}/${t.slug}`}
                  className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-600 hover:border-orange-300 hover:text-orange-800"
                >
                  {t.name}
                </Link>
              ))}
          </div>
        </section>

      </div>
    </div>
  );
}
