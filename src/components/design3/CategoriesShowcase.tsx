"use client";

import React, { useState } from 'react';
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
  Sliders, 
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Layers,
  Terminal
} from 'lucide-react';
import { CATEGORIES, ALL_TOOLS, ToolItem } from '@/data/toolsData';
import { usePlatformShortcut } from '@/hooks/use-platform-shortcut';

interface CategoriesShowcaseProps {
  onSelectTool: (tool: ToolItem) => void;
  onOpenSearch: () => void;
  categories?: typeof CATEGORIES;
  tools?: ToolItem[];
}

// Category Icon Map
const ICON_MAP: Record<string, React.ReactNode> = {
  'finance-calculators': <Calculator className="w-4 h-4" />,
  'invoicing-billing': <Receipt className="w-4 h-4" />,
  'hr-payroll': <Users className="w-4 h-4" />,
  'marketing-seo': <Search className="w-4 h-4" />,
  'pdf-tools': <FileText className="w-4 h-4" />,
  'image-tools': <ImageIcon className="w-4 h-4" />,
  'text-data-tools': <Binary className="w-4 h-4" />,
  'business-legal': <ShieldCheck className="w-4 h-4" />,
  'developer-web': <Code className="w-4 h-4" />,
  'brand-studio': <Palette className="w-4 h-4" />,
};

