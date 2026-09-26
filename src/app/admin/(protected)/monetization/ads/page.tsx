import { requireAdminAuth } from "@/server/admin-auth";
import AdsClient from "./AdsClient";
import Link from "next/link";
import { Plus } from "lucide-react";

export const metadata = {
  title: "Ads Management | Avex Tools Admin",
};

export default async function AdsPage() {
  await requireAdminAuth("ads.view");

  return (
    <main className="p-6">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Ads & Monetization Management</h1>
          <p className="text-slate-500 text-sm mt-1">
            Configure advertisement slots, targeting rules, and promotional banners centrally across the public site.
          </p>
        </div>
        <Link 
          href="/admin/monetization/ads/new" 
          className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm self-start md:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Advertisement
        </Link>
      </div>

      <AdsClient />
    </main>
  );
}
