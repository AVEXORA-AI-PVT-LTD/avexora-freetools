import { notFound } from "next/navigation";
import Link from "next/link";
import { getPublishedContent } from "@/server/content-service";
import { MarkdownRenderer } from "@/components/content/MarkdownRenderer";
import { ContentType } from "@prisma/client";
import { SITE_URL } from "@/tools/categories";
import { HeaderNav } from "@/components/editorial/header-nav";
import { FooterSection } from "@/components/editorial/footer-section";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export async function generateMetadata(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const post = await getPublishedContent(params.slug);
  if (!post || !( [ContentType.PRIVACY, ContentType.TERMS, ContentType.DISCLAIMER, ContentType.PAGE] as ContentType[] ).includes(post.contentType as ContentType)) return {};
  
  return {
    title: post.seoTitle || post.title,
    description: post.metaDesc || post.excerpt,
    alternates: {
      canonical: post.canonicalUrl || `${SITE_URL}/legal/${post.slug}`
    },
    robots: {
      index: !post.noIndex,
      follow: !post.noIndex,
    }
  };
}

export default async function LegalPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const post = await getPublishedContent(params.slug);
  
  if (!post || !( [ContentType.PRIVACY, ContentType.TERMS, ContentType.DISCLAIMER, ContentType.PAGE] as ContentType[] ).includes(post.contentType as ContentType)) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white text-stone-900 font-sans selection:bg-orange-500 selection:text-white flex flex-col justify-between relative">
      <div className="absolute inset-0 bg-matrix-grid opacity-35 pointer-events-none" />
      <HeaderNav />

      <div className="flex-1 pt-24 sm:pt-28 pb-16 relative z-10">
        <article className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Back Navigation Bar */}
          <div className="flex items-center justify-between pb-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-mono font-semibold text-stone-600 hover:text-orange-600 bg-white border border-stone-200 hover:border-orange-300 px-3.5 py-2 rounded-xl shadow-2xs transition group"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              <span>Back to Avexora Free Tools Website</span>
            </Link>
            <div className="flex items-center gap-2 text-xs font-mono text-stone-500 bg-stone-50 border border-stone-200/80 px-3 py-1.5 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5 text-orange-600" />
              <span>Legal Document</span>
            </div>
          </div>

          <header className="border-b border-stone-200 pb-6 space-y-2">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-stone-900">
              {post.title}
            </h1>
            {post.publishedAt && (
              <p className="text-xs font-mono text-stone-500">
                Last updated: {new Date(post.updatedAt).toLocaleDateString("en-US", { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            )}
          </header>
          
          <div className="prose prose-stone prose-orange max-w-none pt-2">
            <MarkdownRenderer content={post.content} />
          </div>
        </article>
      </div>

      <FooterSection />
    </div>
  );
}
