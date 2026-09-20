import { notFound } from "next/navigation";
import { getPublishedContent } from "@/server/content-service";
import { MarkdownRenderer } from "@/components/content/MarkdownRenderer";
import { ContentType } from "@prisma/client";
import { SITE_NAME, SITE_URL } from "@/tools/categories";
import { allTools } from "@/tools/registry";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export async function generateMetadata(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const post = await getPublishedContent(params.slug, ContentType.BLOG);
  if (!post) return {};
  
  return {
    title: post.seoTitle || `${post.title} | ${SITE_NAME} Blog`,
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
      "name": (post as any).author?.name || "Avex Tools Team"
    }
  };



  return (
    <article className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <header className="mb-10 text-center max-w-3xl mx-auto">
        {post.category && (
          <p className="text-sm font-semibold uppercase tracking-wide text-orange-600 mb-2">
            {post.category}
          </p>
        )}
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl md:text-5xl mb-6">
          {post.title}
        </h1>
        
        <div className="flex items-center justify-center gap-4 text-sm text-slate-500">
          {(post as any).author?.name && (
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-900">{(post as any).author.name}</span>
              <span>&bull;</span>
            </div>
          )}
          <span>{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("en-US", { month: 'long', day: 'numeric', year: 'numeric' }) : 'Draft'}</span>
          <span>&bull;</span>
          <span>{readingTime} min read</span>
        </div>
      </header>
      
      {post.featuredImage && (
        <div className="mb-12 overflow-hidden rounded-2xl bg-slate-100 max-w-4xl mx-auto">
          <img src={post.featuredImage} alt={post.title} className="w-full object-cover max-h-[500px]" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 prose prose-orange max-w-none prose-img:rounded-xl">
          <MarkdownRenderer content={post.content} />
        </div>
        
        <div className="lg:col-span-4 space-y-8">
          {headings.length > 0 && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm sticky top-24">
              <h3 className="font-semibold text-slate-900 mb-4">Table of Contents</h3>
              <nav className="space-y-2">
                {headings.map((h, i) => (
                  <a 
                    key={i} 
                    href={`#${h.slug}`} 
                    className={`block text-sm text-slate-600 hover:text-orange-600 transition-colors ${h.level === 3 ? 'ml-4' : ''}`}
                  >
                    {h.text}
                  </a>
                ))}
              </nav>
            </div>
          )}
          
          {(post as any).author && (
             <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
               <h3 className="font-semibold text-slate-900 mb-2">Written by</h3>
               <p className="font-bold text-lg text-slate-900">{(post as any).author.name || "Avex Tools Team"}</p>
               {((post as any).author.jobRole || (post as any).author.companyName) && (
                 <p className="text-sm text-slate-500 mb-3">
                   {[(post as any).author.jobRole, (post as any).author.companyName].filter(Boolean).join(" at ")}
                 </p>
               )}
             </div>
          )}
          
          {post.tags && post.tags.length > 0 && (
             <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
               <h3 className="font-semibold text-slate-900 mb-4">Tags</h3>
               <div className="flex flex-wrap gap-2">
                 {post.tags.map((tag: string) => (
                   <span key={tag} className="bg-white border border-slate-200 text-slate-600 text-xs px-3 py-1 rounded-full">
                     {tag}
                   </span>
                 ))}
               </div>
             </div>
          )}

          {post.relatedTools && post.relatedTools.length > 0 && (
             <div className="bg-orange-50 rounded-2xl p-6 border border-orange-100">
               <h3 className="font-semibold text-orange-900 mb-4">Related Tools</h3>
               <div className="space-y-3">
                 {post.relatedTools.map((toolSlug: string) => {
                   const tool = allTools.find((t: any) => t.slug === toolSlug);
                   if (!tool) return null;
                   return (
                     <Link key={tool.slug} href={`/tools/${tool.slug}`} className="block bg-white p-3 rounded-lg shadow-sm border border-orange-100 hover:border-orange-300 transition-colors group">
                       <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-md bg-orange-100 flex items-center justify-center text-orange-600">
                           <ArrowRight className="w-4 h-4" />
                         </div>
                         <div className="flex-1">
                           <h4 className="text-sm font-semibold text-slate-900 group-hover:text-orange-600">{tool.name}</h4>
                           <p className="text-xs text-slate-500 line-clamp-1">{tool.seoDescription}</p>
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


  );
}
