import { getPublishedList } from "@/server/content-service";
import { ContentType } from "@prisma/client";
import { SITE_NAME } from "@/tools/categories";
import { MarkdownRenderer } from "@/components/content/MarkdownRenderer";

export const metadata = {
  title: "Frequently Asked Questions",
  description: `Answers to common questions about ${SITE_NAME} tools and services.`,
};

import Link from "next/link";
import { HeaderNav } from "@/components/editorial/header-nav";
import { FooterSection } from "@/components/editorial/footer-section";

export default async function FAQPage() {
  const faqs = await getPublishedList(ContentType.FAQ);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(faq => ({
      "@type": "Question",
      name: faq.title,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.excerpt || faq.content.substring(0, 200) + "..." 
      }
    }))
  };

  return (
    <div className="min-h-screen bg-white text-stone-900 font-sans selection:bg-orange-500 selection:text-white">
      <HeaderNav />
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pb-16" style={{ paddingTop: "calc(var(--nav-h) + 32px)" }}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs font-mono text-stone-500 mb-6">
          <Link href="/" className="hover:text-stone-900 transition">
            Home
          </Link>
          <span>/</span>
          <span className="text-orange-600 font-semibold">FAQ</span>
        </nav>

        <header className="mb-10 text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-stone-950">
            Frequently Asked Questions
          </h1>
          <p className="mt-3 text-sm sm:text-base text-stone-600 max-w-xl mx-auto">
            Everything you need to know about our tools, privacy architecture, and capabilities.
          </p>
        </header>

        <div className="space-y-6">
          {faqs.length > 0 ? (
            faqs.map(faq => (
              <div key={faq.id} className="rounded-2xl border border-stone-200/90 bg-white p-6 sm:p-7 shadow-2xs space-y-3">
              <h3 className="text-lg font-bold text-stone-900">{faq.title}</h3>
              <div className="text-stone-600 text-sm leading-relaxed">
                <MarkdownRenderer content={faq.content} />
              </div>
            </div>
          ))
        ) : (
          <div className="space-y-4">
            {[
              {
                q: "Is Avexora Tools really free with no account required?",
                a: "Yes. Every calculator, PDF tool, file generator, and developer utility on tools.avexora.in is completely free to use. You do not need to register an account, enter payment information, or submit your email address to access core utilities."
              },
              {
                q: "How do you guarantee that files and calculation data remain private?",
                a: "All computation, including PDF merging, image resizing, JSON formatting, and tax calculations, runs locally inside your browser using client-side JavaScript, Web Workers, and WebAssembly. Your files and proprietary numbers never leave your machine or upload to cloud storage."
              },
              {
                q: "Are the tax and payroll calculators compliant with current Indian regulations?",
                a: "Yes. All statutory calculators (including New vs. Old Tax Regime, GST, Gratuity, EPF, and HRA) are regularly audited and calibrated against current Central Board of Direct Taxes (CBDT) and Goods and Services Tax (GST) council notifications."
              },
              {
                q: "Can I use generated documents and invoices for commercial purposes?",
                a: "Absolutely. All invoices, letterheads, salary slips, and receipts generated through Avexora Tools are 100% yours to download, print, distribute, and archive for commercial business operations."
              },
              {
                q: "Can I use these tools offline?",
                a: "Yes. Once the web application is loaded in your browser cache, the WebAssembly and client-side computation algorithms work without an active internet connection."
              },
              {
                q: "What is the relationship between Avexora Free Tools and Avexora Enterprise EBOS?",
                a: "Avexora Tools is the standalone public utility suite created by Avexora Technologies. For businesses needing multi-user team collaboration, automated WhatsApp marketing, automated GST e-invoicing, and enterprise CRM, we offer the Enterprise Business OS (EBOS) platform."
              }
            ].map((faq, i) => (
              <div key={i} className="rounded-2xl border border-stone-200/90 bg-white p-6 sm:p-7 shadow-2xs space-y-2">
                <h3 className="text-base sm:text-lg font-bold text-stone-900">{faq.q}</h3>
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Still have questions CTA */}
      <div className="mt-12 p-8 rounded-3xl border border-orange-200/80 bg-gradient-to-br from-orange-50/60 to-white text-center space-y-3">
        <h3 className="text-lg font-bold text-stone-900">Have a question not listed here?</h3>
        <p className="text-xs sm:text-sm text-stone-600 max-w-md mx-auto">
          Need a specific calculator added or want to report an issue? Explore our complete tool directory or get in touch.
        </p>
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl bg-orange-600 text-white font-semibold text-xs hover:bg-orange-700 shadow-sm transition"
          >
            Explore 130+ Tools
          </Link>
          <a
            href="mailto:support@avexora.in"
            className="px-5 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-700 font-semibold text-xs hover:bg-stone-50 transition"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
    <FooterSection />
  </div>
  );
}
