import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ebosCtaUrl, getCategory, SITE_NAME, SITE_URL } from "@/tools/categories";
import { allTools, getTool, toolsByCategory } from "@/tools/registry";
import { ToolRunner } from "@/components/tools/tool-shapes/tool-runner";
import { CtaBlock } from "@/components/lead/cta-block";
import { NewsletterBlock } from "@/components/lead/newsletter";

export const dynamicParams = false;

export function generateStaticParams() {
  return allTools.map((t) => ({ category: t.category, slug: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool) return {};
  const canonical = `${SITE_URL}/${tool.category}/${tool.slug}`;
  const title = `${tool.name} — Avex Online Tool`;
  return {
    title,
    description: tool.seoDescription,
    alternates: { canonical },
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description: tool.seoDescription,
      url: canonical,
      siteName: SITE_NAME,
      type: "website",
    },
    twitter: {
      card: "summary",
      title: `${title} | ${SITE_NAME}`,
      description: tool.seoDescription,
    },
  };
}

export default async function ToolPage({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const { category, slug } = await params;
  const tool = getTool(slug);
  const cat = getCategory(category);
  if (!tool || !cat || tool.category !== cat.slug) notFound();

  const canonical = `${SITE_URL}/${tool.category}/${tool.slug}`;
  const related = tool.related
    .map((s) => getTool(s))
    .filter((t): t is NonNullable<typeof t> => Boolean(t));
  const aiEnabled = tool.kind === "ai-writer" && Boolean(process.env.ANTHROPIC_API_KEY);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: tool.name,
      description: tool.seoDescription,
      url: canonical,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: tool.faq.map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: { "@type": "Answer", text: f.answer },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Avex Tools", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: cat.name, item: `${SITE_URL}/${cat.slug}` },
        { "@type": "ListItem", position: 3, name: tool.name, item: canonical },
      ],
    },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav className="text-sm text-slate-500 print:hidden">
        <Link href="/" className="hover:text-orange-800">
          Avex Tools
        </Link>{" "}
        /{" "}
        <Link href={`/${cat.slug}`} className="hover:text-orange-800">
          {cat.shortName}
        </Link>{" "}
        / <span className="text-slate-700">{tool.name}</span>
      </nav>

      <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 print:hidden">
        {tool.name}
      </h1>
      <p className="mt-2 text-slate-600 print:hidden">{tool.tagline}</p>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm print:border-none print:p-0 print:shadow-none">
        <ToolRunner category={tool.category} slug={tool.slug} aiEnabled={aiEnabled} />
      </div>

      <div className="mt-10 space-y-10 print:hidden">
        <CtaBlock
          headline={cat.ctaHeadline}
          body={cat.ctaBody}
          href={ebosCtaUrl(cat, tool.slug)}
          moduleName={cat.ebosModule}
          toolSlug={tool.slug}
          category={tool.category}
        />

        <section>
          <h2 className="text-xl font-semibold text-slate-900">
            About the {tool.name}
          </h2>
          <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-slate-700">
            {tool.about.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">
            Frequently asked questions
          </h2>
          <dl className="mt-4 space-y-4">
            {tool.faq.map((f) => (
              <div key={f.question}>
                <dt className="font-medium text-slate-900">{f.question}</dt>
                <dd className="mt-1 text-[15px] leading-relaxed text-slate-700">
                  {f.answer}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <NewsletterBlock toolSlug={tool.slug} category={tool.category} />

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
                  <p className="mt-0.5 text-sm text-slate-600">{r.tagline}</p>
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
            {toolsByCategory[cat.slug]
              .filter((t) => t.slug !== tool.slug)
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
