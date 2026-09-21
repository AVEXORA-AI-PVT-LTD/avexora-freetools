import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME, SITE_OG_IMAGE, SITE_URL } from "@/tools/categories";
import { H2, P, Ul, Li } from "@/components/legal/legal-blocks";

const title = "Privacy Policy";
const description =
  "How Avexora Tools collects, uses, and protects your data across the free tools, Brand Studio, and account features.";
const LAST_UPDATED = "21 September 2026";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/privacy-policy` },
  openGraph: {
    title: `${title} | ${SITE_NAME}`,
    description,
    url: `${SITE_URL}/privacy-policy`,
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

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Privacy Policy</h1>
      <p className="mt-2 text-sm text-slate-500">Last updated: {LAST_UPDATED}</p>

      <P>
        Avexora Tools (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) is
        operated by <strong>Avexora AI (OPC) Private Limited</strong>, with its
        registered office in Berhampur, Odisha, India (&ldquo;Avexora&rdquo;).
        This policy explains what data we collect when you use{" "}
        {new URL(SITE_URL).host} and the Brand Studio product, why we collect
        it, and the choices you have.
      </P>

      <H2>1. What we collect</H2>
      <P>
        Most of the tools on this site work entirely in your browser — files
        you upload for compression, conversion, or editing, and data you type
        into calculators or generators, are processed on your device and are
        never sent to our servers unless the tool explicitly says otherwise
        (for example, PDF/image tools that state they upload the file for
        processing). Some tools, such as the Resume Builder, save your drafts
        only in your browser&rsquo;s local storage; we never see that content.
      </P>
      <P>Beyond that, we collect:</P>
      <Ul>
        <Li>
          <strong>Contact details you give us</strong> — your email address
          (and optionally your name) if you sign up for a newsletter, request
          a downloadable result by email, or contact support.
        </Li>
        <Li>
          <strong>Account information</strong> — if you create a Brand Studio
          account, we store your name, email, phone number, company name, and
          job role, plus sign-in data from your chosen provider (Google,
          Facebook, or a magic-link email via Resend).
        </Li>
        <Li>
          <strong>Brand Studio content</strong> — business details you enter
          to generate stationery (company legal name, CIN/LLPIN, GSTIN, PAN,
          registered address, and similar statutory particulars), plus any
          employee records (name, designation, photo, contact details) you
          upload to generate ID cards.
        </Li>
        <Li>
          <strong>Billing information</strong> — if you subscribe to a paid
          plan, payments are processed by Razorpay. We store your subscription
          status and plan, but we do not store your card or bank details;
          those are held by Razorpay under its own privacy policy.
        </Li>
        <Li>
          <strong>Technical data</strong> — standard server logs (IP address,
          browser type, pages visited, timestamps) generated automatically by
          any website, used only for security, debugging, and abuse
          prevention.
        </Li>
      </Ul>

      <H2>2. How we use your data</H2>
      <Ul>
        <Li>To provide the tool, account, or Brand Studio feature you asked for.</Li>
        <Li>To send transactional email (magic links, billing receipts, renewal reminders you opted into).</Li>
        <Li>To enforce plan limits and prevent abuse (for example, rate-limiting sign-in attempts).</Li>
        <Li>To respond to support requests.</Li>
        <Li>To meet legal and tax obligations.</Li>
      </Ul>
      <P>
        We do not sell your personal data, and we do not run third-party
        advertising trackers or analytics scripts on this site.
      </P>

      <H2>3. Cookies</H2>
      <P>
        We use a small number of strictly necessary cookies to keep you signed
        in to your Brand Studio account (session cookies) and to remember
        basic preferences. We do not use third-party advertising or cross-site
        tracking cookies.
      </P>

      <H2>4. Sharing your data</H2>
      <P>
        We share data only with the service providers needed to run the
        product, under contracts that require them to protect it:
      </P>
      <Ul>
        <Li><strong>Razorpay</strong> — for subscription billing and payment processing.</Li>
        <Li><strong>Resend</strong> — to deliver magic-link sign-in and transactional email.</Li>
        <Li><strong>Google / Facebook</strong> — only if you choose to sign in with one of these providers.</Li>
        <Li><strong>Cloud infrastructure providers</strong> — to host the application and database.</Li>
      </Ul>
      <P>We do not share your data with anyone else, except where required by law.</P>

      <H2>5. Data retention</H2>
      <P>
        We keep account and Brand Studio data for as long as your account is
        active. If you delete your account or ask us to, we delete or
        anonymise your personal data within a reasonable time, except where we
        are required to retain records (for example, billing records) for tax
        or legal purposes.
      </P>

      <H2>6. Your rights</H2>
      <P>
        You can ask us to access, correct, or delete the personal data we hold
        about you, or to export it, by writing to the email address below. We
        will respond within a reasonable time.
      </P>

      <H2>7. Security</H2>
      <P>
        We use industry-standard measures — encrypted connections (HTTPS),
        hashed/tokenised authentication, and access controls on our database —
        to protect your data. No method of transmission or storage is 100%
        secure, and we cannot guarantee absolute security.
      </P>

      <H2>8. Children&rsquo;s privacy</H2>
      <P>
        This site is intended for business and professional use and is not
        directed at children under 18. We do not knowingly collect personal
        data from children.
      </P>

      <H2>9. Changes to this policy</H2>
      <P>
        We may update this policy from time to time. Material changes will be
        reflected by updating the &ldquo;Last updated&rdquo; date above.
      </P>

      <H2>10. Grievance officer &amp; contact</H2>
      <P>
        For any privacy questions, data requests, or grievances (including
        under the Information Technology Act, 2000 and its rules), contact:
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

      <p className="mt-10 text-sm text-slate-500">
        See also our{" "}
        <Link href="/terms" className="text-orange-700 hover:underline">
          Terms &amp; Conditions
        </Link>{" "}
        and{" "}
        <Link href="/refund-policy" className="text-orange-700 hover:underline">
          Refund Policy
        </Link>
        .
      </p>
    </main>
  );
}
