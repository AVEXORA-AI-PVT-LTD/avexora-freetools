import { requireAdminAuth } from "@/server/admin-auth";
import { SITE_URL } from "@/tools/categories";
import { ExternalLink, CheckCircle } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Sitemap | Admin" };

export default async function SitemapDashboard() {
  await requireAdminAuth("seo.view");

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">XML Sitemap</h1>
        <p className="mt-1 text-slate-600">Your sitemap is generated dynamically and is always up to date.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-slate-700">Sitemap URL</label>
          <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-md border border-slate-200">
            <span className="font-mono text-sm flex-1">{SITE_URL}/sitemap.xml</span>
            <a href="/sitemap.xml" target="_blank" className="text-orange-600 hover:text-orange-700 flex items-center gap-1 text-sm font-medium">
              View <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        <div>
          <h3 className="font-medium text-slate-900 mb-3">Sitemap Inclusions</h3>
          <ul className="space-y-2 text-sm text-slate-600">
            <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Public Tools (excluding NoIndex)</li>
            <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Public Categories</li>
            <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Published Blog Posts</li>
            <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Published Pages & Guides</li>
            <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Filtered out duplicates & private routes</li>
          </ul>
        </div>
        
        <div className="bg-blue-50 text-blue-800 p-4 rounded-md text-sm">
          Since you are using Next.js App Router, the sitemap is re-evaluated dynamically. Changes to tools, blogs, or SEO configurations are instantly reflected in the XML without needing manual regeneration.
        </div>
      </div>
    </div>
  );
}
