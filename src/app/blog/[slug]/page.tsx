import { notFound } from "next/navigation";
import { getPublishedContent } from "@/server/content-service";
import { MarkdownRenderer } from "@/components/content/MarkdownRenderer";
import { ContentType } from "@prisma/client";
import { SITE_NAME, SITE_URL } from "@/tools/categories";

export async function generateMetadata({ params }: { params: { slug: string } }) {
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

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getPublishedContent(params.slug, ContentType.BLOG);
  
  if (!post) {
    notFound();
  }

  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <header className="mb-10 text-center">
        {post.category && (
          <p className="text-sm font-semibold uppercase tracking-wide text-orange-600 mb-2">
            {post.category}
          </p>
        )}
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
          {post.title}
        </h1>
        {post.publishedAt && (
          <p className="mt-4 text-sm text-slate-500">
            Published on {new Date(post.publishedAt).toLocaleDateString("en-US", { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        )}
      </header>
      
      {post.featuredImage && (
        <div className="mb-10 overflow-hidden rounded-2xl bg-slate-100">
          <img src={post.featuredImage} alt={post.title} className="w-full object-cover" />
        </div>
      )}

      <MarkdownRenderer content={post.content} />
    </article>
  );
}
