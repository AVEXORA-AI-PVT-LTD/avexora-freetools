import Link from "next/link";
import { getPublishedList } from "@/server/content-service";
import { ContentType } from "@prisma/client";
import { SITE_NAME } from "@/tools/categories";

export const metadata = {
  title: `Blog | ${SITE_NAME}`,
  description: `Read the latest articles, tutorials, and guides about digital tools and marketing.`,
};

export default async function BlogIndexPage() {
  const posts = await getPublishedList(ContentType.BLOG);
  
  const featured = posts.filter(p => p.featured);
  const latest = posts.filter(p => !p.featured);

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <header className="mb-12 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">Our Blog</h1>
        <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
          Insights, tutorials, and news to help you grow your digital presence.
        </p>
      </header>
      
      {featured.length > 0 && (
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Featured Posts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featured.map(post => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Latest Articles</h2>
        {latest.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {latest.map(post => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <p className="text-slate-500">No articles available at the moment.</p>
        )}
      </section>
    </div>
  );
}

function BlogCard({ post }: { post: any }) {
  return (
    <Link href={`/blog/${post.slug}`} className="group flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
      {post.featuredImage ? (
        <img src={post.featuredImage} alt={post.title} className="w-full h-48 object-cover" />
      ) : (
        <div className="w-full h-48 bg-slate-100 flex items-center justify-center">
          <span className="text-slate-400 text-sm">No Image</span>
        </div>
      )}
      <div className="p-6 flex-1 flex flex-col">
        {post.category && (
          <span className="text-xs font-semibold text-orange-600 uppercase tracking-wider mb-2">{post.category}</span>
        )}
        <h3 className="text-xl font-bold text-slate-900 group-hover:text-orange-600 transition-colors mb-2 line-clamp-2">
          {post.title}
        </h3>
        <p className="text-slate-600 text-sm mb-4 line-clamp-3 flex-1">
          {post.excerpt || post.content.substring(0, 150) + "..."}
        </p>
        <div className="flex items-center text-xs text-slate-500 justify-between mt-auto">
          <span>{new Date(post.publishedAt || post.createdAt).toLocaleDateString()}</span>
          {post.readingTime && <span>{post.readingTime} min read</span>}
        </div>
      </div>
    </Link>
  );
}
