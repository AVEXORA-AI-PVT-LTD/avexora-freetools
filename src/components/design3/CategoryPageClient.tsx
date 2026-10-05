"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Calculator, 
  Receipt, 
  Users, 
  Search, 
  FileText, 
  Image as ImageIcon, 
  Binary, 
  ShieldCheck, 
  Code, 
  Palette, 
  ArrowUpRight, 
  CheckCircle2, 
  Terminal, 
  ShieldAlert, 
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Layers
} from 'lucide-react';
import { Navbar } from './Navbar';
import { SearchModal } from './SearchModal';
import { ToolModal } from './ToolModal';
import { FooterSection } from '@/components/editorial/footer-section';
import { categories } from '@/tools/categories';
import type { CategoryDef, CategorySlug } from '@/types/tools';
import { ALL_TOOLS, ToolItem } from '@/data/toolsData';

export interface SerializedCategoryTool {
  slug: string;
  name: string;
  tagline?: string;
  seoDescription?: string;
  category?: string;
  kind?: string;
}

interface CategoryPageClientProps {
  category: CategoryDef;
  tools: SerializedCategoryTool[];
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'finance-calculators': <Calculator className="w-5 h-5 text-orange-500" />,
  'invoicing-billing': <Receipt className="w-5 h-5 text-orange-500" />,
  'hr-payroll': <Users className="w-5 h-5 text-orange-500" />,
  'marketing-seo': <Search className="w-5 h-5 text-orange-500" />,
  'pdf-tools': <FileText className="w-5 h-5 text-orange-500" />,
  'image-tools': <ImageIcon className="w-5 h-5 text-orange-500" />,
  'text-data-tools': <Binary className="w-5 h-5 text-orange-500" />,
  'business-legal': <ShieldCheck className="w-5 h-5 text-orange-500" />,
  'developer-web': <Code className="w-5 h-5 text-orange-500" />,
  'brand-studio': <Palette className="w-5 h-5 text-orange-500" />,
};

