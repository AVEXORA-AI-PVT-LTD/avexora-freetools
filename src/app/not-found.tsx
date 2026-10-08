import Link from "next/link";
import { HeaderNav } from "@/components/editorial/header-nav";
import { FooterSection } from "@/components/editorial/footer-section";
import { categories } from "@/tools/categories";
import { 
  Search, 
  Home, 
  ArrowRight, 
  Compass, 
  Calculator, 
  Receipt, 
  FileText, 
  Code, 
  Layers 
} from "lucide-react";

export const metadata = {
  title: "404 — Page Not Found | Avexora Tools",
  description: "The requested tool or page could not be found. Search our catalog of 130+ free business, developer, and productivity utilities.",
};

const POPULAR_TOOLS = [
  { name: "GST Calculator", href: "/finance-calculators/gst-calculator", category: "Finance" },
  { name: "Salary & CTC Calculator", href: "/hr-payroll/salary-calculator", category: "HR & Payroll" },
  { name: "PDF Merger", href: "/pdf-tools/pdf-merger", category: "PDF Utilities" },
  { name: "Invoice Generator", href: "/invoicing-billing/invoice-generator", category: "Billing" },
  { name: "QR Code Generator", href: "/marketing-seo/qr-code-generator", category: "Marketing" },
  { name: "JSON Formatter", href: "/developer-web/json-formatter", category: "Developer" },
];

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white text-stone-900 font-sans selection:bg-orange-500 selection:text-white flex flex-col justify-between relative">
      <div className="absolute inset-0 bg-matrix-grid opacity-35 pointer-events-none" />
      <HeaderNav />

      <div className="flex-1 pt-24 sm:pt-28 pb-16 relative z-10 flex flex-col justify-center">
        <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center space-y-8">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-200/80 bg-orange-100/70 px-4 py-1.5 text-xs font-mono font-bold uppercase tracking-wider text-orange-800 shadow-2xs">
            <Compass className="w-3.5 h-3.5 text-orange-600 animate-spin" style={{ animationDuration: '6s' }} />
            <span>ERROR 404 &bull; RESOURCE NOT LOCATED</span>
          </div>

          {/* Heading */}
          <div className="space-y-3">
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-stone-900 leading-tight">
              Page or tool not found
            </h1>
            <p className="max-w-xl mx-auto text-sm sm:text-base text-stone-600 leading-relaxed">
              The page you requested may have been moved, renamed, or does not exist.
              Explore our 130+ free tools below or return to the main dashboard.
            </p>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/"
              className="px-6 py-3 rounded-xl bg-orange-600 text-white hover:bg-orange-700 font-semibold text-sm shadow-md shadow-orange-500/20 transition flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              <span>Go to Homepage</span>
            </Link>

            <Link
              href="/#categories-showcase"
              className="px-6 py-3 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-800 font-semibold text-sm shadow-xs transition flex items-center gap-2"
            >
              <Layers className="w-4 h-4 text-orange-600" />
              <span>Browse All Categories</span>
            </Link>
          </div>

          {/* Popular Tools Quick Recovery Deck */}
          <div className="pt-8 border-t border-stone-200/80 max-w-2xl mx-auto text-left">
            <div className="text-xs font-mono uppercase text-stone-400 font-semibold mb-3 text-center sm:text-left">
              Most Popular Tools Right Now:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {POPULAR_TOOLS.map((tool) => (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className="p-3 rounded-xl border border-stone-200/80 bg-white hover:border-orange-300 hover:bg-orange-50/50 transition-all flex items-center justify-between group shadow-2xs"
                >
                  <div>
                    <div className="text-xs font-bold text-stone-900 group-hover:text-orange-600 transition-colors">
                      {tool.name}
                    </div>
                    <div className="text-[10px] font-mono text-stone-400">
                      {tool.category}
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-orange-600 group-hover:translate-x-0.5 transition-all" />
                </Link>
              ))}
            </div>
          </div>

          {/* Category Directory Pills */}
          <div className="pt-6 max-w-3xl mx-auto">
            <div className="text-xs font-mono uppercase text-stone-400 font-semibold mb-3">
              Explore by Department:
            </div>
            <nav aria-label="Tool Categories" className="flex flex-wrap justify-center gap-2">
              {categories.map((c) => (
                <Link
                  key={c.slug}
                  href={`/${c.slug}`}
                  className="rounded-xl border border-stone-200/80 bg-white px-3.5 py-1.5 text-xs font-medium text-stone-700 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700 transition shadow-2xs"
                >
                  {c.name}
                </Link>
              ))}
            </nav>
          </div>

        </main>
      </div>

      <FooterSection />
    </div>
  );
}