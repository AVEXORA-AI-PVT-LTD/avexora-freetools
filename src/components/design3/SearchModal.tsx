"use client";

import React, { useState, useEffect, useRef } from 'react';
import { ALL_TOOLS, CATEGORIES, ToolItem } from '@/data/toolsData';
import { Search, X, ArrowRight, CornerDownLeft, Sparkles, FolderOpen, Layers } from 'lucide-react';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTool: (tool: ToolItem) => void;
  tools?: ToolItem[];
  categories?: typeof CATEGORIES;
}

function highlightMatch(text: string, query: string) {
  if (!query.trim()) return text;
  const q = query.trim().toLowerCase();
  const index = text.toLowerCase().indexOf(q);
  if (index === -1) return text;
  const before = text.substring(0, index);
  const match = text.substring(index, index + query.length);
  const after = text.substring(index + query.length);
  return (
    <span>
      {before}
      <mark className="bg-orange-200/80 text-orange-950 font-semibold px-0.5 rounded">{match}</mark>
      {after}
    </span>
  );
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectTool,
  tools,
  categories,
}) => {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  const toolsList = tools && tools.length > 0 ? tools : ALL_TOOLS;
  const categoriesList = categories && categories.length > 0 ? categories : CATEGORIES;

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedCategory('all');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const filteredTools = toolsList.filter((tool) => {
    const matchesCategory = selectedCategory === 'all' || tool.category === selectedCategory;
    if (!matchesCategory) return false;

    if (!query.trim()) return tool.popular || selectedCategory !== 'all';

    const q = query.toLowerCase().trim();
    return (
      tool.name.toLowerCase().includes(q) ||
      tool.description.toLowerCase().includes(q) ||
      tool.categoryName.toLowerCase().includes(q) ||
      tool.tags.some((tag) => tag.toLowerCase().includes(q))
    );
  });

  // Reset selectedIndex when query or category changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, selectedCategory]);

  // Scroll active item into view
  useEffect(() => {
    if (itemRefs.current[selectedIndex]) {
      itemRefs.current[selectedIndex]?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredTools.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredTools.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredTools[selectedIndex]) {
        onSelectTool(filteredTools[selectedIndex]);
        onClose();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-20 px-3 sm:px-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
      onKeyDown={handleKeyDown}
    >
      <div 
        className="w-full max-w-3xl bg-white rounded-3xl border border-stone-200 shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-200 text-left flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center gap-3 bg-stone-50/70 shrink-0">
          <Search className="w-5 h-5 text-stone-400 shrink-0" />
          <input 
            ref={inputRef}
            type="text"
            placeholder="Search all 130+ tools by name, topic, or keyword (e.g. GST, Salary, PDF, QR)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-stone-900 text-sm sm:text-base focus:outline-none placeholder:text-stone-400 font-sans"
            aria-label="Search tools"
          />
          {query.trim() && (
            <button 
              onClick={() => setQuery('')}
              className="p-1 rounded-lg text-stone-400 hover:text-stone-700 cursor-pointer text-xs font-mono"
              title="Clear query"
            >
              Clear
            </button>
          )}
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition cursor-pointer shrink-0"
            aria-label="Close search"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Category Filter Pills Bar */}
        <div className="px-4 py-2.5 border-b border-stone-100 bg-white flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-stone-900 text-white font-semibold shadow-2xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200/80 hover:text-stone-900'
            }`}
          >
            All Categories ({toolsList.length})
          </button>
          {categoriesList.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-orange-600 text-white font-semibold shadow-2xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200/80 hover:text-stone-900'
              }`}
            >
              {cat.name} ({cat.count})
            </button>
          ))}
        </div>

        {/* Results List Area (Unlimited height, fully scrollable) */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-1.5 divide-y divide-stone-100/60">
          <div className="px-3 py-1.5 text-[11px] font-mono text-stone-400 uppercase tracking-wider flex items-center justify-between">
            <span>
              {query.trim()
                ? `Search Results (${filteredTools.length})`
                : selectedCategory !== 'all'
                ? `Category Tools (${filteredTools.length})`
                : `Featured & Popular Tools (${filteredTools.length})`}
            </span>
            {filteredTools.length > 0 && (
              <span className="text-[10px] text-stone-400 hidden sm:inline">Use ↑ ↓ arrows to navigate</span>
            )}
          </div>

          {filteredTools.length === 0 ? (
            <div className="py-14 px-4 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 border border-orange-200 text-orange-600 flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-stone-900">
                No tools found matching &quot;{query}&quot;
              </h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Try searching for broader keywords like tax, invoice, salary, pdf, json, or explore our full tool directory by category.
              </p>
              <div className="pt-2 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    setSelectedCategory('all');
                  }}
                  className="px-4 py-2 rounded-xl bg-orange-600 text-white text-xs font-semibold hover:bg-orange-700 shadow-sm transition"
                >
                  Clear Search
                </button>
                <a
                  href="/#categories-showcase"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-stone-200 bg-white text-stone-700 text-xs font-semibold hover:bg-stone-50 transition"
                >
                  Browse Categories
                </a>
              </div>
            </div>
          ) : (
            filteredTools.map((tool, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={tool.id}
                  ref={(el) => {
                    itemRefs.current[idx] = el;
                  }}
                  onClick={() => {
                    onSelectTool(tool);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 group ${
                    isSelected
                      ? 'bg-orange-50/90 border-orange-300 shadow-xs'
                      : 'border-transparent hover:bg-stone-50'
                  }`}
                  role="option"
                  aria-selected={isSelected}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono font-bold uppercase text-orange-700 bg-orange-100/90 px-2 py-0.5 rounded border border-orange-200/60">
                        {tool.categoryName}
                      </span>
                      <h4 className={`text-sm font-bold truncate transition-colors ${
                        isSelected ? 'text-orange-700' : 'text-stone-900 group-hover:text-orange-600'
                      }`}>
                        {highlightMatch(tool.name, query)}
                      </h4>
                      {tool.badge && (
                        <span className="text-[10px] font-mono font-semibold uppercase text-emerald-700 bg-emerald-100/80 px-1.5 py-0.2 rounded">
                          {tool.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-500 line-clamp-1 leading-relaxed">
                      {highlightMatch(tool.description, query)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isSelected && (
                      <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono font-medium text-orange-600">
                        <span>Press Enter</span>
                        <CornerDownLeft className="w-3 h-3" />
                      </span>
                    )}
                    <ArrowRight className={`w-4 h-4 transition-all ${
                      isSelected 
                        ? 'text-orange-600 translate-x-1' 
                        : 'text-stone-300 group-hover:text-stone-600'
                    }`} />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Navigation Hints */}
        <div className="px-4 py-3 bg-stone-100/90 border-t border-stone-200 flex flex-wrap items-center justify-between text-[11px] font-mono text-stone-500 gap-2 shrink-0">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-stone-300 text-[10px] shadow-2xs">↑</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-stone-300 text-[10px] shadow-2xs">↓</kbd>
              <span>to navigate</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-stone-300 text-[10px] shadow-2xs">↵</kbd>
              <span>to open</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-stone-300 text-[10px] shadow-2xs">esc</kbd>
              <span>to close</span>
            </span>
          </div>
          <span>Showing {filteredTools.length} tools</span>
        </div>
      </div>
    </div>
  );
};
