"use client";

import React, { useState } from 'react';
import dynamic from 'next/dynamic';

const Hero3DCanvas = dynamic(() => import('./Hero3DCanvas').then((mod) => mod.Hero3DCanvas), {
  ssr: false,
});
import { 
  ArrowRight, 
  Building2, 
  Terminal, 
  Calculator, 
  Code2, 
  QrCode, 
  ShieldCheck, 
  Zap, 
  Copy, 
  Check, 
  ExternalLink,
  Search
} from 'lucide-react';

interface HeroSectionProps {
  onExploreClick: () => void;
  onOpenTool: (toolId: string) => void;
  onSearchClick?: () => void;
  heroConfig?: {
    heading?: string;
    description?: string;
    ctaText?: string;
    ctaUrl?: string;
  };
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onExploreClick, onOpenTool, onSearchClick, heroConfig }) => {
  // Interactive Hero Screen state
  const [activeTab, setActiveTab] = useState<'gst' | 'json' | 'qr'>('gst');
  
  // 3D Hero Screen Interactive Cursor Tracking Tilt
  const [heroTilt, setHeroTilt] = useState<{ x: number; y: number; isHovered: boolean }>({
    x: 0,
    y: 0,
    isHovered: false,
  });

  const handleHeroMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
    const ny = (e.clientY - rect.top) / rect.height - 0.5; // -0.5 to 0.5
    setHeroTilt({
      x: nx * 12,   // tilt around Y axis
      y: -ny * 10,  // tilt around X axis
      isHovered: true,
    });
  };

  const handleHeroMouseLeave = () => {
    setHeroTilt({
      x: 0,
      y: 0,
      isHovered: false,
    });
  };

  // GST State
  const [amount, setAmount] = useState<number>(50000);
  const [gstRate, setGstRate] = useState<number>(18);
  const [gstType, setGstType] = useState<'exclusive' | 'inclusive'>('exclusive');

  // JSON State
  const [jsonInput, setJsonInput] = useState<string>('{"service":"Avexora Tools","version":2.5,"status":"verified","encryption":"AES-256","clientSideOnly":true}');
  const [copied, setCopied] = useState<boolean>(false);

  // QR State
  const [qrText, setQrText] = useState<string>('https://tools.avexora.in');

  // GST calculations
  const calculatedGst = gstType === 'exclusive' 
    ? (amount * gstRate) / 100 
    : amount - (amount / (1 + gstRate / 100));
  const finalTotal = gstType === 'exclusive' ? amount + calculatedGst : amount;
  const cgst = calculatedGst / 2;
  const sgst = calculatedGst / 2;

  const handleCopyJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      const formatted = JSON.stringify(parsed, null, 2);
      navigator.clipboard.writeText(formatted);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      navigator.clipboard.writeText(jsonInput);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <section id="hero" className="relative min-h-[92vh] flex flex-col justify-between overflow-hidden bg-white pt-24 pb-12 sm:pt-28">
      {/* Matrix Grid Lines Background */}
      <div className="absolute inset-0 bg-matrix-grid pointer-events-none opacity-60" />
      
      {/* Radial Gradient Glow in Center */}
      <div 
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[550px] bg-gradient-to-tr from-orange-500/10 via-amber-400/5 to-transparent blur-3xl pointer-events-none rounded-full"
        aria-hidden="true" 
      />

      {/* 3D WebGL Canvas Layer */}
      <Hero3DCanvas />

      {/* Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex-1 flex flex-col items-center">
        
        {/* Hero Main Headline */}
        <h1 className="max-w-4xl text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-stone-900 leading-[1.08]">
          {heroConfig?.heading || (
            <>
              High-performance tools for <br className="hidden sm:inline" />
              <span className="relative inline-block text-transparent bg-clip-text bg-gradient-to-r from-stone-900 via-orange-600 to-amber-600">
                modern business & builders
              </span>
            </>
          )}
        </h1>

        {/* Hero Subtitle */}
        <p className="mt-5 max-w-2xl text-base sm:text-lg text-stone-600 leading-relaxed font-normal">
          {heroConfig?.description || (
            <>
              Free online calculators, GST billing, PDF manipulation, and corporate brand 
              stationery. <strong className="text-stone-900 font-semibold">100% private, browser-sandboxed</strong>, with zero cloud delays.
            </>
          )}
        </p>

        {/* Action Button Row */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <button 
            onClick={onExploreClick}
            style={{ color: '#ffffff' }}
            className="btn-orange-glow !text-white px-8 py-3.5 rounded-xl font-semibold text-sm sm:text-base flex items-center justify-center gap-2.5 transition cursor-pointer group shadow-lg shadow-orange-500/25"
          >
            <span className="!text-white text-white">{heroConfig?.ctaText || "Explore 130+ Tools"}</span>
            <ArrowRight className="w-4 h-4 text-white transition-transform group-hover:translate-x-1" />
          </button>

          <a 
            href="https://ebos.avexora.in"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3.5 rounded-xl text-stone-800 bg-white/90 hover:bg-stone-50 border border-stone-200/90 font-semibold text-sm sm:text-base flex items-center gap-2 shadow-xs transition backdrop-blur-sm hover:border-orange-300"
          >
            <Building2 className="w-4 h-4 text-orange-600" />
            <span>Enterprise Business OS (EBOS)</span>
            <ExternalLink className="w-3.5 h-3.5 text-stone-400 ml-0.5" />
          </a>
        </div>

        {/* Hero Quick Search Bar & Popular Shortcuts */}
        <div className="mt-7 w-full max-w-xl mx-auto">
          <div 
            onClick={onSearchClick}
            className="group flex items-center gap-3 px-4 sm:px-5 py-3 sm:py-3.5 rounded-2xl bg-white/95 border border-stone-200/90 shadow-md shadow-stone-200/40 hover:border-orange-400 hover:shadow-orange-500/10 cursor-pointer transition-all backdrop-blur-md"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSearchClick?.();
              }
            }}
            aria-label="Search all 130+ tools"
          >
            <Search className="w-4 sm:w-5 h-4 sm:h-5 text-stone-400 group-hover:text-orange-500 transition-colors shrink-0" />
            <span className="flex-1 text-left text-xs sm:text-sm text-stone-400 font-sans truncate">
              Search all 130+ tools (e.g. GST, Salary, PDF, QR, Invoice)...
            </span>
            <kbd className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono font-semibold text-stone-500 bg-stone-100 rounded-lg border border-stone-200">
              Ctrl K
            </kbd>
          </div>

          {/* Quick Filter Tag Pills */}
          <div className="mt-3 flex items-center justify-center flex-wrap gap-1.5 text-xs">
            <span className="text-[11px] font-mono text-stone-400 mr-1 hidden sm:inline">Popular:</span>
            {[
              { label: "GST Calculator", id: "gst-calculator" },
              { label: "Salary & CTC", id: "salary-calculator" },
              { label: "PDF Merge", id: "pdf-merger" },
              { label: "QR Code", id: "qr-code-generator" },
              { label: "Invoice Generator", id: "invoice-generator" },
            ].map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => onOpenTool(tag.id)}
                className="px-2.5 py-1 rounded-lg bg-stone-100/90 hover:bg-orange-50 hover:text-orange-700 text-stone-600 transition-colors cursor-pointer text-[11px] font-medium"
              >
                {tag.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3D HERO PERSPECTIVE SCREEN (Lunora AI signature presentation) */}
        <div className="mt-10 w-full max-w-4xl perspective-1200 relative">
          
          {/* Floating Diagnostic Badges */}
          <div className="hidden lg:flex absolute -left-12 top-14 z-30 flex-col gap-3 pointer-events-none">
            <div className="bg-stone-900/95 backdrop-blur-md text-white p-3.5 rounded-xl border border-stone-800 shadow-xl flex items-center gap-3 animate-float-slow">
              <div className="w-8 h-8 rounded-lg bg-orange-600/20 text-orange-400 flex items-center justify-center">
                <Calculator className="w-4 h-4" />
              </div>
              <div className="text-left font-mono">
                <div className="text-[10px] text-stone-400 uppercase tracking-wider">Engine</div>
                <div className="text-xs font-bold text-white">High-Speed Precision Calc</div>
              </div>
            </div>
            
            <div className="bg-white/95 backdrop-blur-md text-stone-900 p-3.5 rounded-xl border border-orange-200 shadow-xl flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-[10px] text-stone-500 uppercase font-mono font-medium">Privacy</div>
                <div className="text-xs font-bold text-stone-800">Files Never Leave Device</div>
              </div>
            </div>
          </div>

          <div className="hidden lg:flex absolute -right-12 top-28 z-30 flex-col gap-3 pointer-events-none">
            <div className="bg-stone-900/95 backdrop-blur-md text-white p-3.5 rounded-xl border border-stone-800 shadow-xl flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-orange-600 text-white flex items-center justify-center font-bold font-mono text-xs">
                GST
              </div>
              <div className="text-left font-mono">
                <div className="text-[10px] text-stone-400">CGST + SGST Split</div>
                <div className="text-xs font-bold text-orange-400">100% Tax Compliant</div>
              </div>
            </div>
          </div>

          {/* 3D Browser Window Frame */}
          <div 
            onMouseMove={handleHeroMouseMove}
            onMouseLeave={handleHeroMouseLeave}
            style={{
              transform: heroTilt.isHovered
                ? `perspective(1200px) rotateX(${4 + heroTilt.y}deg) rotateY(${-1 + heroTilt.x}deg) rotateZ(0deg) scale(0.99)`
                : `perspective(1200px) rotateX(12deg) rotateY(-4deg) rotateZ(1deg) scale(0.96)`,
              boxShadow: heroTilt.isHovered
                ? '0 35px 80px -15px rgba(0, 0, 0, 0.45), 0 0 60px -10px rgba(255, 106, 0, 0.45)'
                : '0 25px 60px -15px rgba(0, 0, 0, 0.25), 0 0 40px -10px rgba(255, 106, 0, 0.25)',
              transition: heroTilt.isHovered
                ? 'transform 0.12s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.25s ease'
                : 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.6s ease',
              transformStyle: 'preserve-3d',
              willChange: 'transform, box-shadow',
            }}
            className="hero-screen-3d rounded-2xl border border-stone-800/30 bg-stone-950 text-white overflow-hidden shadow-2xl text-left"
          >
            
            {/* Top Window Bar */}
            <div className="bg-stone-900/90 px-4 py-3 border-b border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block"></span>
                <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
                <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
                <span className="ml-3 font-mono text-xs text-stone-400 hidden sm:inline-flex items-center gap-2 bg-stone-950/70 px-3 py-1 rounded-md border border-stone-800">
                  <span className="text-orange-500">https://</span>tools.avexora.in/live-workspace
                </span>
              </div>

              {/* Tool Switcher Tabs inside Hero Screen */}
              <div className="flex items-center gap-1.5 bg-stone-950/80 p-1 rounded-lg border border-stone-800/80 text-xs font-medium">
                <button 
                  onClick={() => setActiveTab('gst')}
                  className={`px-3 py-1 rounded-md transition flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'gst' ? 'bg-orange-600 text-white font-semibold' : 'text-stone-400 hover:text-white'
                  }`}
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>GST Calc</span>
                </button>
                <button 
                  onClick={() => setActiveTab('json')}
                  className={`px-3 py-1 rounded-md transition flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'json' ? 'bg-orange-600 text-white font-semibold' : 'text-stone-400 hover:text-white'
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>JSON Formatter</span>
                </button>
                <button 
                  onClick={() => setActiveTab('qr')}
                  className={`px-3 py-1 rounded-md transition flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'qr' ? 'bg-orange-600 text-white font-semibold' : 'text-stone-400 hover:text-white'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>QR Maker</span>
                </button>
              </div>
            </div>

            {/* Live Interactive Canvas Workspace inside Hero Screen */}
            <div className="p-5 sm:p-7 bg-gradient-to-b from-stone-950 to-stone-900 min-h-[290px] flex flex-col justify-between">
              
              {/* TAB 1: GST CALCULATOR */}
              {activeTab === 'gst' && (
                <div className="space-y-5 animate-in fade-in duration-300">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="text-xs font-mono uppercase tracking-wider text-orange-400">Live Simulator</div>
                      <h3 className="text-lg font-bold text-white">GST Calculation Engine (India)</h3>
                    </div>
                    
                    <div className="flex rounded-lg bg-stone-900 border border-stone-800 p-0.5 text-xs">
                      <button 
                        onClick={() => setGstType('exclusive')}
                        className={`px-3 py-1 rounded cursor-pointer ${gstType === 'exclusive' ? 'bg-orange-600 text-white font-bold' : 'text-stone-400'}`}
                      >
                        GST Exclusive (+)
                      </button>
                      <button 
                        onClick={() => setGstType('inclusive')}
                        className={`px-3 py-1 rounded cursor-pointer ${gstType === 'inclusive' ? 'bg-orange-600 text-white font-bold' : 'text-stone-400'}`}
                      >
                        GST Inclusive (-)
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-mono text-stone-400 mb-1">
                          Base Amount (₹ INR)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-stone-400 font-mono">₹</span>
                          <input 
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(Number(e.target.value) || 0)}
                            className="w-full bg-stone-900/90 border border-stone-700/80 rounded-lg pl-8 pr-3 py-2 text-sm text-white font-mono focus:border-orange-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-mono text-stone-400 mb-1">
                          Applicable GST Slab
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                          {[5, 12, 18, 28].map((rate) => (
                            <button
                              key={rate}
                              onClick={() => setGstRate(rate)}
                              className={`py-1.5 rounded text-xs font-mono font-bold cursor-pointer transition ${
                                gstRate === rate 
                                  ? 'bg-orange-600 text-white shadow-sm' 
                                  : 'bg-stone-900 border border-stone-800 text-stone-300 hover:bg-stone-800'
                              }`}
                            >
                              {rate}%
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Calculation Output Card */}
                    <div className="bg-stone-900/80 border border-orange-500/30 rounded-xl p-4 flex flex-col justify-between">
                      <div className="space-y-2 text-xs font-mono">
                        <div className="flex justify-between text-stone-400">
                          <span>Net Amount:</span>
                          <span className="text-white">₹{amount.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between text-stone-400">
                          <span>CGST ({gstRate/2}%):</span>
                          <span className="text-orange-400">₹{cgst.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between text-stone-400">
                          <span>SGST ({gstRate/2}%):</span>
                          <span className="text-orange-400">₹{sgst.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="border-t border-stone-800 pt-2 flex justify-between font-bold text-sm">
                          <span className="text-stone-300">Total Invoice:</span>
                          <span className="text-white text-base text-orange-400 font-extrabold">₹{finalTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                        </div>
                      </div>

                      <button 
                        onClick={() => onOpenTool('gst-calculator')}
                        className="mt-3 w-full bg-stone-800 hover:bg-stone-700 text-white text-xs font-mono py-2 rounded-lg transition flex items-center justify-center gap-1.5 border border-stone-700 cursor-pointer"
                      >
                        <span>Open Full Tax Calculator</span>
                        <ArrowRight className="w-3 h-3 text-orange-400" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: JSON FORMATTER */}
              {activeTab === 'json' && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-mono uppercase tracking-wider text-orange-400">Developer Suite</div>
                      <h3 className="text-lg font-bold text-white">JSON Prettifier & Tree Parser</h3>
                    </div>
                    <button 
                      onClick={handleCopyJson}
                      className="text-xs font-mono flex items-center gap-1.5 px-3 py-1.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 cursor-pointer transition"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-stone-400" />}
                      <span>{copied ? 'Copied!' : 'Copy Formatted'}</span>
                    </button>
                  </div>

                  <div className="relative font-mono text-xs">
                    <textarea 
                      value={jsonInput}
                      onChange={(e) => setJsonInput(e.target.value)}
                      rows={5}
                      className="w-full bg-stone-900 border border-stone-700 rounded-lg p-3 text-stone-300 font-mono text-xs focus:outline-none focus:border-orange-500 leading-relaxed resize-none"
                    />
                    <div className="absolute right-3 bottom-3 flex items-center gap-2 text-[10px] text-stone-500 bg-stone-950/80 px-2 py-0.5 rounded">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      Valid RFC-8259 JSON
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: QR MAKER */}
              {activeTab === 'qr' && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-mono uppercase tracking-wider text-orange-400">Instant Generator</div>
                      <h3 className="text-lg font-bold text-white">Dynamic SVG QR Code Creator</h3>
                    </div>
                    <span className="text-xs font-mono text-stone-400">Vector · High DPI</span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-6 bg-stone-900/60 p-4 rounded-xl border border-stone-800">
                    <div className="bg-white p-2.5 rounded-lg border border-stone-300 shadow-md flex-shrink-0">
                      {/* Stylized QR Preview Vector */}
                      <svg width="100" height="100" viewBox="0 0 100 100" className="text-black">
                        <rect x="0" y="0" width="30" height="30" fill="currentColor" rx="4" />
                        <rect x="5" y="5" width="20" height="20" fill="white" rx="2" />
                        <rect x="10" y="10" width="10" height="10" fill="currentColor" />
                        
                        <rect x="70" y="0" width="30" height="30" fill="currentColor" rx="4" />
                        <rect x="75" y="5" width="20" height="20" fill="white" rx="2" />
                        <rect x="80" y="10" width="10" height="10" fill="currentColor" />
                        
                        <rect x="0" y="70" width="30" height="30" fill="currentColor" rx="4" />
                        <rect x="5" y="75" width="20" height="20" fill="white" rx="2" />
                        <rect x="10" y="80" width="10" height="10" fill="currentColor" />
                        
                        <rect x="40" y="10" width="15" height="15" fill="#ea580c" />
                        <rect x="40" y="40" width="20" height="20" fill="currentColor" />
                        <rect x="70" y="45" width="12" height="12" fill="currentColor" />
                        <rect x="40" y="75" width="15" height="15" fill="#ea580c" />
                        <rect x="65" y="70" width="25" height="20" fill="currentColor" />
                      </svg>
                    </div>

                    <div className="flex-1 w-full space-y-3">
                      <div>
                        <label className="block text-xs font-mono text-stone-400 mb-1">
                          Payload URL or Text
                        </label>
                        <input 
                          type="text"
                          value={qrText}
                          onChange={(e) => setQrText(e.target.value)}
                          className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-orange-500"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => onOpenTool('qr-code-generator')}
                          className="px-3 py-1.5 rounded bg-orange-600 hover:bg-orange-500 text-white font-mono text-xs font-semibold cursor-pointer"
                        >
                          Download SVG / PNG
                        </button>
                        <button 
                          onClick={() => setQrText('upi://pay?pa=avexora@upi&pn=Avexora')}
                          className="px-3 py-1.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 font-mono text-xs cursor-pointer"
                        >
                          Make UPI Pay QR
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Bottom Screen Status Bar */}
              <div className="pt-4 border-t border-stone-800/80 flex items-center justify-between text-[11px] font-mono text-stone-500">
                <span className="flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-orange-500" />
                  <span>THREAD: BROWSER_MAIN_V8</span>
                </span>
                <span className="text-orange-400 font-medium">
                  {activeTab.toUpperCase()}_ENGINE_READY
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lunora AI Scroll Ticker Bar with live metrics */}
      <div className="relative z-10 w-full mt-14 border-y border-stone-200 bg-stone-50/80 py-3.5 overflow-hidden backdrop-blur-sm">
        <div className="flex items-center justify-around max-w-7xl mx-auto px-4 text-xs font-mono text-stone-600 overflow-x-auto gap-8 whitespace-nowrap">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-500"></span>
            <span className="font-bold text-stone-900">130+ Live Tools</span>
          </div>
          <div className="text-stone-300">/</div>
          <div className="flex items-center gap-2">
            <span className="text-stone-400">CATEGORY COUNT:</span>
            <span className="font-bold text-stone-900">10 Functional Domains</span>
          </div>
          <div className="text-stone-300">/</div>
          <div className="flex items-center gap-2">
            <span className="text-stone-400">DATA PRIVACY:</span>
            <span className="font-bold text-emerald-600">Zero Cloud Upload</span>
          </div>
          <div className="text-stone-300">/</div>
          <div className="flex items-center gap-2">
            <span className="text-stone-400">ACCESS:</span>
            <span className="font-bold text-stone-900">100% Free Forever</span>
          </div>
        </div>
      </div>
    </section>
  );
};
