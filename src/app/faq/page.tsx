import { getPublishedList } from "@/server/content-service";
import { ContentType } from "@prisma/client";
import { SITE_NAME } from "@/tools/categories";
import { MarkdownRenderer } from "@/components/content/MarkdownRenderer";

export const metadata = {
  title: `Frequently Asked Questions | ${SITE_NAME}`,
  description: `Answers to common questions about ${SITE_NAME} tools and services.`,
};

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
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <header className="mb-12 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Frequently Asked Questions
        </h1>
        <p className="mt-4 text-lg text-slate-600">
          Everything you need to know about the product and billing.
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
          <p className="text-center text-slate-500 py-10">No FAQs available at the moment.</p>
        )}
      </div>
    </div>
  );
}
