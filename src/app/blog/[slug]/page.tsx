import { notFound } from "next/navigation";
import { getPublishedContent } from "@/server/content-service";
import { MarkdownRenderer } from "@/components/content/MarkdownRenderer";
import { ContentType } from "@prisma/client";
import { SITE_URL } from "@/tools/categories";
import { allTools } from "@/tools/registry";
import { ArrowRight, ArrowLeft, BookOpen } from "lucide-react";
import Link from "next/link";
import { HeaderNav } from "@/components/editorial/header-nav";
import { FooterSection } from "@/components/editorial/footer-section";

export async function generateMetadata(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const post = await getPublishedContent(params.slug, ContentType.BLOG);
  if (!post) return {};
  
  return {
    title: post.seoTitle || `${post.title} | Blog`,
    description: post.metaDesc || post.excerpt,
    alternates: {
      canonical: post.canonicalUrl || `${SITE_URL}/blog/${post.slug}`
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

export default async function BlogPostPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const post = await getPublishedContent(params.slug, ContentType.BLOG);

  if (!post) {
    notFound();
  }

  const wordCount = post.content.split(/\s+/).length;
  const readingTime = Math.ceil(wordCount / 200);

  // Generate Table of Contents
  const headings = Array.from(post.content.matchAll(/^(#{2,3})\s+(.+)$/gm)).map(match => ({
    level: match[1].length,
    text: match[2].trim(),
    slug: match[2].trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
  }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "image": post.featuredImage ? [post.featuredImage] : [],
    "datePublished": post.publishedAt || post.createdAt,
    "dateModified": post.updatedAt,
    "author": {
      "@type": "Person",
      "name": post.author?.name || "Avex Tools Team"
    }
  };

  return (
    <div className="min-h-screen bg-white text-stone-900 font-sans selection:bg-orange-500 selection:text-white flex flex-col justify-between relative">
      <div className="absolute inset-0 bg-matrix-grid opacity-35 pointer-events-none" />
      <HeaderNav />

      <div className="flex-1 pt-24 sm:pt-28 pb-16 relative z-10">
        <article className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-10">
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

          {/* Back Navigation Bar */}
          <div className="flex items-center justify-between pb-2">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-xs font-mono font-semibold text-stone-600 hover:text-orange-600 bg-white border border-stone-200 hover:border-orange-300 px-3.5 py-2 rounded-xl shadow-2xs transition group"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              <span>Back to Blog Articles</span>
            </Link>
            <div className="flex items-center gap-2 text-xs font-mono text-stone-500 bg-stone-50 border border-stone-200/80 px-3 py-1.5 rounded-full">
              <BookOpen className="w-3.5 h-3.5 text-orange-600" />
              <span>Article Overview</span>
            </div>
          </div>

          <header className="mb-10 text-center max-w-3xl mx-auto space-y-4">
            {post.category && (
              <span className="inline-block px-3 py-1 rounded-full bg-orange-100 text-orange-700 font-mono text-xs font-semibold uppercase tracking-wider">
                {post.category}
              </span>
            )}
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-stone-900 leading-[1.15]">
              {post.title}
            </h1>
            
            <div className="flex items-center justify-center gap-3 text-xs font-mono text-stone-500 pt-2">
              {post.author?.name && (
                <>
                  <span className="font-semibold text-stone-900">{post.author.name}</span>
                  <span>•</span>
                </>
              )}
              <span>{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("en-US", { month: 'long', day: 'numeric', year: 'numeric' }) : 'Draft'}</span>
              <span>•</span>
              <span>{readingTime} min read</span>
            </div>
          </header>
          
          {post.featuredImage && (
            <div className="overflow-hidden rounded-3xl border border-stone-200/90 shadow-md max-w-4xl mx-auto">
              <img src={post.featuredImage} alt={post.title} className="w-full object-cover max-h-[500px]" />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 pt-4">
            <div className="lg:col-span-8 prose prose-stone prose-orange max-w-none prose-img:rounded-2xl">
              <MarkdownRenderer content={post.content} />
            </div>
            
            <div className="lg:col-span-4 space-y-6">
              {headings.length > 0 && (
                <div className="bg-white rounded-3xl p-6 border border-stone-200/90 shadow-2xs sticky top-28 space-y-3">
                  <h3 className="font-bold text-stone-900 text-sm font-mono uppercase tracking-wider">Table of Contents</h3>
                  <nav className="space-y-1.5">
                    {headings.map((h, i) => (
                      <a 
                        key={i} 
                        href={`#${h.slug}`} 
                        className={`block text-xs text-stone-600 hover:text-orange-600 transition-colors ${h.level === 3 ? 'ml-3' : ''}`}
                      >
                        {h.text}
                      </a>
                    ))}
                  </nav>
                </div>
              )}
              
              {post.author && (
                <div className="bg-stone-50/70 rounded-3xl p-6 border border-stone-200/80 space-y-2">
                  <h3 className="font-mono text-xs font-semibold text-stone-500 uppercase tracking-wider">Written by</h3>
                  <p className="font-bold text-stone-900 text-base">{post.author.name || "Avex Tools Team"}</p>
                  {(post.author.jobRole || post.author.companyName) && (
                    <p className="text-xs text-stone-500">
                      {[post.author.jobRole, post.author.companyName].filter(Boolean).join(" at ")}
                    </p>
                  )}
                </div>
              )}
              
              {post.tags && post.tags.length > 0 && (
                <div className="bg-stone-50/70 rounded-3xl p-6 border border-stone-200/80 space-y-3">
                  <h3 className="font-mono text-xs font-semibold text-stone-500 uppercase tracking-wider">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag: string) => (
                      <span key={tag} className="bg-white border border-stone-200 text-stone-700 text-xs px-3 py-1 rounded-full font-mono">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {post.relatedTools && post.relatedTools.length > 0 && (
                <div className="bg-orange-50/60 rounded-3xl p-6 border border-orange-200/80 space-y-3">
                  <h3 className="font-mono text-xs font-bold text-orange-900 uppercase tracking-wider">Related Tools</h3>
                  <div className="space-y-2.5">
                    {post.relatedTools.map((toolSlug: string) => {
                      const tool = allTools.find((t) => t.slug === toolSlug);
                      if (!tool) return null;
                      return (
                        <Link key={tool.slug} href={`/${tool.category}/${tool.slug}`} className="block bg-white p-3 rounded-2xl shadow-2xs border border-orange-100 hover:border-orange-300 transition-colors group">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                              <ArrowRight className="w-4 h-4" />
                            </div>
                            <div className="flex-1">
                              <h4 className="text-xs font-bold text-stone-900 group-hover:text-orange-600">{tool.name}</h4>
                              <p className="text-[11px] text-stone-500 line-clamp-1">{tool.seoDescription}</p>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </article>
      </div>

      <FooterSection />
    </div>
  );
}
