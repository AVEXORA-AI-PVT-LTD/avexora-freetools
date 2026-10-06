"use client";

import React from 'react';
import { CATEGORIES } from '@/data/toolsData';
import { ExternalLink, ShieldCheck } from 'lucide-react';

interface FooterProps {
  onCategoryClick: (categoryId: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onCategoryClick }) => {
  return (
    <footer className="bg-stone-950 text-stone-300 border-t border-stone-800 pt-12 sm:pt-14 pb-4 sm:pb-5 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Brand Banner */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-12 border-b border-stone-800">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-orange-600 text-white font-mono font-bold flex items-center justify-center text-sm">
                A
              </div>
              <span className="text-xl font-black text-white tracking-tight">
                AVEXORA <span className="text-orange-500 font-mono text-xs uppercase px-1.5 py-0.5 rounded bg-orange-950 border border-orange-500/30">Tools</span>
              </span>
            </div>
            <p className="mt-2 text-stone-400 text-xs sm:text-sm max-w-md">
              130+ free developer, business, tax and productivity utilities. 
              Zero sign-up, zero cloud data transfer.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://ebos.avexora.in"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-orange-glow text-white px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer"
            >
              <span>Enterprise Business OS</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Directory Categories Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 py-12 text-xs">
          {CATEGORIES.map((cat) => (
            <div key={cat.id} className="space-y-3">
              <h4 
                onClick={() => onCategoryClick(cat.id)}
                className="font-bold text-white hover:text-orange-400 cursor-pointer uppercase font-mono tracking-wider transition"
              >
                {cat.name}
              </h4>
              <p className="text-stone-400 text-[11px] leading-relaxed">
                {cat.description}
              </p>
              <div className="text-orange-400 font-mono text-[10px] font-semibold">
                {cat.count} tools live
              </div>
            </div>
          ))}

          {/* Additional Links */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase font-mono tracking-wider">
              Avexora Ecosystem
            </h4>
            <ul className="space-y-2 text-stone-400">
              <li>
                <a href="https://ebos.avexora.in" target="_blank" rel="noopener noreferrer" className="hover:text-orange-400 transition">
                  Enterprise Business OS (EBOS)
                </a>
              </li>
              <li>
                <a href="/studio" className="hover:text-orange-400 transition">
                  Statutory Brand Studio
                </a>
              </li>
              <li>
                <a href="/studio/pricing" className="hover:text-orange-400 transition">
                  Studio Pricing & Compliance
                </a>
              </li>
              <li>
                <a href="https://avexora.in" target="_blank" rel="noopener noreferrer" className="hover:text-orange-400 transition">
                  Avexora Core
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-6 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-stone-400">
          <div>
            © 2026 Avexora · <a href="https://tools.avexora.in" className="text-stone-400 hover:text-white underline">tools.avexora.in</a>. By the makers of <a href="https://ebos.avexora.in" className="text-orange-400 hover:underline">Enterprise Business OS</a>.
          </div>
          <div className="flex items-center gap-2 text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <span>100% Client-Side Sandbox · Zero Logs</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
