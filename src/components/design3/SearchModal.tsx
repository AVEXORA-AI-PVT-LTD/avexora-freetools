"use client";

import React, { useState, useEffect } from 'react';
import { ALL_TOOLS, ToolItem } from '@/data/toolsData';
import { Search, X, ArrowRight, Flame, Layers } from 'lucide-react';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTool: (tool: ToolItem) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectTool,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      setQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredTools = ALL_TOOLS.filter((tool) => {
    if (!query.trim()) return tool.popular;
    const q = query.toLowerCase();
    return (
      tool.name.toLowerCase().includes(q) ||
      tool.description.toLowerCase().includes(q) ||
      tool.categoryName.toLowerCase().includes(q) ||
      tool.tags.some((tag) => tag.toLowerCase().includes(q))
    );
  }).slice(0, 12);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl bg-white rounded-2xl border border-stone-300 shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-200 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-4 border-b border-stone-200 flex items-center gap-3 bg-stone-50/70">
          <Search className="w-5 h-5 text-stone-400 flex-shrink-0" />
          <input 
            type="text"
            autoFocus
            placeholder="Type tool name, e.g. GST, Salary, PDF, QR..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-stone-900 text-sm focus:outline-none placeholder:text-stone-400"
          />
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-1">
          <div className="px-3 py-1.5 text-[11px] font-mono text-stone-400 uppercase tracking-wider">
            {query.trim() ? `Search Results (${filteredTools.length})` : 'Popular Tools'}
          </div>

          {filteredTools.length === 0 ? (
            <div className="py-12 text-center text-stone-500 text-sm">
              No tools found matching "{query}".
            </div>
          ) : (
            filteredTools.map((tool) => (
              <div
                key={tool.id}
                onClick={() => {
                  onSelectTool(tool);
                  onClose();
                }}
                className="p-3 rounded-xl hover:bg-orange-50/70 border border-transparent hover:border-orange-200 transition cursor-pointer flex items-center justify-between group"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-semibold uppercase text-orange-600 bg-orange-100/70 px-2 py-0.5 rounded">
                      {tool.categoryName}
                    </span>
                    <span className="text-sm font-bold text-stone-900 group-hover:text-orange-600 transition">
                      {tool.name}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5 line-clamp-1">
                    {tool.description}
                  </p>
                </div>

                <ArrowRight className="w-4 h-4 text-stone-300 group-hover:text-orange-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-stone-100 border-t border-stone-200 flex items-center justify-between text-[11px] font-mono text-stone-500">
          <span>Navigate with mouse or touch</span>
          <span>ESC to close</span>
        </div>
      </div>
    </div>
  );
};
