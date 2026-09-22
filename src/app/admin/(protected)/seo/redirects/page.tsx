import { requireAdminAuth } from "@/server/admin-auth";
import { prisma } from "@/server/db";
import { RedirectsClient } from "./RedirectsClient";

export const metadata = { title: "Redirects | Admin" };

export default async function RedirectsPage() {
  await requireAdminAuth("seo.view");
  
  const redirects = await prisma.redirect.findMany({
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">URL Redirects</h1>
        <p className="mt-1 text-slate-600">Manage 301 and 302 redirects. Redirects are executed securely at the edge via middleware.</p>
      </div>

      <RedirectsClient initialRedirects={redirects} />
    </div>
  );
}
