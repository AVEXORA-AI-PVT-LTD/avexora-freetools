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
import { Plus, ArrowLeft, Sparkles, Layers } from "lucide-react";

export const metadata: Metadata = {
  title: "Studio Dashboard",
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
    <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Back to Main Website Navigation Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200/80 pb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-mono font-semibold text-stone-700 hover:text-orange-600 bg-white border border-stone-200 hover:border-orange-300 px-3.5 py-2 rounded-xl shadow-2xs transition group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Avexora Free Tools Website</span>
        </Link>
        <div className="flex items-center gap-2 font-mono text-xs text-stone-500 bg-stone-50 border border-stone-200/80 px-3 py-1.5 rounded-full">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Identity &amp; Compliance Hub</span>
        </div>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-200/80 bg-orange-100/70 px-3.5 py-1 text-xs font-mono font-bold uppercase tracking-wider text-orange-800 shadow-2xs mb-2">
            <Layers className="w-3.5 h-3.5 text-orange-600" />
            <span>STUDIO DASHBOARD</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-stone-900">
            Studio Dashboard
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-stone-500">
            Manage your registered company brands, statutory identity particulars and legal stationery suites.
          </p>
          <div className="mt-2 inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-stone-100 text-stone-700 font-mono text-xs">
            <span className="font-semibold">{summary.plan.name} Tier</span>
            {summary.plan.monthlyPaise > 0 && <span>• {formatINR(summary.plan.monthlyPaise)}/mo</span>}
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            href="/studio/pricing"
            className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-xs font-semibold text-stone-700 hover:border-orange-400 hover:text-orange-600 shadow-2xs transition"
          >
            {summary.plan.id === "free" ? "Upgrade plan" : "Manage plan"}
          </Link>
          {!atBrandLimit && (
            <Link
              href="/studio/app/new"
              className="btn-orange-glow !text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New brand</span>
            </Link>
          )}
        </div>
      </div>

      <dl className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Active Brands", value: limitLabel(summary.usage.brands, summary.limits.brands) },
          {
            label: "Monthly Exports",
            value: limitLabel(summary.usage.exports, summary.limits.exports),
          },
          {
            label: "AI Generations",
            value: limitLabel(summary.usage.aiCurations, summary.limits.aiCurations),
          },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-2xs hover:border-stone-300 transition">
            <dt className="text-xs uppercase font-mono font-semibold tracking-wider text-stone-500">
              {stat.label}
            </dt>
            <dd className="mt-2 text-2xl font-extrabold text-stone-900">{stat.value}</dd>
          </div>
        ))}
      </dl>

      {atBrandLimit && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-xs font-medium text-amber-900 flex items-center justify-between">
          <span>
            You&apos;ve reached the limit of {summary.limits.brands} brand{summary.limits.brands === 1 ? "" : "s"} on the {summary.plan.name} plan.
          </span>
          <Link href="/studio/pricing" className="font-bold underline text-amber-950 ml-2">
            Upgrade for more →
          </Link>
        </div>
      )}

      {brands.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-stone-300 bg-stone-50/40 p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-100 border border-orange-200 flex items-center justify-center mx-auto text-orange-600">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-stone-900">No brands created yet</h2>
          <p className="mx-auto max-w-md text-xs sm:text-sm text-stone-600 leading-relaxed">
            Provide your company name, entity type and CIN. Our engine will generate brand directions, official stationery and an instant statutory compliance audit.
          </p>
          <div className="pt-2">
            <Link
              href="/studio/app/new"
              className="btn-orange-glow !text-white px-5 py-2.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>Create your first brand</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-stone-500">
            Created Workspaces ({brands.length})
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2">
            {brands.map((brand) => {
              const audit = auditBrand(toComplianceInput(brand));
              const logo = composeLogo(toTokens(brand, brand.kit), {
                layout: "horizontal",
              });
              return (
                <li key={brand.id}>
                  <Link
                    href={`/studio/app/${brand.id}`}
                    className="group block rounded-2xl border border-stone-200/90 bg-white p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-orange-400 hover:shadow-md"
                  >
                    <div
                      className="h-14 w-full max-w-56 [&>svg]:h-full [&>svg]:w-auto group-hover:scale-102 transition-transform"
                      dangerouslySetInnerHTML={{ __html: logo.svg }}
                    />
                    <div className="mt-5 flex items-center justify-between gap-3 border-t border-stone-100 pt-3">
                      <div>
                        <h3 className="text-sm font-bold text-stone-900 group-hover:text-orange-600 transition-colors">
                          {brand.legalName ?? brand.name}
                        </h3>
                        <p className="text-xs text-stone-500">
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
        </div>
      )}
    </main>
  );
}
