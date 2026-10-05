import type { Metadata } from "next";
import Link from "next/link";
import { EBOS_URL, SITE_NAME, SITE_OG_IMAGE, SITE_URL } from "@/tools/categories";
import { H2, P, Ul, Li } from "@/components/legal/legal-blocks";

const title = "Terms & Conditions";
const description =
  "The terms that govern your use of Avexora Tools' free tools and the Brand Studio subscription product.";
const LAST_UPDATED = "21 September 2026";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/terms` },
  openGraph: {
    title: `${title} | ${SITE_NAME}`,
    description,
    url: `${SITE_URL}/terms`,
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

import { HeaderNav } from "@/components/editorial/header-nav";
import { FooterSection } from "@/components/editorial/footer-section";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white text-stone-900 font-sans selection:bg-orange-500 selection:text-white">
      <HeaderNav />
      <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pb-16" style={{ paddingTop: "calc(var(--nav-h) + 32px)" }}>
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs font-mono text-stone-500 mb-6">
          <Link href="/" className="hover:text-stone-900 transition">
            Home
          </Link>
          <span>/</span>
          <span className="text-orange-600 font-semibold">Terms &amp; Conditions</span>
        </nav>

        <div className="border-b border-stone-200 pb-6 mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-stone-950">Terms &amp; Conditions</h1>
          <p className="mt-2 text-xs sm:text-sm text-stone-500 font-mono">Last updated: {LAST_UPDATED}</p>
        </div>

      <P>
        These Terms &amp; Conditions (&ldquo;Terms&rdquo;) govern your use of{" "}
        {new URL(SITE_URL).host} (&ldquo;Avexora Tools&rdquo;, &ldquo;the
        Site&rdquo;) and the Brand Studio product, operated by{" "}
        <strong>Avexora AI (OPC) Private Limited</strong>, registered office in
        Berhampur, Odisha, India (&ldquo;Avexora&rdquo;, &ldquo;we&rdquo;,
        &ldquo;us&rdquo;). By using the Site you agree to these Terms. If you
        do not agree, please do not use the Site.
      </P>

      <H2>1. What we provide</H2>
      <P>
        Avexora Tools offers a set of free-to-use online calculators,
        generators, PDF and image utilities, and AI writing tools, alongside
        Brand Studio — a paid subscription product for generating compliant
        business stationery (logos, letterheads, ID cards, and related
        assets) for Indian businesses.
      </P>

      <H2>2. Free tools</H2>
      <Ul>
        <Li>The free tools do not require sign-up and are provided at no cost.</Li>
        <Li>Outputs (calculations, documents, converted files) are provided for convenience and general guidance only. Always verify results independently — especially for legal, tax, or financial documents — before relying on them.</Li>
        <Li>We may add, change, or discontinue any free tool at any time without notice.</Li>
      </Ul>

      <H2>3. Accounts</H2>
      <Ul>
        <Li>A Brand Studio account may be created via Google, Facebook, or a magic-link email sign-in.</Li>
        <Li>You are responsible for keeping your account credentials and sign-in access secure, and for all activity under your account.</Li>
        <Li>You must provide accurate information (including any statutory business particulars you enter) and keep it up to date.</Li>
        <Li>You must be authorised to act for the business whose details you enter into Brand Studio.</Li>
      </Ul>

      <H2>4. Subscriptions &amp; billing</H2>
      <Ul>
        <Li>Brand Studio offers a Free tier and paid plans (Launch, Growth, Agency), billed monthly or annually in Indian Rupees.</Li>
        <Li>Payments are processed by Razorpay. By subscribing, you also agree to Razorpay&rsquo;s applicable terms for the payment method you use.</Li>
        <Li>Paid plans renew automatically at the end of each billing period unless cancelled before the renewal date.</Li>
        <Li>You can cancel at any time from your account dashboard. Cancelling stops future billing; you keep access to your paid plan until the end of the period you already paid for.</Li>
        <Li>See our <Link href="/refund-policy" className="text-orange-700 hover:underline">Refund Policy</Link> for details on charges already made.</Li>
      </Ul>

      <H2>5. Acceptable use</H2>
      <P>You agree not to:</P>
      <Ul>
        <Li>Use the Site for any unlawful purpose, or to generate documents intended to mislead, defraud, or impersonate another person or entity.</Li>
        <Li>Attempt to gain unauthorised access to our systems, other users&rsquo; accounts or data, or probe/scan our infrastructure.</Li>
        <Li>Upload malicious files, or content you do not have the right to use.</Li>
        <Li>Scrape, resell, or systematically extract the Site&rsquo;s tools or outputs to build a competing service, except via any API access explicitly granted under an Agency plan.</Li>
        <Li>Interfere with the normal operation of the Site (for example, abusive automated requests).</Li>
      </Ul>
      <P>We may suspend or terminate access for accounts that violate these Terms.</P>

      <H2>6. Intellectual property</H2>
      <Ul>
        <Li>The Site, its tools, design, and underlying software are owned by Avexora and protected by applicable intellectual property laws.</Li>
        <Li>You retain ownership of the content you upload or the business/brand assets you generate through Brand Studio. We do not claim ownership of your generated logos, documents, or brand assets.</Li>
        <Li>Exports on the Free plan carry a watermark; paid plans remove it as described on the pricing page.</Li>
      </Ul>

      <H2>7. Disclaimers</H2>
      <P>
        Tools are provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;,
        without warranties of any kind, express or implied. Calculators,
        generators, and document templates (including any legal, tax, HR, or
        compliance-related content) are provided for general informational
        convenience only and do not constitute legal, financial, tax, or
        professional advice. You are solely responsible for verifying results
        and for compliance with applicable laws before relying on any output.
      </P>

      <H2>8. Limitation of liability</H2>
      <P>
        To the maximum extent permitted by law, Avexora shall not be liable
        for any indirect, incidental, special, or consequential damages, or
        any loss of profits, data, or business, arising from your use of the
        Site or Brand Studio. Our total liability for any claim relating to
        Brand Studio is limited to the amount you paid us in the twelve
        months preceding the claim.
      </P>

      <H2>9. Availability</H2>
      <P>
        We aim to keep the Site available at all times but do not guarantee
        uninterrupted access. We may perform maintenance, or the Site may be
        unavailable due to factors outside our control.
      </P>

      <H2>10. Third-party links</H2>
      <P>
        The Site links to third-party services, including{" "}
        <a href={EBOS_URL} className="text-orange-700 hover:underline">
          Enterprise Business OS
        </a>{" "}
        and our payment and authentication providers. We are not responsible
        for the content or practices of third-party sites.
      </P>

      <H2>11. Changes to these Terms</H2>
      <P>
        We may update these Terms from time to time. Continued use of the
        Site after a change takes effect constitutes acceptance of the
        updated Terms. Material changes will be reflected by updating the
        &ldquo;Last updated&rdquo; date above.
      </P>

      <H2>12. Governing law</H2>
      <P>
        These Terms are governed by the laws of India. Any disputes shall be
        subject to the exclusive jurisdiction of the courts of Odisha, India.
      </P>

      <H2>13. Contact</H2>
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

      <p className="mt-10 text-sm text-stone-500 border-t border-stone-200 pt-6">
        See also our{" "}
        <Link href="/privacy-policy" className="text-orange-600 font-semibold hover:underline">
          Privacy Policy
        </Link>{" "}
        and{" "}
        <Link href="/refund-policy" className="text-orange-600 font-semibold hover:underline">
          Refund Policy
        </Link>
        .
      </p>
    </main>
    <FooterSection />
  </div>
  );
}
