"use client";

import React, { useState } from 'react';
import { Send, Terminal, Sparkles, ExternalLink, Search, Calculator, FileText, Receipt, ArrowRight } from 'lucide-react';
import { useScrollProgress } from '@/hooks/useScrollProgress';

interface MatrixTerminalSectionProps {
  onOpenTool?: (toolId: string) => void;
  onOpenSearch?: () => void;
}

interface TerminalItem {
  id: string;
  type: 'system' | 'input' | 'output' | 'success' | 'tool-launcher';
  text: string;
  toolId?: string;
  toolName?: string;
}

export const MatrixTerminalSection: React.FC<MatrixTerminalSectionProps> = ({
  onOpenTool,
  onOpenSearch,
}) => {
  const [commandInput, setCommandInput] = useState('');
  const [terminalHistory, setTerminalHistory] = useState<TerminalItem[]>([
    { id: '1', type: 'system', text: 'AVEXORA OS MATRIX RUNTIME [v2.4.9-arm64]' },
    { id: '2', type: 'system', text: '(c) 2026 Avexora Technologies. All browser runtime sandboxes active.' },
    { id: '3', type: 'system', text: '----------------------------------------------------------------' },
    { id: '4', type: 'system', text: 'INIT: 130+ privacy-first utility engines mounted in local memory.' },
    { id: '5', type: 'success', text: 'READY: Click any tool shortcut below or type commands to launch interactive workspaces.' },
    { id: '6', type: 'tool-launcher', text: 'Featured Quick Launchers:', toolId: 'gst-calculator', toolName: 'GST Calculator' },
  ]);

  // Continuous scroll-linked parallax hook
  const { ref, leftTranslateX, rightTranslateX, opacity, scale } = useScrollProgress<HTMLElement>();

  const quickLaunch = (toolId: string, toolName: string) => {
    setTerminalHistory((prev) => [
      ...prev,
      { id: Date.now().toString(), type: 'input', text: `launch ${toolId}` },
      { id: (Date.now() + 1).toString(), type: 'success', text: `Opening ${toolName} workspace in interactive modal...` },
    ]);
    if (onOpenTool) {
      onOpenTool(toolId);
    }
  };

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = commandInput.trim().toLowerCase();

    // If input is empty, Exec button defaults to launching the interactive workspace modal!
    if (!cmd) {
      const inputId = Date.now().toString();
      setTerminalHistory((prev) => [
        ...prev,
        { id: inputId, type: 'input', text: 'exec launch' },
        { 
          id: inputId + '-out', 
          type: 'tool-launcher', 
          text: 'LAUNCHING: Opening interactive GST & Tax workspace...',
          toolId: 'gst-calculator',
          toolName: 'GST Calculator'
        },
      ]);
      if (onOpenTool) {
        onOpenTool('gst-calculator');
      }
      return;
    }

    const inputId = Date.now().toString();
    const newItems: TerminalItem[] = [
      { id: inputId, type: 'input', text: commandInput }
    ];

    if (cmd === 'help') {
      newItems.push({
        id: inputId + '-out',
        type: 'output',
        text: 'COMMANDS: gst, emi, invoice, pdf, tax <amount>, tools, search, clear, privacy',
      });
    } else if (cmd === 'clear') {
      setTerminalHistory([
        { id: Date.now().toString(), type: 'system', text: 'Matrix shell cleared. Ready.' }
      ]);
      setCommandInput('');
      return;
    } else if (cmd === 'search' || cmd === 'find') {
      newItems.push({
        id: inputId + '-out',
        type: 'success',
        text: 'Opening Global Tool Search Modal (⌘K)...',
      });
      if (onOpenSearch) onOpenSearch();
    } else if (cmd.includes('gst') || cmd === 'tax') {
      newItems.push({
        id: inputId + '-out',
        type: 'tool-launcher',
        text: 'Launching GST Calculator sandbox workspace...',
        toolId: 'gst-calculator',
        toolName: 'GST Calculator',
      });
      if (onOpenTool) onOpenTool('gst-calculator');
    } else if (cmd.startsWith('tax ') && !isNaN(Number(cmd.split(' ')[1]))) {
      const parts = cmd.split(' ');
      const val = parseFloat(parts[1]) || 50000;
      const gst18 = (val * 0.18).toFixed(2);
      const total = (val * 1.18).toFixed(2);
      newItems.push({
        id: inputId + '-out',
        type: 'success',
        text: `GST for ₹${val.toLocaleString('en-IN')}: CGST (9%) = ₹${(parseFloat(gst18)/2).toFixed(2)}, SGST (9%) = ₹${(parseFloat(gst18)/2).toFixed(2)} | Total = ₹${Number(total).toLocaleString('en-IN')}`,
      });
      newItems.push({
        id: inputId + '-open',
        type: 'tool-launcher',
        text: 'Open full calculator modal for custom tax slabs:',
        toolId: 'gst-calculator',
        toolName: 'Open GST Calculator',
      });
    } else if (cmd.includes('emi') || cmd.includes('loan')) {
      newItems.push({
        id: inputId + '-out',
        type: 'tool-launcher',
        text: 'Launching EMI & Loan Amortization workspace...',
        toolId: 'emi-calculator',
        toolName: 'EMI Calculator',
      });
      if (onOpenTool) onOpenTool('emi-calculator');
    } else if (cmd.includes('invoice') || cmd.includes('bill')) {
      newItems.push({
        id: inputId + '-out',
        type: 'tool-launcher',
        text: 'Launching Invoicing & Billing Engine workspace...',
        toolId: 'invoice-generator',
        toolName: 'Invoice Generator',
      });
      if (onOpenTool) onOpenTool('invoice-generator');
    } else if (cmd.includes('pdf')) {
      newItems.push({
        id: inputId + '-out',
        type: 'tool-launcher',
        text: 'Launching PDF Compressor...',
        toolId: 'pdf-compressor',
        toolName: 'PDF Compressor',
      });
      if (onOpenTool) onOpenTool('pdf-compressor');
    } else if (cmd === 'tools' || cmd === 'list') {
      newItems.push({
        id: inputId + '-out',
        type: 'output',
        text: 'AVAILABLE TOOL ENGINES: Click to open any module directly:',
      });
      newItems.push({
        id: inputId + '-gst',
        type: 'tool-launcher',
        text: '1. GST Calculator (All slabs + reverse calc)',
        toolId: 'gst-calculator',
        toolName: 'GST Calculator',
      });
      newItems.push({
        id: inputId + '-emi',
        type: 'tool-launcher',
        text: '2. EMI Calculator (Home/Car loan schedules)',
        toolId: 'emi-calculator',
        toolName: 'EMI Calculator',
      });
      newItems.push({
        id: inputId + '-inv',
        type: 'tool-launcher',
        text: '3. GST Invoice Generator (B2B / B2C formats)',
        toolId: 'invoice-generator',
        toolName: 'Invoice Generator',
      });
    } else if (cmd === 'privacy' || cmd === 'status') {
      newItems.push({
        id: inputId + '-out',
        type: 'success',
        text: 'STATUS: All engines online | 100% Client Privacy Guaranteed',
      });
    } else {
      newItems.push({
        id: inputId + '-out',
        type: 'output',
        text: `Command "${cmd}" not recognized. Type "help" or click any shortcut below.`,
      });
    }

    setTerminalHistory((prev) => [...prev, ...newItems]);
    setCommandInput('');
  };

  return (
    <section 
      ref={ref}
      id="matrix-terminal" 
      className="pt-12 pb-14 sm:pt-14 sm:pb-16 bg-stone-950 text-white border-t border-stone-800 relative overflow-hidden"
    >
      {/* Background Matrix Grid */}
      <div className="absolute inset-0 bg-matrix-grid-dark opacity-35 pointer-events-none" />
      
      {/* Orange Glow Orb */}
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Left Column: Purpose & Direct Tool Launchers */}
          <div 
            style={{
              transform: `translate3d(${leftTranslateX}px, 0, 0)`,
              opacity: opacity,
              transition: 'transform 0.1s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.15s ease-out',
              willChange: 'transform, opacity',
            }}
            className="lg:col-span-5 space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-950/80 border border-orange-500/40 text-orange-400 font-mono text-xs font-semibold">
              <Terminal className="w-3.5 h-3.5" />
              <span>INTERACTIVE WORKSPACE LAUNCHPAD</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Instant tool launcher. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500">
                Direct client execution.
              </span>
            </h2>

            <p className="text-stone-400 text-sm sm:text-base leading-relaxed">
              Launch any of our 130+ free business and financial tools directly into an interactive 
              modal workspace, or run real-time math commands straight from the matrix terminal.
            </p>

            {/* Direct Tool Launch Buttons */}
            <div className="space-y-2 pt-1">
              <div className="text-xs font-mono uppercase text-stone-400 font-semibold tracking-wider">
                Quick-Open Workspaces:
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => quickLaunch('gst-calculator', 'GST Calculator')}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-800 hover:border-orange-500/60 hover:bg-stone-800/80 text-left transition group cursor-pointer"
                >
                  <Calculator className="w-4 h-4 text-orange-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-orange-400 transition-colors">
                      GST Calculator
                    </div>
                    <div className="text-[10px] text-stone-500">Instant slabs & tax</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => quickLaunch('emi-calculator', 'EMI Calculator')}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-800 hover:border-orange-500/60 hover:bg-stone-800/80 text-left transition group cursor-pointer"
                >
                  <Calculator className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors">
                      EMI Calculator
                    </div>
                    <div className="text-[10px] text-stone-500">Loans & amortization</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => quickLaunch('invoice-generator', 'Invoice Generator')}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-800 hover:border-orange-500/60 hover:bg-stone-800/80 text-left transition group cursor-pointer"
                >
                  <Receipt className="w-4 h-4 text-orange-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-orange-400 transition-colors">
                      Invoice Generator
                    </div>
                    <div className="text-[10px] text-stone-500">B2B / B2C bills</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => quickLaunch('pdf-compressor', 'PDF Compressor')}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-800 hover:border-orange-500/60 hover:bg-stone-800/80 text-left transition group cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors">
                      PDF Compressor
                    </div>
                    <div className="text-[10px] text-stone-500">100% offline in browser</div>
                  </div>
                </button>
              </div>

              {onOpenSearch && (
                <button
                  type="button"
                  onClick={onOpenSearch}
                  className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600/20 border border-orange-500/40 hover:bg-orange-600/30 text-orange-300 font-semibold text-xs transition cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5 text-orange-400" />
                  <span>Search All 130+ Tools (⌘K)</span>
                  <ArrowRight className="w-3.5 h-3.5 text-orange-400 ml-1" />
                </button>
              )}
            </div>

            {/* Quick Telemetry Cards */}
            <div className="grid grid-cols-2 gap-4 pt-1">
              <div className="bg-stone-900/60 border border-stone-800/80 p-3.5 rounded-xl">
                <div className="text-xl font-black font-mono text-orange-400">0.00 ms</div>
                <div className="text-[11px] text-stone-400 font-mono mt-0.5">Cloud Latency</div>
              </div>

              <div className="bg-stone-900/60 border border-stone-800/80 p-3.5 rounded-xl">
                <div className="text-xl font-black font-mono text-emerald-400">100%</div>
                <div className="text-[11px] text-stone-400 font-mono mt-0.5">Private Sandbox</div>
              </div>
            </div>
          </div>

          {/* Right Column: Live Interactive Terminal Console */}
          <div 
            style={{
              transform: `translate3d(${rightTranslateX}px, 0, 0) scale(${scale})`,
              opacity: opacity,
              transition: 'transform 0.1s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.15s ease-out, scale 0.15s ease-out',
              willChange: 'transform, opacity',
            }}
            className="lg:col-span-7"
          >
            <div className="bg-black rounded-2xl border border-stone-800 shadow-2xl overflow-hidden font-mono text-xs">
              
              {/* Terminal Header */}
              <div className="bg-stone-900/90 px-4 py-3 border-b border-stone-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block"></span>
                  <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
                  <span className="ml-3 text-stone-400 text-xs font-semibold">
                    avexora-shell ~ v2.4.9
                  </span>
                </div>
                <div className="text-[11px] text-orange-400 flex items-center gap-1.5 font-bold">
                  <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping"></span>
                  LIVE MATRIX WORKSPACE
                </div>
              </div>

              {/* Terminal Quick Command Chips */}
              <div className="px-4 py-2 bg-stone-900/40 border-b border-stone-800/60 flex items-center gap-2 overflow-x-auto text-[11px]">
                <span className="text-stone-500 shrink-0">Quick run:</span>
                <button
                  type="button"
                  onClick={() => quickLaunch('gst-calculator', 'GST Calculator')}
                  className="px-2 py-0.5 rounded bg-stone-800/80 hover:bg-orange-600/30 text-stone-300 hover:text-orange-300 border border-stone-700/60 transition cursor-pointer shrink-0"
                >
                  ⚡ gst
                </button>
                <button
                  type="button"
                  onClick={() => quickLaunch('emi-calculator', 'EMI Calculator')}
                  className="px-2 py-0.5 rounded bg-stone-800/80 hover:bg-orange-600/30 text-stone-300 hover:text-orange-300 border border-stone-700/60 transition cursor-pointer shrink-0"
                >
                  📊 emi
                </button>
                <button
                  type="button"
                  onClick={() => quickLaunch('invoice-generator', 'Invoice Generator')}
                  className="px-2 py-0.5 rounded bg-stone-800/80 hover:bg-orange-600/30 text-stone-300 hover:text-orange-300 border border-stone-700/60 transition cursor-pointer shrink-0"
                >
                  💼 invoice
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCommandInput('tax 50000');
                  }}
                  className="px-2 py-0.5 rounded bg-stone-800/80 hover:bg-orange-600/30 text-stone-300 hover:text-orange-300 border border-stone-700/60 transition cursor-pointer shrink-0"
                >
                  ₹ tax 50000
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCommandInput('tools');
                  }}
                  className="px-2 py-0.5 rounded bg-stone-800/80 hover:bg-orange-600/30 text-stone-300 hover:text-orange-300 border border-stone-700/60 transition cursor-pointer shrink-0"
                >
                  📋 tools
                </button>
              </div>

              {/* Terminal Body */}
              <div className="p-5 h-72 overflow-y-auto space-y-2 bg-stone-950/95 scrollbar-thin scrollbar-thumb-stone-800">
                {terminalHistory.map((item) => (
                  <div key={item.id} className="leading-relaxed">
                    {item.type === 'input' && (
                      <span className="text-orange-400 font-bold">&gt; {item.text}</span>
                    )}
                    {item.type === 'system' && (
                      <span className="text-stone-400">{item.text}</span>
                    )}
                    {item.type === 'success' && (
                      <span className="text-emerald-400 font-medium">{item.text}</span>
                    )}
                    {item.type === 'output' && (
                      <span className="text-stone-300">{item.text}</span>
                    )}
                    {item.type === 'tool-launcher' && (
                      <div className="flex items-center gap-2 py-1">
                        <span className="text-stone-300">{item.text}</span>
                        {item.toolId && (
                          <button
                            type="button"
                            onClick={() => quickLaunch(item.toolId!, item.toolName || 'Tool')}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-orange-600 hover:bg-orange-500 text-white font-bold text-[11px] transition cursor-pointer shadow-xs"
                          >
                            <span>Open {item.toolName}</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Terminal Input Form */}
              <form onSubmit={handleCommandSubmit} className="border-t border-stone-800 p-3 bg-stone-900/80 flex items-center gap-2">
                <span className="text-orange-500 font-bold pl-2">&gt;</span>
                <input 
                  type="text"
                  value={commandInput}
                  onChange={(e) => setCommandInput(e.target.value)}
                  placeholder="Type 'gst', 'tax 100000', 'emi', 'invoice', 'tools'..."
                  className="flex-1 bg-transparent text-white focus:outline-none font-mono text-xs px-2"
                />
                <button 
                  type="submit"
                  style={{ color: '#ffffff' }}
                  className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md shadow-orange-600/30 shrink-0"
                >
                  <span className="!text-white text-white">Exec</span>
                  <Send className="w-3.5 h-3.5 text-white" />
                </button>
              </form>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
