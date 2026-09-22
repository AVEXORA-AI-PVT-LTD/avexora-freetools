import { requireAdminAuth } from "@/server/admin-auth";
import { prisma } from "@/server/db";
import Link from "next/link";
import { Globe, Settings, Map, FileSearch, Link as LinkIcon, ShieldCheck } from "lucide-react";
import { allTools } from "@/tools/registry";

export const metadata = { title: "SEO Dashboard | Admin" };

export default async function SeoDashboard() {
  await requireAdminAuth("seo.view");

  // Gather stats
  const totalTools = allTools.length;
  const toolConfigs = await prisma.toolConfig.findMany({ select: { toolSlug: true, seoMetadata: true } });
  
  const configuredTools = toolConfigs.filter(t => t.seoMetadata && Object.keys(t.seoMetadata).length > 0).length;
  
  const redirectsCount = await prisma.redirect.count();

  // Basic check for missing SEO (just tools that have no config)
  const missingSeo = totalTools - configuredTools;

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">SEO Management</h1>
        <p className="mt-2 text-slate-600">Control technical SEO, metadata, redirects, and robots.txt</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Tools SEO</h3>
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <FileSearch className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 mb-1">{configuredTools} / {totalTools}</div>
          <p className="text-sm text-slate-500 mb-4">Tools with custom SEO overrides</p>
          <div className="flex items-center text-sm font-medium">
            {missingSeo > 0 ? (
              <span className="text-yellow-600">{missingSeo} tools using default generation</span>
            ) : (
              <span className="text-green-600">All tools configured</span>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Active Redirects</h3>
            <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
              <LinkIcon className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 mb-1">{redirectsCount}</div>
          <p className="text-sm text-slate-500 mb-4">Active URL redirections</p>
          <Link href="/admin/seo/redirects" className="text-sm font-medium text-orange-600 hover:text-orange-700">Manage Redirects &rarr;</Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Global Configuration</h3>
            <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
              <Globe className="w-5 h-5" />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Link href="/admin/seo/global" className="text-sm font-medium text-slate-700 hover:text-orange-600 flex items-center gap-2">
              <Settings className="w-4 h-4" /> Edit Global Metadata
            </Link>
            <Link href="/admin/seo/sitemap" className="text-sm font-medium text-slate-700 hover:text-orange-600 flex items-center gap-2">
              <Map className="w-4 h-4" /> Sitemap Configuration
            </Link>
            <Link href="/admin/seo/robots" className="text-sm font-medium text-slate-700 hover:text-orange-600 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> Robots.txt Rules
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
