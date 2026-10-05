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
      
      <div className="space-y-8">
        {faqs.map(faq => (
          <div key={faq.id} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-3">{faq.title}</h3>
            <div className="text-slate-600">
              <MarkdownRenderer content={faq.content} />
            </div>
          </div>
        ))}
        {faqs.length === 0 && (
          <p className="text-center text-stone-500 py-10 font-mono text-sm">No FAQs available at the moment.</p>
        )}
      </div>
    </div>
    <FooterSection />
  </div>
  );
}