export const CategoryPageClient: React.FC<CategoryPageClientProps> = ({
  category,
  tools,
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState<ToolItem | null>(null);

  // Handle Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleToolClick = (toolSlug: string) => {
    const matched = ALL_TOOLS.find((t) => t.id === toolSlug);
    if (matched) {
      setSelectedTool(matched);
    }
  };

  return (
    <div className="min-h-screen bg-white text-stone-900 selection:bg-orange-500 selection:text-white font-sans">
      {/* Design 3 Fixed Navbar with Search & Auth */}
      <Navbar onSearchClick={() => setIsSearchOpen(true)} />

      {/* Main Content Area */}
      <main className="pt-20 sm:pt-22 pb-16">
        
        {/* ========================================================
            HERO HEADER WITH MATRIX GRID & GLOW
            ======================================================== */}
        <section className="relative overflow-hidden border-b border-stone-200/90 pt-5 pb-5 sm:pt-7 sm:pb-7 bg-stone-50/50">
          <div className="absolute inset-0 bg-matrix-grid opacity-35 pointer-events-none" />
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            {/* Breadcrumb Navigation */}
            <nav className="flex items-center gap-2 text-xs font-mono text-stone-500 mb-3.5">
              <Link href="/" className="hover:text-stone-900 transition">
                Home
              </Link>
              <span>/</span>
              <Link href="/#categories-showcase" className="hover:text-stone-900 transition">
                Categories
              </Link>
              <span>/</span>
              <span className="text-orange-600 font-semibold">{category.name}</span>
            </nav>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-5">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100/70 border border-orange-200 text-orange-800 font-mono text-xs font-semibold mb-2.5">
                  <Terminal className="w-3.5 h-3.5 text-orange-600" />
                  <span>DOMAIN MATRIX // {category.shortName.toUpperCase()}</span>
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-stone-950 tracking-tight leading-tight">
                  {category.name}
                </h1>

                <p className="mt-2 text-stone-600 text-sm sm:text-base max-w-2xl leading-relaxed">
                  {category.description}
                </p>
              </div>

              {/* Telemetry Pills */}
              <div className="flex flex-wrap items-center gap-2.5 font-mono text-xs shrink-0">
                <span className="px-3 py-1.5 rounded-xl bg-white border border-stone-200 text-stone-700 shadow-2xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>100% In-Browser WASM</span>
                </span>
                <span className="px-3 py-1.5 rounded-xl bg-stone-900 text-white shadow-2xs font-bold">
                  {tools.length} Production Tools
                </span>
              </div>
            </div>

            {/* Domain Switcher Bar */}
            <div className="mt-6 pt-4 border-t border-stone-200/80">
              <div className="text-[11px] font-mono uppercase text-stone-400 font-semibold mb-2">
                Switch Domain Deck:
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {categories.map((c) => {
                  const isActive = c.slug === category.slug;
                  return (
                    <Link
                      key={c.slug}
                      href={`/${c.slug}`}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-2 border ${
                        isActive
                          ? 'bg-stone-950 text-white border-stone-950 shadow-sm'
                          : 'bg-white hover:bg-stone-100 text-stone-600 hover:text-stone-900 border-stone-200'
                      }`}
                    >
                      <span className="text-xs">{CATEGORY_ICONS[c.slug] || <Layers className="w-3.5 h-3.5" />}</span>
                      <span>{c.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

          </div>
        </section>

        {/* ========================================================
            TOOLS GRID (DESIGN 3 LUXURY BENTO CARDS)
            ======================================================== */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-7">
          <div className="flex items-center justify-between pb-3.5 border-b border-stone-200">
            <span className="text-xs font-mono text-stone-500 font-bold uppercase tracking-wider">
              ALL TOOLS IN THIS DECK ({tools.length})
            </span>
            <span className="text-xs font-mono text-orange-600 font-medium hidden sm:inline">
              Instant Execution · Zero Server Latency
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-5">
            {tools.map((tool, idx) => {
              const toolNumber = String(idx + 1).padStart(2, '0');
              return (
                <div
                  key={tool.slug}
                  className="bg-white rounded-2xl border border-stone-200 hover:border-orange-500/80 p-6 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between group relative overflow-hidden"
                >
                  {/* Subtle hover gradient accent */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 group-hover:bg-orange-500/10 rounded-full blur-2xl pointer-events-none transition-colors" />

                  <div>
                    {/* Top Row: Icon & Number Index */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-orange-100/70 text-orange-600 flex items-center justify-center border border-orange-200/50 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                        {CATEGORY_ICONS[category.slug] || <Calculator className="w-5 h-5" />}
                      </div>
                      <span className="font-mono text-xs font-bold text-stone-400 group-hover:text-orange-500 transition-colors">
                        {toolNumber}
                      </span>
                    </div>

                    {/* Tool Name */}
                    <h3 className="text-lg font-bold text-stone-900 group-hover:text-orange-600 transition-colors leading-snug">
                      <Link href={`/${category.slug}/${tool.slug}`}>
                        {tool.name}
                      </Link>
                    </h3>

                    {/* Tagline / Description */}
                    <p className="mt-2 text-stone-600 text-xs sm:text-sm leading-relaxed line-clamp-2">
                      {tool.tagline || tool.seoDescription}
                    </p>
                  </div>

                  {/* Card Bottom Bar */}
                  <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between text-xs">
                    <span className="font-mono text-[11px] text-stone-400">
                      {tool.kind === 'file-tool' ? 'Local File' : 'Client WASM'}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToolClick(tool.slug)}
                        className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-orange-100 text-stone-700 hover:text-orange-700 font-mono text-[11px] font-semibold transition cursor-pointer"
                      >
                        Quick Modal
                      </button>

                      <Link
                        href={`/${category.slug}/${tool.slug}`}
                        className="font-bold text-orange-600 hover:text-orange-700 inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                      >
                        <span>Open</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

      </main>

      {/* Restored Clean Footer */}
      <FooterSection onOpenSearch={() => setIsSearchOpen(true)} />

      {/* Search Modal (⌘K) */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectTool={(tool) => setSelectedTool(tool)}
      />

      {/* Quick Interactive Tool Modal */}
      <ToolModal
        tool={selectedTool}
        onClose={() => setSelectedTool(null)}
      />
    </div>
  );
};
