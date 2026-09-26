import { requireAdminAuth } from "@/server/admin-auth";
import { getAdByIdAction } from "../ad-actions";
import AdForm from "../AdForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

export const metadata = {
  title: "Edit Advertisement | Avex Tools Admin",
};

export default async function EditAdPage({ params }: { params: { id: string } }) {
  await requireAdminAuth("ads.edit");
  const ad = await getAdByIdAction(params.id);

  if (!ad) notFound();

  return (
    <main className="p-6">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/admin/monetization/ads" className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Edit Advertisement</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Modify configuration for <span className="font-semibold">{ad.name}</span>. Created by {ad.createdBy || "Admin"}.
          </p>
        </div>
      </div>

      <AdForm initialData={ad} />
    </main>
  );
}