export const CategoriesShowcase: React.FC<CategoriesShowcaseProps> = ({
  onSelectTool,
  onOpenSearch,
  categories,
  tools,
}) => {
  const { shortcutSymbol } = usePlatformShortcut();
  const [activeCategoryIndex, setActiveCategoryIndex] = useState<number>(0);
  
  const categoriesList = categories && categories.length > 0 ? categories : CATEGORIES;
  const toolsList = tools && tools.length > 0 ? tools : ALL_TOOLS;
  
  // Interactive micro-calculator inside the showcase
  const [calcInput, setCalcInput] = useState<number>(50000);
  const [sliderRate, setSliderRate] = useState<number>(18);

  // 3D Card Interactive Tilt & Holographic Sheen
  const [cardTilt, setCardTilt] = useState<{ x: number; y: number; sheenX: number; sheenY: number; isHovered: boolean }>({
    x: 0,
    y: 0,
    sheenX: 50,
    sheenY: 50,
    isHovered: false,
  });

  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    setCardTilt({
      x: nx * 8,   // rotate around Y axis
      y: -ny * 6,  // rotate around X axis
      sheenX: ((e.clientX - rect.left) / rect.width) * 100,
      sheenY: ((e.clientY - rect.top) / rect.height) * 100,
      isHovered: true,
    });
  };

  const handleCardMouseLeave = () => {
    setCardTilt({
      x: 0,
      y: 0,
      sheenX: 50,
      sheenY: 50,
      isHovered: false,
    });
  };

  const getCategoryName = (c: { id: string; name: string }) => {
    if (c.name && c.name !== 'Unnamed Category' && c.name.trim() !== '') {
      return c.name;
    }
    const fallback = CATEGORIES.find((item) => item.id === c.id);
    return fallback?.name || c.id;
  };

  const getCategoryDescription = (c: { id: string; description: string }) => {
    if (c.description && c.description.trim() !== '') {
      return c.description;
    }
    const fallback = CATEGORIES.find((item) => item.id === c.id);
    return fallback?.description || '';
  };

  const currentCategory = categoriesList[activeCategoryIndex] || categoriesList[0];
  const currentCategoryName = currentCategory ? getCategoryName(currentCategory) : '';
  const currentCategoryDesc = currentCategory ? getCategoryDescription(currentCategory) : '';
  const categoryTools = toolsList.filter((tool) => tool.category === currentCategory?.id);

  const simulatedTax = (calcInput * sliderRate) / 100;
  const simulatedTotal = calcInput + simulatedTax;
  const indexPadded = String(activeCategoryIndex + 1).padStart(2, '0');

  return (
    <section 
      id="categories-showcase" 
      className="pt-10 pb-12 sm:pt-12 sm:pb-14 bg-white border-t border-stone-200 relative overflow-hidden"
    >
      {/* Background Matrix Grid */}
      <div className="absolute inset-0 bg-matrix-grid opacity-35 pointer-events-none" />

      {/* Ambient Orange Glow Orb in Top Right */}
      <div 
        className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-gradient-to-br from-orange-500/10 via-amber-400/5 to-transparent blur-3xl pointer-events-none rounded-full" 
        aria-hidden="true" 
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* ========================================================
            SECTION HEADER (Always Visible & Crisp)
            ======================================================== */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-950 tracking-tight leading-tight">
              Modular Category Deck. <br />
              <span className="text-orange-600 font-extrabold">
                Engineered for Every Workflow.
              </span>
            </h2>

            <p className="mt-2 text-stone-600 text-sm sm:text-base max-w-xl leading-relaxed">
              Calculators, statutory document generators, and privacy engines across ten specialized domains.
            </p>
          </div>

          <div>
            <button
              type="button"
              onClick={onOpenSearch}
              className="px-5 py-2.5 rounded-xl border border-stone-300 bg-stone-50 hover:bg-white hover:border-orange-400 text-stone-800 text-xs sm:text-sm font-semibold flex items-center gap-3 transition shadow-xs cursor-pointer group"
            >
              <Search className="w-4 h-4 text-stone-400 group-hover:text-orange-600 transition" />
              <span>Search across all 130+ tools...</span>
              <kbd 
                suppressHydrationWarning
                className="px-1.5 py-0.5 rounded bg-white border border-stone-200 text-[10px] font-mono text-stone-500"
              >
                {shortcutSymbol}
              </kbd>
            </button>
          </div>
        </div>

        {/* ========================================================
            TWO-COLUMN DECK: LEFT COMPACT TILES + RIGHT ACTIVE CARD
            ======================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          {/* 1. LEFT SIDE: COMPACT CATEGORY LIST (NO HUGE GAPS) */}
          <div className="lg:col-span-4 flex flex-col gap-2">
            {categoriesList.map((category, index) => {
              const isActive = activeCategoryIndex === index;
              const currentPadded = String(index + 1).padStart(2, '0');

              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setActiveCategoryIndex(index)}
                  style={{
                    transform: isActive ? 'perspective(600px) rotateY(-3deg) translate3d(6px, 0, 4px)' : 'none',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                  className={`w-full text-left py-2.5 sm:py-3 px-3.5 rounded-xl flex items-center justify-between cursor-pointer group relative overflow-hidden border transition-all duration-200 ${
                    isActive
                      ? 'bg-stone-950 border-orange-500/80 shadow-lg shadow-stone-950/20 !text-white'
                      : 'bg-white hover:bg-orange-50/40 border-stone-200 hover:border-orange-300/80 hover:translate-x-1 shadow-2xs'
                  }`}
                >
                  {/* Active Neon Edge Indicator */}
                  {isActive && (
                    <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-gradient-to-b from-orange-400 to-amber-500 rounded-r-full shadow-[0_0_8px_rgba(249,115,22,1)]" />
                  )}

                  <div className="flex items-center gap-3 pl-1">
                    {/* Numeric Index */}
                    <span className={`font-mono text-xs font-semibold ${isActive ? 'text-orange-400' : 'text-stone-400 group-hover:text-stone-600'}`}>
                      {currentPadded}
                    </span>

                    {/* Icon */}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 shrink-0 ${
                      isActive 
                        ? 'bg-orange-600 text-white shadow-sm shadow-orange-500/30' 
                        : 'bg-stone-100 text-stone-600 border border-stone-200/60 group-hover:bg-orange-50 group-hover:text-orange-600'
                    }`}>
                      {ICON_MAP[category.id] || <Layers className="w-4 h-4" />}
                    </div>

                    {/* Name */}
                    <div>
                      <span 
                        style={{ color: isActive ? '#ffffff' : '#1c1917' }}
                        className={`text-xs sm:text-sm font-semibold tracking-tight block ${
                          isActive ? '!text-white' : 'text-stone-800 group-hover:text-stone-950'
                        }`}
                      >
                        {getCategoryName(category)}
                      </span>
                    </div>
                  </div>

                  {/* Count badge */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`text-[10px] sm:text-[11px] font-mono px-2 py-0.5 rounded-md ${
                      isActive 
                        ? 'bg-stone-800 text-orange-400 border border-stone-700/80 font-medium' 
                        : 'bg-stone-100 text-stone-500 font-normal group-hover:bg-stone-200/70'
                    }`}>
                      {category.count} tools
                    </span>
                    <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      isActive 
                        ? 'text-orange-400 translate-x-0.5' 
                        : 'text-stone-400 group-hover:text-orange-600 group-hover:translate-x-0.5'
                    }`} />
                  </div>
                </button>
              );
            })}
          </div>

          {/* 2. RIGHT SIDE: 3D INTERACTIVE SHOWCASE PANEL (NO EXCESSIVE GAP AT TOP) */}
          <div 
            onMouseMove={handleCardMouseMove}
            onMouseLeave={handleCardMouseLeave}
            style={{
              transform: `perspective(1000px) rotateX(${cardTilt.y}deg) rotateY(${cardTilt.x}deg)`,
              transformStyle: 'preserve-3d',
              transition: cardTilt.isHovered ? 'transform 0.12s ease-out' : 'transform 0.4s ease-out',
            }}
            className="lg:col-span-8 bg-gradient-to-br from-stone-50/95 via-white to-orange-50/30 rounded-2xl sm:rounded-3xl border border-stone-200/90 shadow-xl p-5 sm:p-8 relative overflow-hidden"
          >
            {/* Dynamic Holographic Cursor Reflection */}
            <div 
              style={{
                background: `radial-gradient(circle 380px at ${cardTilt.sheenX}% ${cardTilt.sheenY}%, rgba(249, 115, 22, 0.12), transparent 70%)`,
              }}
              className="absolute inset-0 pointer-events-none transition-opacity duration-300 z-0"
            />

            {/* Content Container (Starts right at the top) */}
            <div className="relative z-10 space-y-6">
              
              {/* Header Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-stone-200/80">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 text-white flex items-center justify-center shadow-md shadow-orange-500/25 shrink-0">
                    {ICON_MAP[currentCategory.id] || <Layers className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="text-[11px] font-mono text-orange-600 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <Terminal className="w-3 h-3" />
                      <span>DOMAIN [{indexPadded}] // CLIENT RUNTIME</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-extrabold text-stone-900 tracking-tight">
                      {currentCategoryName}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto font-mono text-xs">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300/80 font-medium flex items-center gap-1.5 shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Zero Cloud Transit</span>
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-stone-900 text-white font-medium shadow-2xs">
                    {currentCategory?.count} Verified Tools
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="text-stone-700 text-sm sm:text-base leading-relaxed">
                {currentCategoryDesc}
              </p>

              {/* Available Tools Grid (Clearly visible black text, scoped hover) */}
              <div className="space-y-2">
                <div className="text-xs font-mono text-stone-400 font-semibold uppercase tracking-wider">
                  Available Tools ({categoryTools.length}):
                </div>
                <div className="flex flex-wrap gap-2 pt-0.5">
                  {categoryTools.map((tool) => (
                    <button
                      key={tool.id}
                      type="button"
                      onClick={() => onSelectTool(tool)}
                      className="px-3.5 py-2 rounded-xl bg-white hover:bg-stone-950 border border-stone-200 hover:border-stone-900 text-xs transition-all duration-150 flex items-center gap-2 shadow-2xs hover:shadow-md cursor-pointer group/tool"
                    >
                      <span className="font-semibold text-stone-900 group-hover/tool:text-white transition-colors">
                        {tool.name}
                      </span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-stone-400 group-hover/tool:text-orange-400 group-hover/tool:translate-x-0.5 group-hover/tool:-translate-y-0.5 transition-all" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Interactive Domain Simulator (Compact High-Tech Panel) */}
              <div className="bg-stone-950 text-white rounded-xl p-4 sm:p-5 border border-stone-800 relative overflow-hidden space-y-3.5 shadow-lg">
                {/* Subtle Grid in Simulator */}
                <div className="absolute inset-0 bg-matrix-grid-dark opacity-30 pointer-events-none" />

                {/* Simulator Header with Live Audio Spectrum Equalizer */}
                <div className="flex items-center justify-between text-xs font-mono pb-2.5 border-b border-stone-800 relative z-10">
                  <span className="flex items-center gap-2 text-orange-400 font-semibold">
                    <Sliders className="w-3.5 h-3.5 text-orange-500" />
                    <span>LIVE SIMULATOR · {currentCategory.name.toUpperCase()}</span>
                  </span>

                  {/* Equalizer Spectrum Visual */}
                  <div className="flex items-center gap-2 text-stone-400 text-[11px]">
                    <div className="flex items-end gap-1 h-3.5">
                      <span className="w-1 bg-orange-500 rounded-full animate-eq-bar-1" />
                      <span className="w-1 bg-amber-400 rounded-full animate-eq-bar-2" />
                      <span className="w-1 bg-orange-400 rounded-full animate-eq-bar-3" />
                      <span className="w-1 bg-emerald-400 rounded-full animate-eq-bar-4" />
                      <span className="w-1 bg-orange-500 rounded-full animate-eq-bar-5" />
                    </div>
                    <span className="text-emerald-400 font-mono font-medium">ENGINE: ACTIVE</span>
                  </div>
                </div>

                {currentCategory.id === 'finance-calculators' || currentCategory.id === 'invoicing-billing' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs relative z-10">
                    <div className="space-y-2.5">
                      <div>
                        <div className="flex justify-between text-stone-400 mb-1">
                          <span>Base Value (₹):</span>
                          <span className="text-stone-100 font-bold">₹{calcInput.toLocaleString('en-IN')}</span>
                        </div>
                        <input 
                          type="range"
                          min="5000"
                          max="250000"
                          step="5000"
                          value={calcInput}
                          onChange={(e) => setCalcInput(Number(e.target.value))}
                          className="w-full accent-orange-500 cursor-pointer h-1.5 bg-stone-800 rounded-lg"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-stone-400 mb-1">
                          <span>Tax Slab / Markup:</span>
                          <span className="text-orange-400 font-bold">{sliderRate}%</span>
                        </div>
                        <div className="grid grid-cols-4 gap-1.5">
                          {[5, 12, 18, 28].map((rate) => (
                            <button
                              key={rate}
                              type="button"
                              onClick={() => setSliderRate(rate)}
                              className={`py-1 rounded-md text-center transition cursor-pointer font-bold text-xs ${
                                sliderRate === rate 
                                  ? 'bg-orange-600 text-white shadow-sm border border-orange-400/50' 
                                  : 'bg-stone-900 text-stone-400 hover:bg-stone-800 border border-stone-800'
                              }`}
                            >
                              {rate}%
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="bg-stone-900/95 rounded-xl p-3 border border-stone-800/90 flex flex-col justify-between">
                      <div className="space-y-1 text-[11px]">
                        <div className="flex justify-between text-stone-400">
                          <span>Computed Tax:</span>
                          <span className="text-stone-200 font-semibold font-mono">₹{simulatedTax.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between text-stone-400">
                          <span>CGST / SGST Split:</span>
                          <span className="text-stone-300 font-normal font-mono">₹{(simulatedTax/2).toLocaleString('en-IN', { maximumFractionDigits: 2 })} each</span>
                        </div>
                        <div className="border-t border-stone-800 pt-1.5 flex justify-between items-center text-xs text-stone-300 font-medium">
                          <span>Gross Total:</span>
                          <span className="text-orange-400 text-sm font-bold tracking-tight">₹{simulatedTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const targetTool = categoryTools[0];
                          if (targetTool) onSelectTool(targetTool);
                        }}
                        className="mt-2.5 w-full py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-mono text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <span>Launch Full Calculator</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ) : currentCategory.id === 'brand-studio' || currentCategory.id === 'business-legal' ? (
                  <div className="space-y-2 font-mono text-xs relative z-10">
                    <div className="p-2.5 bg-stone-900 rounded-lg border border-stone-800 flex items-center justify-between">
                      <div>
                        <div className="text-stone-200 font-medium">Corporate Stationery Compliance Validator</div>
                        <div className="text-stone-400 text-[11px]">Official company particulars and identity validator</div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-orange-600/20 text-orange-400 border border-orange-500/40 text-[10px] font-medium">
                        COMPLIANCE READY
                      </span>
                    </div>
                    <div className="text-[11px] text-stone-400">
                      Audit your company CIN, registered office, telephone, and email on letterheads, visiting cards, and invoices in seconds.
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 font-mono text-xs relative z-10">
                    <div className="p-2.5 bg-stone-900 rounded-lg border border-stone-800 flex items-center justify-between">
                      <div>
                        <div className="text-stone-200 font-medium">Client-Side Memory Sandbox</div>
                        <div className="text-stone-400 text-[11px]">No server upload required — processed inside local V8 thread</div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-emerald-600/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-medium">
                        100% PRIVATE
                      </span>
                    </div>
                    <div className="text-[11px] text-stone-400">
                      Select any utility above to open the instant sandbox modal with drag-and-drop file processing and live results.
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Navigation Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveCategoryIndex(activeCategoryIndex > 0 ? activeCategoryIndex - 1 : categoriesList.length - 1)}
                    className="px-3 py-1.5 rounded-lg border border-stone-300 hover:bg-stone-100 text-stone-700 text-xs font-mono font-semibold transition cursor-pointer"
                  >
                    ← Previous Domain
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveCategoryIndex(activeCategoryIndex < categoriesList.length - 1 ? activeCategoryIndex + 1 : 0)}
                    className="px-3 py-1.5 rounded-lg border border-stone-300 hover:bg-stone-100 text-stone-700 text-xs font-mono font-semibold transition cursor-pointer"
                  >
                    Next Domain →
                  </button>
                </div>

                <a
                  href={currentCategory.id === 'brand-studio' ? '/studio' : `/${currentCategory.id}`}
                  className="btn-orange-glow text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <span>Explore All {currentCategory.name}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
