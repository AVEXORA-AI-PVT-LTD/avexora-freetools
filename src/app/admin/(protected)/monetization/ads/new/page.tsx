import { requireAdminAuth } from "@/server/admin-auth";
import AdForm from "../AdForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "New Advertisement | Avex Tools Admin",
};

export default async function NewAdPage() {
  await requireAdminAuth("ads.create");

  return (
    <main className="p-6">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/admin/monetization/ads" className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Add New Advertisement</h1>
          <p className="text-slate-500 text-sm mt-0.5">Configure placement, schedule, and provider settings for a new ad slot.</p>
        </div>
      </div>

      <AdForm />
    </main>
  );
}
