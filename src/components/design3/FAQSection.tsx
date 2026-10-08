"use client";

import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { useScrollReveal } from '@/hooks/useScrollReveal';

interface FAQItem {
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    question: "Is Avexora Tools really 100% free with no sign-up?",
    answer: "Yes, every tool on tools.avexora.in is free to use without requiring an account, credit card, or email address. We believe basic business and developer utilities should be universally accessible."
  },
  {
    question: "How do you guarantee that files and numbers remain private?",
    answer: "All computation, including PDF merging, image resizing, and tax mathematics, takes place inside your browser using client-side JavaScript, Web Workers, and WebAssembly. Your files and data never touch our servers or leave your local machine."
  },
  {
    question: "What business stationery formats can I generate with Brand Studio?",
    answer: "Our Brand Studio lets you generate official high-resolution letterheads, visiting cards, employee ID badges, and invoice layouts ready for print and digital dispatch with all required corporate particulars."
  },
  {
    question: "How does Avexora Tools connect with Enterprise Business OS (EBOS)?",
    answer: "Avexora Tools serves as the standalone utility gateway for Avexora's Enterprise Business OS (EBOS), which offers end-to-end CRM, automated billing, team payroll, and WhatsApp automation for growing enterprises."
  },
  {
    question: "Can I use these tools offline without an internet connection?",
    answer: "Yes. Once the page is loaded into your browser cache, the WebAssembly and JavaScript engines function completely offline without active internet connectivity."
  }
];

export const FAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const faqReveal = useScrollReveal();

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq" className="pt-12 pb-14 sm:pt-14 sm:pb-16 bg-stone-50 border-t border-stone-200">
      <div 
        ref={faqReveal.ref}
        className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        <div className={`text-center mb-8 sm:mb-10 reveal-up ${faqReveal.isVisible ? 'revealed' : ''}`}>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="mt-2 text-stone-600 text-sm sm:text-base">
            Everything you need to know about our privacy architecture, licensing, and compliance.
          </p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div 
                key={idx}
                className={`bg-white rounded-2xl border border-stone-200/90 overflow-hidden shadow-2xs transition reveal-up ${
                  faqReveal.isVisible ? 'revealed' : ''
                }`}
                style={{ transitionDelay: `${idx * 80}ms` }}
              >
                <button
                  onClick={() => toggle(idx)}
                  className="w-full text-left p-5 sm:p-6 flex items-center justify-between gap-4 cursor-pointer hover:bg-stone-50/50 transition"
                >
                  <span className="font-bold text-stone-900 text-sm sm:text-base">
                    {faq.question}
                  </span>
                  <ChevronDown className={`w-5 h-5 text-stone-400 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180 text-orange-600' : ''}`} />
                </button>

                {isOpen && (
                  <div className="px-5 pb-6 sm:px-6 sm:pb-6 text-stone-600 text-sm leading-relaxed border-t border-stone-100 pt-4 animate-in fade-in duration-200">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
