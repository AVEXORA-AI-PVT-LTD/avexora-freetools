import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/server/db";
import { currentUserId } from "@/server/auth";
import { resolvePlan } from "@/studio/entitlements";
import { toComplianceInput } from "@/studio/brand-context";
import { ComplianceReport } from "@/components/studio/compliance-panel";
import { BrandWorkspace } from "@/components/studio/brand-workspace";

export const metadata: Metadata = {
  title: "Brand workspace",
  robots: { index: false },
};

export default async function BrandPage({
  params,
}: {
  params: Promise<{ brandId: string }>;
}) {
  const userId = await currentUserId();
  const { brandId } = await params;
  if (!userId) redirect(`/studio/signin?next=/studio/app/${brandId}`);

  const brand = await prisma.brand.findFirst({
    where: { id: brandId, userId },
    include: { kit: true, employees: { orderBy: { createdAt: "asc" } } },
  });
  if (!brand) notFound();

  const plan = await resolvePlan(userId);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/studio/app"
            className="text-xs font-medium text-slate-500 hover:text-slate-800"
          >
            ← All brands
          </Link>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            {brand.legalName ?? brand.name}
          </h1>
          <p className="text-sm text-slate-600">{brand.industry}</p>
        </div>
        {!brand.kit && (
          <Link
            href="/studio/app/new"
            className="rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-900"
          >
            No brand kit chosen yet
          </Link>
        )}
      </div>

      <div className="mt-8">
        <BrandWorkspace
          brand={brand}
          kit={brand.kit}
          employees={brand.employees}
          canPrintPdf={plan.capabilities.printPdf}
          watermark={plan.watermark}
        />
      </div>

      <div className="mt-12">
        <ComplianceReport brand={toComplianceInput(brand)} />
      </div>
    </main>
  );
}
