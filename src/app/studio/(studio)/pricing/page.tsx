import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME, SITE_OG_IMAGE, SITE_URL } from "@/tools/categories";
import { getAllPlans, annualSavingMonths, formatINR } from "@/server/studio/plans";
import { razorpayEnabled } from "@/server/billing/razorpay";
import { UpgradeButton } from "@/components/studio/upgrade-button";
import { HeaderNav } from "@/components/editorial/header-nav";
import { FooterSection } from "@/components/editorial/footer-section";
import { ArrowLeft, CheckCircle2, ShieldCheck, Zap } from "lucide-react";

const title = "Brand Studio pricing";
const description =
  "Plans from ₹499/month for compliance-ready Indian business stationery. Monthly by default, renewal reminders, one-click cancellation.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/studio/pricing` },
  openGraph: {
    title: `${title} | ${SITE_NAME}`,
    description,
    url: `${SITE_URL}/studio/pricing`,
    siteName: SITE_NAME,
    type: "website",
    images: [SITE_OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: `${title} | ${SITE_NAME}`,
    description,
    images: [SITE_OG_IMAGE],
  },
};

export default async function PricingPage() {
  const dbPlans = await getAllPlans();
  const activePlans = dbPlans.filter(p => p.isActive !== false);

  return (
    <div className="min-h-screen bg-white text-stone-900 font-sans selection:bg-orange-500 selection:text-white flex flex-col justify-between relative">
      <div className="absolute inset-0 bg-matrix-grid opacity-35 pointer-events-none" />
      <HeaderNav />

      <div className="flex-1 pt-24 sm:pt-28 pb-16 relative z-10">
        <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-10">
          {/* Back to Main Website Navigation */}
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
              <span>Transparent Pricing</span>
            </div>
          </div>

          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-200/80 bg-orange-100/70 px-3.5 py-1 text-xs font-mono font-bold uppercase tracking-wider text-orange-800 shadow-2xs mb-3">
              <Zap className="w-3.5 h-3.5 text-orange-600" />
              <span>SUBSCRIPTION TIERS</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-stone-900">Plans &amp; Pricing</h1>
            <p className="mt-2 max-w-2xl text-stone-600 text-sm sm:text-base">
              Priced for Indian SMBs and startups in INR. Every paid plan includes the full
              statutory compliance engine, high-DPI vector print-ready files and team collaboration.
            </p>
          </div>

          {!razorpayEnabled && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-xs font-medium text-amber-900">
              Checkout is in sandbox preview mode. Plans and limits are fully enforced across your workspace.
            </div>
          )}

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {activePlans.map((plan) => {
              const id = plan.id;
              const free = plan.monthlyPaise === 0;
              const savings = annualSavingMonths(plan);
              const featured = id === "launch";

              return (
                <div
                  key={id}
                  className={`flex flex-col rounded-3xl border p-6 bg-white transition-all duration-200 hover:-translate-y-1 ${
                    featured
                      ? "border-orange-500 ring-2 ring-orange-500/20 shadow-xl"
                      : "border-stone-200/90 shadow-sm hover:border-stone-300 hover:shadow-md"
                  }`}
                >
                  {featured && (
                    <span className="mb-3 self-start rounded-full bg-orange-100 border border-orange-200 px-3 py-0.5 text-[11px] font-mono font-bold uppercase tracking-wider text-orange-800">
                      Most popular
                    </span>
                  )}
                  <h2 className="text-lg font-bold text-stone-900">{plan.name}</h2>
                  <p className="mt-1 min-h-10 text-xs text-stone-500 leading-relaxed">{plan.tagline}</p>

                  <div className="mt-4">
                    <p className="text-3xl font-extrabold text-stone-950">
                      {free ? "₹0" : formatINR(plan.monthlyPaise)}
                      {!free && (
                        <span className="text-xs font-normal text-stone-500 ml-1">/month</span>
                      )}
                    </p>
                    {!free && (
                      <p className="mt-1 text-[11px] font-mono text-emerald-600 font-semibold">
                        or {formatINR(plan.yearlyPaise)}/yr ({savings} mos free)
                      </p>
                    )}
                  </div>

                  <ul className="mt-6 flex-1 space-y-2.5 text-xs text-stone-700">
                    {plan.highlights.map((h) => (
                      <li key={h} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-orange-600 mt-0.5 shrink-0" />
                        <span className="leading-tight">{h}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6 pt-4 border-t border-stone-100">
                    <UpgradeButton
                      plan={id}
                      planName={plan.name}
                      enabled={razorpayEnabled}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <section className="rounded-3xl border border-stone-200/80 bg-stone-50/60 p-6 sm:p-8 space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-orange-600" />
              <h2 className="text-lg font-bold text-stone-900">Our billing &amp; trust promise</h2>
            </div>
            <ul className="space-y-1.5 text-xs sm:text-sm text-stone-600 list-disc list-inside">
              <li>Monthly by default. Annual billing comes with genuine discounts, never forced lock-ins.</li>
              <li>Automated renewal reminders sent 7 days before any charge.</li>
              <li>1-click cancellation directly from your dashboard without retention mazes.</li>
              <li>Immediate export retention and full data ownership guaranteed.</li>
            </ul>
          </section>
        </main>
      </div>

      <FooterSection />
    </div>
  );
}
