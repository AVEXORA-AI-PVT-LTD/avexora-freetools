import Link from "next/link";
import { getPublishedList } from "@/server/content-service";
import { ContentType, type ContentItem } from "@prisma/client";
import { HeaderNav } from "@/components/editorial/header-nav";
import { FooterSection } from "@/components/editorial/footer-section";
import { ArrowLeft, BookOpen } from "lucide-react";

export const metadata = {
  title: "Blog",
  description: `Read the latest articles, tutorials, and guides about digital tools and marketing.`,
};

export default async function BlogIndexPage() {
  const posts = await getPublishedList(ContentType.BLOG);
  
  const featured = posts.filter(p => p.featured);
  const latest = posts.filter(p => !p.featured);

  return (
    <div className="min-h-screen bg-white text-stone-900 font-sans selection:bg-orange-500 selection:text-white flex flex-col justify-between relative">
      <div className="absolute inset-0 bg-matrix-grid opacity-35 pointer-events-none" />
      <HeaderNav />

      <div className="flex-1 pt-24 sm:pt-28 pb-16 relative z-10">
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Back Navigation */}
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
              <span>Engineering &amp; Business Blog</span>
            </div>
          </div>

          <header className="text-center max-w-3xl mx-auto space-y-4">
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-stone-900">Avexora Blog &amp; Insights</h1>
            <p className="text-base sm:text-lg text-stone-600 leading-relaxed">
              Deep dives, technical tutorials, compliance breakdowns and insights to help you scale your business.
            </p>
          </header>
          
          {featured.length > 0 && (
            <section className="space-y-6">
              <h2 className="text-2xl font-bold text-stone-900">Featured Posts</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featured.map(post => (
                  <BlogCard key={post.id} post={post} />
                ))}
              </div>
            </section>
          )}

          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-stone-900">Latest Articles</h2>
            {latest.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {latest.map(post => (
                  <BlogCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-stone-200/90 bg-stone-50/60 p-8 sm:p-12 text-center space-y-4 max-w-2xl mx-auto">
                <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mx-auto">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-stone-900">Articles Coming Soon</h3>
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                  Our engineering and finance editorial teams are preparing deep dives on Indian tax optimization, statutory compliance, and developer productivity. In the meantime, all 130+ tools are fully active.
                </p>
                <div className="pt-2">
                  <Link
                    href="/"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-600 text-white font-semibold text-xs hover:bg-orange-700 shadow-sm transition"
                  >
                    <span>Browse 130+ Free Tools</span>
                  </Link>
                </div>
              </div>
            )}
          </section>
        </main>
      </div>

      <FooterSection />
    </div>
  );
}

function readingMinutes(content: string): number {
  return Math.ceil(content.trim().split(/\s+/).filter(Boolean).length / 200);
}

function BlogCard({ post }: { post: ContentItem }) {
  const readingTime = readingMinutes(post.content);
  return (
    <Link href={`/blog/${post.slug}`} className="group flex flex-col bg-white rounded-3xl border border-stone-200/90 overflow-hidden shadow-2xs hover:shadow-md hover:border-orange-300 transition-all">
      {post.featuredImage ? (
        <img src={post.featuredImage} alt={post.title} className="w-full h-48 object-cover" />
      ) : (
        <div className="w-full h-48 bg-stone-100 flex items-center justify-center">
          <span className="text-stone-400 text-sm">No Image</span>
        </div>
      )}
      <div className="p-6 flex-1 flex flex-col">
        {post.category && (
          <span className="text-xs font-mono font-semibold text-orange-600 uppercase tracking-wider mb-2">{post.category}</span>
        )}
        <h3 className="text-lg font-bold text-stone-900 group-hover:text-orange-600 transition-colors mb-2 line-clamp-2">
          {post.title}
        </h3>
        <p className="text-stone-600 text-xs sm:text-sm mb-4 line-clamp-3 flex-1 leading-relaxed">
          {post.excerpt || post.content.substring(0, 150) + "..."}
        </p>
        <div className="flex items-center text-xs font-mono text-stone-400 justify-between mt-auto pt-3 border-t border-stone-100">
          <span>{new Date(post.publishedAt || post.createdAt).toLocaleDateString()}</span>
          {readingTime > 0 && <span>{readingTime} min read</span>}
        </div>
      </div>
    </Link>
  );
}
