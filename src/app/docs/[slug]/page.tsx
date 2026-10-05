import { notFound } from "next/navigation";
import Link from "next/link";
import { getPublishedContent } from "@/server/content-service";
import { MarkdownRenderer } from "@/components/content/MarkdownRenderer";
import { ContentType } from "@prisma/client";
import { SITE_URL } from "@/tools/categories";
import { HeaderNav } from "@/components/editorial/header-nav";
import { FooterSection } from "@/components/editorial/footer-section";
import { ArrowLeft, BookOpen } from "lucide-react";

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const post = await getPublishedContent(params.slug, ContentType.DOCUMENTATION);
  if (!post) return {};
  
  return {
    title: post.seoTitle || `${post.title} | Docs`,
    description: post.metaDesc || post.excerpt,
    alternates: {
      canonical: post.canonicalUrl || `${SITE_URL}/docs/${post.slug}`
    },
    openGraph: {
      title: post.ogTitle || post.seoTitle || post.title,
      description: post.ogDesc || post.metaDesc || post.excerpt,
      images: post.ogImage || post.featuredImage ? [{ url: post.ogImage || post.featuredImage }] : [],
    },
    robots: {
      index: !post.noIndex,
      follow: !post.noIndex,
    }
  };
}

export default async function DocPage({ params }: { params: { slug: string } }) {
  const post = await getPublishedContent(params.slug, ContentType.DOCUMENTATION);
  
  if (!post) {
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
              <BookOpen className="w-3.5 h-3.5 text-orange-600" />
              <span>Documentation</span>
            </div>
          </div>

          <header className="mb-10 text-center max-w-2xl mx-auto space-y-3">
            {post.category && (
              <span className="inline-block px-3 py-1 rounded-full bg-orange-100 text-orange-700 font-mono text-xs font-semibold uppercase tracking-wider">
                {post.category}
              </span>
            )}
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-stone-900">
              {post.title}
            </h1>
            {post.publishedAt && (
              <p className="text-xs font-mono text-stone-500">
                Published on {new Date(post.publishedAt).toLocaleDateString("en-US", { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            )}
          </header>
          
          {post.featuredImage && (
            <div className="overflow-hidden rounded-3xl border border-stone-200/90 shadow-sm max-w-3xl mx-auto">
              <img src={post.featuredImage} alt={post.title} className="w-full object-cover" />
            </div>
          )}

          <div className="prose prose-stone prose-orange max-w-none prose-img:rounded-2xl pt-2">
            <MarkdownRenderer content={post.content} />
          </div>
        </article>
      </div>

      <FooterSection />
    </div>
  );
}
