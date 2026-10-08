"use client";

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  FileCheck2, 
  Cpu, 
  Building2, 
  CheckCircle2, 
  ArrowUpRight 
} from 'lucide-react';
import { useScrollReveal } from '@/hooks/useScrollReveal';

export const FeatureMatrix: React.FC = () => {
  const headerReveal = useScrollReveal();
  const cardsReveal = useScrollReveal();

  // 3D card tilt state for cards
  const [tiltCard1, setTiltCard1] = useState({ x: 0, y: 0 });
  const [tiltCard2, setTiltCard2] = useState({ x: 0, y: 0 });

  const handleMouseMove = (
    e: React.MouseEvent<HTMLDivElement>, 
    setTilt: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>
  ) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 16;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -16;
    setTilt({ x, y });
  };

  const handleMouseLeave = (
    setTilt: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>
  ) => {
    setTilt({ x: 0, y: 0 });
  };

  return (
    <section id="feature-matrix" className="pt-12 pb-10 sm:pt-16 sm:pb-12 bg-stone-50 border-t border-stone-200 relative overflow-hidden">
      {/* Background Matrix Dot Pattern */}
      <div className="absolute inset-0 bg-dots-pattern opacity-40 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Heading with Scroll Entrance */}
        <div 
          ref={headerReveal.ref}
          className="text-center max-w-3xl mx-auto mb-10 sm:mb-12 overflow-hidden"
        >
          <h2 className={`text-3xl sm:text-5xl font-extrabold text-stone-900 tracking-tight reveal-left ${headerReveal.isVisible ? 'revealed' : ''}`}>
            Engineered for pure speed. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-600">
              Zero compromises on privacy.
            </span>
          </h2>

          <p className={`mt-4 text-base sm:text-lg text-stone-600 reveal-right delay-200 ${headerReveal.isVisible ? 'revealed' : ''}`}>
            Unlike traditional web utilities that upload your sensitive documents to remote servers,
            Avexora runs entire computation engines right inside your browser.
          </p>
        </div>

        {/* Bento Grid with Scroll Reveal Entrance */}
        <div 
          ref={cardsReveal.ref}
          className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6"
        >
          
          {/* Bento Card 1: Black Matrix Master Card (Spans 2 cols) */}
          <div 
            onMouseMove={(e) => handleMouseMove(e, setTiltCard1)}
            onMouseLeave={() => handleMouseLeave(setTiltCard1)}
            style={{
              transform: `perspective(1000px) rotateX(${tiltCard1.y}deg) rotateY(${tiltCard1.x}deg)`,
              transition: 'transform 0.15s ease-out',
            }}
            className={`md:col-span-2 lg:col-span-2 rounded-2xl bg-stone-950 text-white p-7 sm:p-9 border border-stone-800 shadow-2xl relative overflow-hidden group reveal-left ${
              cardsReveal.isVisible ? 'revealed' : ''
            }`}
          >
            {/* Cyber Grid Lines */}
            <div className="absolute inset-0 bg-matrix-grid-dark opacity-35 pointer-events-none" />
            
            {/* Orange Glow Radial in Corner */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-orange-600/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col justify-between h-full space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-white tracking-tight">
                  High-Performance Computation Engine
                </h3>
                <p className="mt-2 text-stone-400 text-sm leading-relaxed">
                  Every calculation—from multi-tier income tax breakdowns to image compression—executes 
                  instantly on your device with maximum privacy and zero latency delays.
                </p>
              </div>

              {/* Matrix Console Visual Simulation */}
              <div className="bg-stone-900/90 rounded-xl p-4 border border-stone-800 font-mono text-xs text-stone-300 space-y-1.5 shadow-inner">
                <div className="flex items-center justify-between text-stone-500 text-[10px] pb-1 border-b border-stone-800">
                  <span>EXECUTION LOG</span>
                  <span className="text-emerald-400">STATUS: ACTIVE</span>
                </div>
                <div className="text-stone-400">$ avexora-engine --mount local-memory</div>
                <div className="text-orange-400">&gt; Allocating 64MB isolated WebWorker sandbox...</div>
                <div className="text-stone-300">&gt; File: balance_sheet_2026.pdf [14.2 MB]</div>
                <div className="text-emerald-400">&gt; Compressed to 2.1 MB in 84ms without cloud transit.</div>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono text-stone-400 pt-2">
                <CheckCircle2 className="w-4 h-4 text-orange-500" />
                <span>100% Offline Capability Supported</span>
              </div>
            </div>
          </div>

          {/* Bento Card 2: White Background - 100% Private */}
          <div 
            onMouseMove={(e) => handleMouseMove(e, setTiltCard2)}
            onMouseLeave={() => handleMouseLeave(setTiltCard2)}
            style={{
              transform: `perspective(1000px) rotateX(${tiltCard2.y}deg) rotateY(${tiltCard2.x}deg)`,
              transition: 'transform 0.15s ease-out',
            }}
            className={`rounded-2xl bg-white p-7 sm:p-8 border border-stone-200/90 shadow-md hover:shadow-xl transition-shadow relative overflow-hidden flex flex-col justify-between reveal-up delay-100 ${
              cardsReveal.isVisible ? 'revealed' : ''
            }`}
          >
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-9 h-9 rounded-lg bg-orange-100/90 text-orange-600 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <span className="text-xs font-mono uppercase text-orange-600 font-bold tracking-wider">
                  Privacy Guaranteed
                </span>
              </div>
              <h3 className="text-xl font-bold text-stone-900">
                Zero Cloud Uploads
              </h3>
              <p className="mt-2 text-stone-600 text-sm leading-relaxed">
                Your bank statements, payroll numbers, and confidential contracts never touch our 
                or anyone else’s servers. What happens on your machine stays on your machine.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between text-xs font-mono text-stone-500">
              <span>ZERO LOG RETENTION</span>
              <span className="font-bold text-stone-800">100% PRIVATE</span>
            </div>
          </div>

          {/* Bento Card 3: Statutory Corporate Compliance */}
          <div className={`rounded-2xl bg-white p-7 sm:p-8 border border-stone-200/90 shadow-md hover:shadow-xl transition-shadow flex flex-col justify-between reveal-right delay-200 ${
            cardsReveal.isVisible ? 'revealed' : ''
          }`}>
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-9 h-9 rounded-lg bg-stone-900 text-orange-500 flex items-center justify-center shrink-0">
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <span className="text-xs font-mono uppercase text-stone-600 font-bold tracking-wider">
                  Corporate Identity System
                </span>
              </div>
              <h3 className="text-xl font-bold text-stone-900">
                Business Stationery Formats
              </h3>
              <p className="mt-2 text-stone-600 text-sm leading-relaxed">
                Official stationery templates designed for corporate letterheads, visiting cards, employee ID 
                badges, and invoices with pixel-perfect CMYK print output.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between text-xs font-mono text-orange-600 font-semibold">
              <span>BRAND SYSTEM</span>
              <span>PRINT READY</span>
            </div>
          </div>

          {/* Bento Card 4: Enterprise Business OS Bridge */}
          <div className={`md:col-span-3 lg:col-span-4 rounded-2xl bg-gradient-to-r from-stone-900 via-stone-950 to-stone-900 text-white p-7 sm:p-8 border border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl reveal-up delay-300 ${
            cardsReveal.isVisible ? 'revealed' : ''
          }`}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-orange-600/20 border border-orange-500/40 text-orange-400 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>Power your enterprise with Avexora EBOS</span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-orange-600 text-white font-semibold">
                    ENTERPRISE
                  </span>
                </h4>
                <p className="text-sm text-stone-400 mt-0.5">
                  Seamlessly bridge standalone free calculators with comprehensive CRM, WhatsApp Marketing, and Automated Invoicing.
                </p>
              </div>
            </div>

            <a
              href="https://ebos.avexora.in"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-orange-glow text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 flex-shrink-0"
            >
              <span>Explore EBOS Platform</span>
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>

        </div>
      </div>
    </section>
  );
};
