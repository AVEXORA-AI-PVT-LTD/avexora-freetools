import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME, SITE_OG_IMAGE, SITE_URL } from "@/tools/categories";
import { HeaderNav } from "@/components/editorial/header-nav";
import { FooterSection } from "@/components/editorial/footer-section";
import { 
  ShieldCheck, 
  Cpu, 
  Sparkles, 
  FileCheck2, 
  Zap, 
  Lock, 
  CheckCircle2, 
  ArrowRight,
  FileText
} from "lucide-react";
import { PrintButton } from "@/components/about/print-button";

const title = "About Avexora Tools";
const description =
  "130+ free high-performance business, tax, developer, and productivity utilities built with privacy-first client-side architecture.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/about` },
  openGraph: {
    title: `${title} | ${SITE_NAME}`,
    description,
    url: `${SITE_URL}/about`,
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

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-stone-50/50 text-stone-900 font-sans selection:bg-orange-500 selection:text-white flex flex-col justify-between">
      <HeaderNav />
      <div className="flex-1" style={{ paddingTop: "calc(var(--nav-h) + 32px)" }}>
        <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pb-16 space-y-12">
          
          {/* Breadcrumbs & Print Action Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
            <nav className="flex items-center gap-2 text-xs font-mono text-stone-500">
              <Link href="/" className="hover:text-stone-900 transition">
                Home
              </Link>
              <span>/</span>
              <span className="text-orange-600 font-semibold">About &amp; Overview</span>
            </nav>

            <PrintButton />
          </div>

          {/* Hero Overview */}
          <div className="border-b border-stone-200 pb-8 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100/80 border border-orange-200 text-orange-800 font-mono text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-orange-600" />
              <span>ABOUT AVEXORA TOOLS &amp; ARCHITECTURE</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-stone-950 leading-tight">
              Privacy-first utility platform <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-600">
                engineered for Indian business &amp; developers
              </span>
            </h1>

            <p className="text-base sm:text-lg text-stone-600 leading-relaxed max-w-3xl">
              Avexora Tools is a comprehensive suite of 130+ free developer, tax, HR, and business utilities.
              Built by Avexora Technologies, the platform replaces ad-riddled, privacy-compromising utility websites
              with lightning-fast in-browser computing engines.
            </p>
          </div>

          {/* Core Architectural Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-stone-900">Zero Server Uploads</h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                PDF merging, image compression, word counts, and financial calculations run locally on your device via client-side JavaScript and WebAssembly. Your numbers and documents never leave your machine.
              </p>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-stone-900">Statutory Indian Rules</h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                Pre-configured with current Indian tax slabs, Section 12(3)(c) Companies Act letterhead requirements, GST breakup logic, and EPFO wage limits without guesswork.
              </p>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-stone-900">Zero Signup Friction</h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                Every utility on the tools directory is completely free with no credit card, no sign-up wall, and zero cookies tracking your activity across the web.
              </p>
            </div>
          </div>

          {/* Detailed Platform Capabilities */}
          <section className="rounded-3xl border border-stone-200 bg-white p-8 sm:p-10 space-y-6 shadow-xs">
            <h2 className="text-2xl font-bold text-stone-900 border-b border-stone-100 pb-4">
              What Avexora Tools Provides
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm text-stone-700">
              <div className="space-y-2">
                <h4 className="font-bold text-stone-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-orange-600" />
                  <span>Financial &amp; GST Calculators (19 tools)</span>
                </h4>
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed pl-6">
                  GST inclusive/exclusive calculators, EMI schedules, SIP, Compound Interest, CAGR, Margin, and Break-even models.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-stone-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-orange-600" />
                  <span>Invoicing &amp; Billing Generators (12 tools)</span>
                </h4>
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed pl-6">
                  GST compliant invoice builders, quotation generators, purchase orders, receipts, and payment reminders.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-stone-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-orange-600" />
                  <span>PDF &amp; Image Processors (25 tools)</span>
                </h4>
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed pl-6">
                  Private PDF merger, compressor, split, watermark, image background removal, and WebP/PNG converter engines.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-stone-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-orange-600" />
                  <span>Brand Studio &amp; Stationery (10 tools)</span>
                </h4>
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed pl-6">
                  Corporate stationery generator with registered CIN, official letterheads, visiting cards, and ID badge layouts.
                </p>
              </div>
            </div>
          </section>

          {/* Legal Entity & Headquarters Block */}
          <section className="rounded-2xl border border-stone-200 bg-stone-100/60 p-6 sm:p-8 space-y-3 font-mono text-xs text-stone-600">
            <div className="text-stone-900 font-bold uppercase tracking-wider text-xs">
              Entity Information &amp; Corporate Office
            </div>
            <p>
              <strong>Avexora AI (OPC) Private Limited</strong><br />
              Berhampur, Odisha, India · Support:{" "}
              <a href="mailto:support@avexora.in" className="text-orange-600 hover:underline">
                support@avexora.in
              </a>
            </p>
            <p className="text-stone-500 pt-2 border-t border-stone-200">
              Makers of Enterprise Business OS (EBOS) — CRM, payroll, and business automation software.
            </p>
          </section>

          {/* Quick CTA */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 print:hidden">
            <Link
              href="/#categories-showcase"
              className="btn-orange-glow text-white px-6 py-3 rounded-xl font-bold text-sm inline-flex items-center gap-2"
            >
              <span>Explore All 130+ Tools</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <div className="flex items-center gap-4 text-xs font-mono text-stone-500">
              <Link href="/privacy-policy" className="hover:text-stone-900">Privacy Policy</Link>
              <span>·</span>
              <Link href="/terms" className="hover:text-stone-900">Terms of Service</Link>
              <span>·</span>
              <Link href="/studio/pricing" className="hover:text-stone-900">Pricing</Link>
            </div>
          </div>

        </main>
      </div>
      <FooterSection />
    </div>
  );
}
