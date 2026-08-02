import type { Metadata } from "next";
import { SITE_NAME, SITE_URL } from "@/tools/categories";
import { PLANS, PLAN_ORDER, annualSavingMonths, formatINR } from "@/studio/plans";
import { razorpayEnabled } from "@/server/billing/razorpay";
import { UpgradeButton } from "@/components/studio/upgrade-button";

const title = "Brand Studio pricing";
const description =
  "Plans from ₹499/month for compliance-ready Indian business stationery. Monthly by default, renewal reminders, one-click cancellation.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/studio/pricing` },
  openGraph: { title: `${title} | ${SITE_NAME}`, description },
};

export default function PricingPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Pricing</h1>
      <p className="mt-3 max-w-2xl text-slate-600">
        Priced for Indian SMBs, in rupees. Every paid plan includes the full
        compliance engine and print-ready PDFs.
      </p>

      {!razorpayEnabled && (
        <p className="mt-6 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Checkout is not switched on in this environment. Plans and limits are
          fully enforced; add your Razorpay keys to accept payments.
        </p>
      )}

      <div className="mt-10 grid gap-6 lg:grid-cols-4">
        {PLAN_ORDER.map((id) => {
          const plan = PLANS[id];
          const free = plan.monthlyPaise === 0;
          const savings = annualSavingMonths(plan);
          const featured = id === "launch";

          return (
            <div
              key={id}
              className={`flex flex-col rounded-lg border p-6 ${
                featured
                  ? "border-indigo-500 ring-1 ring-indigo-500"
                  : "border-slate-200"
              }`}
            >
              {featured && (
                <span className="mb-3 self-start rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                  Most popular
                </span>
              )}
              <h2 className="text-lg font-semibold text-slate-900">{plan.name}</h2>
              <p className="mt-1 min-h-10 text-sm text-slate-600">{plan.tagline}</p>

              <p className="mt-4 text-3xl font-bold text-slate-900">
                {free ? "₹0" : formatINR(plan.monthlyPaise)}
                {!free && (
                  <span className="text-sm font-normal text-slate-500">/month</span>
                )}
              </p>
              {!free && (
                <p className="mt-1 text-xs text-slate-500">
                  or {formatINR(plan.yearlyPaise)}/year — {savings} months free
                </p>
              )}

              <ul className="mt-5 flex-1 space-y-2 text-sm text-slate-700">
                {plan.highlights.map((h) => (
                  <li key={h} className="flex gap-2">
                    <span aria-hidden className="text-indigo-600">
                      •
                    </span>
                    <span>{h}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6">
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

      <section className="mt-14 max-w-3xl">
        <h2 className="text-xl font-semibold text-slate-900">
          Our billing promise
        </h2>
        <ul className="mt-4 space-y-2 text-sm text-slate-700">
          <li>Monthly is the default. Annual is a discount, never a trap.</li>
          <li>A renewal reminder by email seven days before every charge.</li>
          <li>Cancel in one click from your dashboard — no retention flow.</li>
          <li>
            Cancelling keeps your access until the end of the period you already
            paid for.
          </li>
        </ul>
        <p className="mt-4 text-sm text-slate-500">
          Auto-renewal complaints are the single most-cited problem with the
          incumbent logo makers. We wrote the opposite behaviour into the
          product.
        </p>
      </section>
    </main>
  );
}
