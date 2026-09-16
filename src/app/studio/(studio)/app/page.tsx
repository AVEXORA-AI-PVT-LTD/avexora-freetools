import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/server/db";
import { currentUserId } from "@/server/auth";
import { entitlementSummary } from "@/server/studio/entitlements";
import { auditBrand } from "@/studio/compliance/india";
import { toComplianceInput } from "@/studio/brand-context";
import { composeLogo } from "@/studio/engine/logo";
import { toTokens } from "@/studio/brand-context";
import { formatINR } from "@/server/studio/plans";
import { StatusPill } from "@/components/studio/status-pill";

export const metadata: Metadata = {
  title: "Your brands",
  robots: { index: false },
};

function limitLabel(used: number, limit: number | null) {
  return limit === null ? `${used} used` : `${used} / ${limit}`;
}

export default async function DashboardPage() {
  const userId = await currentUserId();
  if (!userId) redirect("/studio/signin?next=/studio/app");

  const [brands, summary] = await Promise.all([
    prisma.brand.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: { kit: true, _count: { select: { employees: true } } },
    }),
    entitlementSummary(userId),
  ]);

  const atBrandLimit =
    summary.limits.brands !== null && summary.usage.brands >= summary.limits.brands;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Your brands
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {summary.plan.name} plan
            {summary.plan.monthlyPaise > 0 &&
              ` — ${formatINR(summary.plan.monthlyPaise)}/month`}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/studio/pricing"
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-400"
          >
            {summary.plan.id === "free" ? "Upgrade" : "Change plan"}
          </Link>
          {!atBrandLimit && (
            <Link
              href="/studio/app/new"
              className="rounded-md bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
            >
              New brand
            </Link>
          )}
        </div>
      </div>

      <dl className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Brands", value: limitLabel(summary.usage.brands, summary.limits.brands) },
          {
            label: "Exports this month",
            value: limitLabel(summary.usage.exports, summary.limits.exports),
          },
          {
            label: "AI generations this month",
            value: limitLabel(summary.usage.aiCurations, summary.limits.aiCurations),
          },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg border border-slate-200 p-4">
            <dt className="text-xs uppercase tracking-wide text-slate-500">
              {stat.label}
            </dt>
            <dd className="mt-1 text-lg font-semibold text-slate-900">{stat.value}</dd>
          </div>
        ))}
      </dl>

      {atBrandLimit && (
        <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          You&apos;ve used all {summary.limits.brands} brand
          {summary.limits.brands === 1 ? "" : "s"} on the {summary.plan.name} plan.{" "}
          <Link href="/studio/pricing" className="font-semibold underline">
            Upgrade to add more
          </Link>
          .
        </p>
      )}

      {brands.length === 0 ? (
        <div className="mt-10 rounded-lg border border-dashed border-slate-300 p-10 text-center">
          <h2 className="text-lg font-semibold text-slate-900">No brands yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
            Tell us your company name, entity type and CIN. We&apos;ll generate three
            brand directions and a full compliance report.
          </p>
          <Link
            href="/studio/app/new"
            className="mt-6 inline-block rounded-md bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-700"
          >
            Create your first brand
          </Link>
        </div>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {brands.map((brand) => {
            const audit = auditBrand(toComplianceInput(brand));
            const logo = composeLogo(toTokens(brand, brand.kit), {
              layout: "horizontal",
            });
            return (
              <li key={brand.id}>
                <Link
                  href={`/studio/app/${brand.id}`}
                  className="block rounded-lg border border-slate-200 p-5 transition hover:border-orange-400"
                >
                  <div
                    className="h-14 w-full max-w-56 [&>svg]:h-full [&>svg]:w-auto"
                    dangerouslySetInnerHTML={{ __html: logo.svg }}
                  />
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-sm font-semibold text-slate-900">
                        {brand.legalName ?? brand.name}
                      </h2>
                      <p className="text-xs text-slate-500">
                        {brand.industry}
                        {brand._count.employees > 0 &&
                          ` · ${brand._count.employees} employee${brand._count.employees === 1 ? "" : "s"}`}
                      </p>
                    </div>
                    <StatusPill status={audit.status} />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
