"use client";

import React, { useState } from 'react';
import { 
  CheckCircle2, 
  ArrowRight, 
} from 'lucide-react';
import { useScrollProgress } from '@/hooks/useScrollProgress';

export const BrandStudioSection: React.FC = () => {
  const [activeAsset, setActiveAsset] = useState<'letterhead' | 'card' | 'id'>('letterhead');
  const [cinInput, setCinInput] = useState('U72900DL2024PTC123456');
  const [companyName, setCompanyName] = useState('AVEXORA TECHNOLOGIES PRIVATE LIMITED');
  const [address, setAddress] = useState('Plot 42, Cyber Hub, New Delhi, India 110001');

  // Continuous scroll-linked parallax hook
  const { ref, leftTranslateX, rightTranslateX, opacity, scale } = useScrollProgress<HTMLElement>();

  return (
    <section 
      ref={ref}
      id="brand-studio" 
      className="pt-10 pb-12 sm:pt-12 sm:pb-14 bg-white border-t border-stone-200 relative overflow-hidden"
    >
      {/* Background Matrix Grid */}
      <div className="absolute inset-0 bg-matrix-grid opacity-50 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Banner Card Container */}
        <div className="rounded-3xl border border-orange-200/90 bg-gradient-to-br from-orange-50/70 via-white to-amber-50/40 p-8 sm:p-12 shadow-xl overflow-hidden">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Left Content (7 cols) - Slides in from Left, reaches position at center, slides out as you scroll down */}
            <div 
              style={{
                transform: `translate3d(${leftTranslateX}px, 0, 0)`,
                opacity: opacity,
                transition: 'transform 0.1s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.15s ease-out',
                willChange: 'transform, opacity',
              }}
              className="lg:col-span-7 space-y-6"
            >
              
              <h2 className="text-3xl sm:text-5xl font-extrabold text-stone-900 tracking-tight leading-tight">
                Business stationery that is <br />
                <span className="text-orange-600 underline decoration-orange-300">legally correct</span>, not just pretty.
              </h2>

              <p className="text-stone-600 text-base sm:text-lg leading-relaxed">
                From corporate logo to employee ID cards in minutes. Built around the exact registered office,
                Corporate Identity Number (CIN), phone, and email particulars required under Indian law.
              </p>

              {/* Checklist Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-medium text-stone-700 pt-2">
                {[
                  'Official Letterheads',
                  'Visiting Cards',
                  'Employee ID Badges',
                  'Envelopes & Slips',
                  'Social Creatives',
                  'Email Signatures',
                  'Statutory Audit Report',
                  'High-DPI CMYK Print',
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-orange-600 flex-shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-4 pt-4">
                <a
                  href="https://tools.avexora.in/studio"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-orange-glow text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  <span>Explore Brand Studio</span>
                  <ArrowRight className="w-4 h-4" />
                </a>

                <div className="text-xs font-mono text-stone-500">
                  Free audit report included · Pro exports from ₹499/mo
                </div>
              </div>
            </div>

            {/* Right Live Interactive Visualizer (5 cols) - Slides in from Right, locks at center, slides out on scroll down */}
            <div 
              style={{
                transform: `translate3d(${rightTranslateX}px, 0, 0) scale(${scale})`,
                opacity: opacity,
                transition: 'transform 0.1s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.15s ease-out, scale 0.15s ease-out',
                willChange: 'transform, opacity',
              }}
              className="lg:col-span-5"
            >
              <div className="bg-stone-950 rounded-2xl p-6 text-white border border-stone-800 shadow-2xl relative">
                
                {/* Switcher */}
                <div className="flex items-center justify-between mb-4 border-b border-stone-800 pb-3">
                  <div className="flex gap-1 bg-stone-900 p-1 rounded-lg text-xs font-mono">
                    <button
                      onClick={() => setActiveAsset('letterhead')}
                      className={`px-2.5 py-1 rounded cursor-pointer transition ${
                        activeAsset === 'letterhead' ? 'bg-orange-600 text-white font-bold' : 'text-stone-400'
                      }`}
                    >
                      Letterhead
                    </button>
                    <button
                      onClick={() => setActiveAsset('card')}
                      className={`px-2.5 py-1 rounded cursor-pointer transition ${
                        activeAsset === 'card' ? 'bg-orange-600 text-white font-bold' : 'text-stone-400'
                      }`}
                    >
                      Visiting Card
                    </button>
                    <button
                      onClick={() => setActiveAsset('id')}
                      className={`px-2.5 py-1 rounded cursor-pointer transition ${
                        activeAsset === 'id' ? 'bg-orange-600 text-white font-bold' : 'text-stone-400'
                      }`}
                    >
                      ID Badge
                    </button>
                  </div>

                  <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    VALIDATED
                  </span>
                </div>

                {/* Simulated Visual Preview Canvas */}
                <div className="bg-white text-stone-900 rounded-xl p-5 shadow-inner min-h-[260px] flex flex-col justify-between border border-stone-300">
                  
                  {activeAsset === 'letterhead' && (
                    <div className="space-y-4">
                      {/* Letterhead Top Header */}
                      <div className="border-b-2 border-orange-500 pb-3 flex justify-between items-start">
                        <div>
                          <div className="text-xs font-black text-stone-950 uppercase tracking-tight">
                            {companyName}
                          </div>
                          <div className="text-[9px] text-stone-600 font-mono mt-0.5">
                            CIN: {cinInput}
                          </div>
                          <div className="text-[8px] text-stone-500 max-w-xs mt-0.5">
                            Reg. Off: {address}
                          </div>
                        </div>
                        <div className="w-8 h-8 rounded-lg bg-orange-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                          A
                        </div>
                      </div>

                      {/* Mock body lines */}
                      <div className="space-y-2 py-2">
                        <div className="h-2 bg-stone-200 rounded w-1/3"></div>
                        <div className="h-2 bg-stone-100 rounded w-full"></div>
                        <div className="h-2 bg-stone-100 rounded w-5/6"></div>
                        <div className="h-2 bg-stone-100 rounded w-4/6"></div>
                      </div>

                      {/* Letterhead Footer */}
                      <div className="border-t border-stone-200 pt-2 flex justify-between text-[8px] font-mono text-stone-500">
                        <span>Email: compliance@avexora.in</span>
                        <span>Web: www.avexora.in</span>
                      </div>
                    </div>
                  )}

                  {activeAsset === 'card' && (
                    <div className="bg-stone-950 text-white rounded-lg p-5 flex flex-col justify-between h-48 border border-stone-700 shadow-md">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-xs font-extrabold tracking-wide text-orange-400">
                            {companyName}
                          </div>
                          <div className="text-[9px] font-mono text-stone-400">CIN: {cinInput}</div>
                        </div>
                        <div className="w-6 h-6 rounded bg-orange-600 text-white flex items-center justify-center font-bold text-[10px]">
                          A
                        </div>
                      </div>

                      <div className="space-y-0.5">
                        <div className="text-sm font-bold text-white">Abhimanyu Sharma</div>
                        <div className="text-[10px] text-stone-400 font-mono">Managing Director & CEO</div>
                      </div>

                      <div className="pt-2 border-t border-stone-800 flex justify-between items-center text-[9px] font-mono text-stone-400">
                        <span>+91 98765 43210</span>
                        <span>contact@avexora.in</span>
                      </div>
                    </div>
                  )}

                  {activeAsset === 'id' && (
                    <div className="bg-stone-900 text-white rounded-lg p-4 flex items-center gap-4 border border-stone-700 h-48 shadow-md">
                      <div className="w-16 h-20 rounded-md bg-stone-800 border border-stone-700 flex flex-col items-center justify-center text-[10px] text-stone-400">
                        <div className="w-8 h-8 rounded-full bg-stone-700 mb-1"></div>
                        <span>PHOTO</span>
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="text-xs font-bold text-orange-400">{companyName}</div>
                        <div className="text-sm font-extrabold text-white">Rohit Verma</div>
                        <div className="text-[10px] text-stone-400 font-mono">VP of Engineering</div>
                        <div className="text-[9px] font-mono text-stone-500">EMP ID: AVX-2026-088</div>
                        <div className="h-5 bg-white text-black font-mono text-[8px] flex items-center justify-center tracking-widest mt-2 rounded">
                          |||| ||| ||||| ||||
                        </div>
                      </div>
                    </div>
                  )}

                </div>

                {/* Edit Controls */}
                <div className="mt-4 space-y-2">
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Company Legal Name"
                      className="flex-1 bg-stone-900 border border-stone-800 rounded px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={cinInput}
                      onChange={(e) => setCinInput(e.target.value)}
                      placeholder="CIN (21 characters)"
                      className="w-1/2 bg-stone-900 border border-stone-800 rounded px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-orange-500"
                    />
                    <input 
                      type="text" 
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Registered Office Address"
                      className="w-1/2 bg-stone-900 border border-stone-800 rounded px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
