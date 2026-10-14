"use client";

import React, { useState } from 'react';
import { ToolItem } from '@/data/toolsData';
import { 
  X, 
  ExternalLink, 
  Copy, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight,
  Zap
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ToolModalProps {
  tool: ToolItem | null;
  onClose: () => void;
}

export const ToolModal: React.FC<ToolModalProps> = ({ tool, onClose }) => {
  const [copied, setCopied] = useState(false);
  
  // Interactive test states inside modal
  const [testInput, setTestInput] = useState('100000');
  const [testRate, setTestRate] = useState('18');
  const [textVal, setTextVal] = useState('Welcome to Avexora Tools — 100% Client-Side Engine.');

  if (!tool) return null;

  const handleCopyLink = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://tools.avexora.in';
    navigator.clipboard.writeText(`${origin}/${tool.category}/${tool.id}`);
    setCopied(true);
    confetti({ particleCount: 30, spread: 60, origin: { y: 0.7 } });
    setTimeout(() => setCopied(false), 2000);
  };

  // Simple dynamic calculation test
  const numInput = parseFloat(testInput) || 0;
  const rateVal = parseFloat(testRate) || 0;
  const calculatedTax = (numInput * rateVal) / 100;
  const totalWithTax = numInput + calculatedTax;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      
      {/* Modal Card */}
      <div 
        className="w-full max-w-2xl bg-white rounded-3xl border border-stone-200 shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="bg-stone-950 text-white p-6 border-b border-stone-800 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-orange-400 bg-orange-950/80 px-2.5 py-0.5 rounded border border-orange-500/30 font-bold">
                {tool.categoryName}
              </span>
              <span className="text-[11px] font-mono text-stone-400">
                TOOL_ID: {tool.id}
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {tool.name}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[75vh] overflow-y-auto">
          
          <p className="text-stone-700 text-sm sm:text-base leading-relaxed">
            {tool.description}
          </p>

          {/* Interactive Live Testing Sandbox */}
          <div className="bg-stone-50 rounded-2xl border border-stone-200 p-5 space-y-4">
            <div className="flex items-center justify-between text-xs font-mono text-stone-500 pb-2 border-b border-stone-200">
              <span className="flex items-center gap-1.5 text-orange-600 font-bold">
                <Zap className="w-3.5 h-3.5" />
                <span>IN-MODAL TESTING ENGINE</span>
              </span>
              <span className="text-emerald-600 font-semibold">100% CLIENT SANDBOX</span>
            </div>

            {/* If tool is calculator / finance / invoicing related */}
            {tool.category.includes('calc') || tool.category.includes('finance') || tool.category.includes('invoicing') || tool.category.includes('payroll') ? (
              <div className="space-y-3 font-mono text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-stone-500 mb-1">Input Value (₹)</label>
                    <input 
                      type="number"
                      value={testInput}
                      onChange={(e) => setTestInput(e.target.value)}
                      className="w-full bg-white border border-stone-300 rounded-lg p-2 text-stone-900 font-mono text-xs focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-500 mb-1">Percentage / Rate (%)</label>
                    <input 
                      type="number"
                      value={testRate}
                      onChange={(e) => setTestRate(e.target.value)}
                      className="w-full bg-white border border-stone-300 rounded-lg p-2 text-stone-900 font-mono text-xs focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div className="bg-stone-900 text-white p-3.5 rounded-xl space-y-1.5">
                  <div className="flex justify-between text-stone-400">
                    <span>Base Amount:</span>
                    <span>₹{numInput.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-stone-400">
                    <span>Calculated Metric ({rateVal}%):</span>
                    <span className="text-orange-400">₹{calculatedTax.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="border-t border-stone-800 pt-1.5 flex justify-between font-bold text-sm">
                    <span>Total Computed Result:</span>
                    <span className="text-orange-400">₹{totalWithTax.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            ) : (
              /* If text/image/developer/other tool */
              <div className="space-y-3 font-mono text-xs">
                <div>
                  <label className="block text-stone-500 mb-1">Test String / Input</label>
                  <textarea 
                    value={textVal}
                    onChange={(e) => setTextVal(e.target.value)}
                    rows={2}
                    className="w-full bg-white border border-stone-300 rounded-lg p-2 text-stone-900 font-mono text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="bg-stone-900 text-white p-3.5 rounded-xl space-y-1 text-xs">
                  <div className="flex justify-between text-stone-400">
                    <span>Character Count:</span>
                    <span className="text-white font-bold">{textVal.length}</span>
                  </div>
                  <div className="flex justify-between text-stone-400">
                    <span>Word Count:</span>
                    <span className="text-white font-bold">{textVal.trim() ? textVal.trim().split(/\s+/).length : 0}</span>
                  </div>
                  <div className="flex justify-between text-stone-400">
                    <span>Base64 Preview:</span>
                    <span className="text-orange-400 truncate max-w-xs">
                      {(() => {
                        try {
                          const sub = textVal.substring(0, 30);
                          return btoa(encodeURIComponent(sub).replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode(parseInt(p1, 16))));
                        } catch {
                          return '...';
                        }
                      })()}...
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Privacy & Compliance Assurance */}
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-orange-50/80 border border-orange-200/80 text-xs text-orange-950">
            <ShieldCheck className="w-5 h-5 text-orange-600 flex-shrink-0" />
            <span>
              <strong>Client-Side Guarantee:</strong> No data typed into this tool is ever transmitted over the network or stored in cookies.
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              onClick={handleCopyLink}
              className="px-4 py-2.5 rounded-xl border border-stone-300 hover:bg-stone-100 text-stone-700 text-xs sm:text-sm font-semibold flex items-center gap-2 transition cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-stone-500" />}
              <span>{copied ? 'Link Copied!' : 'Copy Direct URL'}</span>
            </button>

            <a
              href={`/${tool.category}/${tool.id}`}
              className="btn-orange-glow text-white px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2"
            >
              <span>Open Tool Page</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

        </div>

      </div>

    </div>
  );
};
