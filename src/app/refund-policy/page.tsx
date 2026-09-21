import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME, SITE_OG_IMAGE, SITE_URL } from "@/tools/categories";
import { H2, P, Ul, Li } from "@/components/legal/legal-blocks";

const title = "Refund Policy";
const description =
  "Avexora Tools' free tools cost nothing. Our refund policy for Brand Studio paid subscriptions.";
const LAST_UPDATED = "21 September 2026";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/refund-policy` },
  openGraph: {
    title: `${title} | ${SITE_NAME}`,
    description,
    url: `${SITE_URL}/refund-policy`,
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

export default function RefundPolicyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Refund Policy</h1>
      <p className="mt-2 text-sm text-slate-500">Last updated: {LAST_UPDATED}</p>

      <P>
        This policy covers paid subscriptions to Brand Studio (Launch, Growth,
        and Agency plans), operated by{" "}
        <strong>Avexora AI (OPC) Private Limited</strong>, registered office in
        Berhampur, Odisha, India. All other tools on {new URL(SITE_URL).host}{" "}
        are free to use, so no payment or refund applies to them.
      </P>

      <H2>1. No refunds, cancel anytime</H2>
      <P>
        Charges for Brand Studio subscriptions — whether billed monthly or
        annually — are <strong>non-refundable</strong>. This applies to the
        initial charge, any renewal charge, and mid-cycle plan upgrades.
      </P>
      <P>
        You can cancel your subscription at any time, with one click, from
        your account dashboard. Cancelling stops all future billing
        immediately, and you keep full access to the plan you already paid
        for until the end of that billing period. We do not pro-rate or
        refund the unused portion of a current period.
      </P>

      <H2>2. Why</H2>
      <P>
        Brand Studio has a full-featured Free plan you can use before paying
        anything, so you can evaluate the product without risk. Because of
        this, and because generated assets (logos, print files, ID cards) are
        delivered immediately on a paid plan, we do not offer refunds once a
        charge has gone through.
      </P>

      <H2>3. Failed or duplicate charges</H2>
      <P>
        If you were charged in error — for example, a duplicate charge caused
        by a payment gateway issue, or a charge after you had already
        cancelled — contact us and we will investigate and refund the
        erroneous amount.
      </P>

      <H2>4. Downgrades</H2>
      <P>
        Downgrading to a lower-priced plan takes effect at the start of your
        next billing period; we do not refund the difference for the period
        already in progress.
      </P>

      <H2>5. How refunds are issued</H2>
      <P>
        Where a refund is due under this policy, it is processed through
        Razorpay back to your original payment method, and typically reflects
        in your account within 5&ndash;10 business days, depending on your
        bank or card issuer.
      </P>

      <H2>6. Contact</H2>
      <P>
        For billing questions or to report an erroneous charge, contact:
      </P>
      <P>
        Avexora AI (OPC) Private Limited
        <br />
        Berhampur, Odisha, India
        <br />
        Email:{" "}
        <a href="mailto:support@avexora.in" className="text-orange-700 hover:underline">
          support@avexora.in
        </a>
      </P>

      <Ul>
        <Li>
          See our <Link href="/studio/pricing" className="text-orange-700 hover:underline">Brand Studio pricing</Link> for current plan details.
        </Li>
        <Li>
          See our <Link href="/terms" className="text-orange-700 hover:underline">Terms &amp; Conditions</Link> and{" "}
          <Link href="/privacy-policy" className="text-orange-700 hover:underline">Privacy Policy</Link>.
        </Li>
      </Ul>
    </main>
  );
}
