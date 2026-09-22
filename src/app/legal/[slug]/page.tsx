import { notFound } from "next/navigation";
import { getPublishedContent } from "@/server/content-service";
import { MarkdownRenderer } from "@/components/content/MarkdownRenderer";
import { ContentType } from "@prisma/client";
import { SITE_NAME, SITE_URL } from "@/tools/categories";

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const post = await getPublishedContent(params.slug);
  if (!post || !( [ContentType.PRIVACY, ContentType.TERMS, ContentType.DISCLAIMER, ContentType.PAGE] as ContentType[] ).includes(post.contentType as ContentType)) return {};
  
  return {
    title: post.seoTitle || `${post.title} | ${SITE_NAME}`,
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

export default async function LegalPage({ params }: { params: { slug: string } }) {
  const post = await getPublishedContent(params.slug);
  
  if (!post || !( [ContentType.PRIVACY, ContentType.TERMS, ContentType.DISCLAIMER, ContentType.PAGE] as ContentType[] ).includes(post.contentType as ContentType)) {
    notFound();
  }

  return (
    <article className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <header className="mb-10 border-b border-slate-200 pb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          {post.title}
        </h1>
        {post.publishedAt && (
          <p className="mt-4 text-sm text-slate-500">
            Last updated: {new Date(post.updatedAt).toLocaleDateString("en-US", { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        )}
      </header>
      
      <MarkdownRenderer content={post.content} />
    </article>
  );
}
