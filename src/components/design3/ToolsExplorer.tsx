"use client";

import React, { useState, useMemo } from 'react';
import { 
  ALL_TOOLS, 
  CATEGORIES, 
  ToolItem 
} from '@/data/toolsData';
import { 
  Search, 
  Sparkles, 
  ArrowRight, 
  Filter, 
  Flame, 
  Layers, 
  ExternalLink,
  Star
} from 'lucide-react';

interface ToolsExplorerProps {
  onSelectTool: (tool: ToolItem) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const ToolsExplorer: React.FC<ToolsExplorerProps> = ({ 
  onSelectTool,
  searchQuery,
  setSearchQuery
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [onlyPopular, setOnlyPopular] = useState<boolean>(false);

  // Filtered tools
  const filteredTools = useMemo(() => {
    return ALL_TOOLS.filter((tool) => {
      // Category filter
      if (selectedCategory !== 'all' && tool.category !== selectedCategory) {
        return false;
      }
      // Popular filter
      if (onlyPopular && !tool.popular) {
        return false;
      }
      // Search query filter
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchesName = tool.name.toLowerCase().includes(query);
        const matchesDesc = tool.description.toLowerCase().includes(query);
        const matchesTags = tool.tags.some(tag => tag.toLowerCase().includes(query));
        const matchesCat = tool.categoryName.toLowerCase().includes(query);
        return matchesName || matchesDesc || matchesTags || matchesCat;
      }
      return true;
    });
  }, [selectedCategory, onlyPopular, searchQuery]);

  return (
    <section id="tools-explorer" className="py-20 bg-white border-t border-stone-200 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Title & Search Controls */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-orange-200 bg-orange-50/70 text-xs font-mono font-semibold text-orange-900 mb-3">
              <Layers className="w-3.5 h-3.5 text-orange-600" />
              <span>THE AVEXORA DIRECTORY</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
              Explore 130+ Free Online Tools
            </h2>
            <p className="mt-2 text-stone-600 text-sm sm:text-base max-w-xl">
              Calculators, generators, PDF & image utilities and AI writing tools for your business.
              Zero sign-up required.
            </p>
          </div>

          {/* Search Box with Real-time Filter */}
          <div className="w-full md:w-96 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-stone-400" />
            <input 
              type="text"
              placeholder="Search by name, tag, or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-stone-300 bg-stone-50/70 text-stone-900 text-sm placeholder:text-stone-400 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition shadow-xs"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-3 text-xs text-stone-400 hover:text-stone-700 cursor-pointer font-mono"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Category Pills Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
          <button
            onClick={() => { setSelectedCategory('all'); setOnlyPopular(false); }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
              selectedCategory === 'all' && !onlyPopular
                ? 'bg-stone-950 text-white shadow-sm'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200/80 hover:text-stone-900'
            }`}
          >
            <span>All Tools</span>
            <span className="font-mono text-[11px] opacity-75">({ALL_TOOLS.length})</span>
          </button>

          <button
            onClick={() => setOnlyPopular(!onlyPopular)}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
              onlyPopular
                ? 'bg-orange-600 text-white shadow-sm'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200/80 hover:text-stone-900'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-orange-500" />
            <span>Popular Tools</span>
          </button>

          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => { setSelectedCategory(cat.id); setOnlyPopular(false); }}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                selectedCategory === cat.id && !onlyPopular
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200/80 hover:text-stone-900'
              }`}
            >
              <span>{cat.name}</span>
            </button>
          ))}
        </div>

        {/* Tools Results Counter */}
        <div className="flex items-center justify-between text-xs font-mono text-stone-500 mb-6 pb-2 border-b border-stone-200">
          <span>
            SHOWING <strong className="text-stone-900 font-bold">{filteredTools.length}</strong> TOOLS
          </span>
          <span className="hidden sm:inline">
            CLIENT-SIDE WEB ENGINES · LATENCY: 0.00ms
          </span>
        </div>

        {/* Tools Grid */}
        {filteredTools.length === 0 ? (
          <div className="py-20 text-center bg-stone-50 rounded-2xl border border-dashed border-stone-300">
            <p className="text-stone-500 text-base">No tools matched your query "{searchQuery}".</p>
            <button 
              onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
              className="mt-4 px-4 py-2 bg-stone-900 text-white rounded-lg text-xs font-mono cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTools.map((tool) => (
              <div
                key={tool.id}
                onClick={() => onSelectTool(tool)}
                className="group p-5 rounded-2xl bg-white border border-stone-200/90 hover:border-orange-500/80 hover:shadow-lg transition-all duration-200 flex flex-col justify-between cursor-pointer relative overflow-hidden"
              >
                {/* Orange Top Accent on Hover */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-orange-700 bg-orange-50 px-2 py-0.5 rounded border border-orange-200/60 font-semibold">
                      {tool.categoryName}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {tool.popular && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60">
                          <Flame className="w-3 h-3 text-amber-500 fill-amber-500" />
                          POPULAR
                        </span>
                      )}
                      {tool.isNew && (
                        <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                          NEW
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-stone-900 group-hover:text-orange-600 transition-colors flex items-center justify-between">
                    <span>{tool.name}</span>
                    <ArrowRight className="w-4 h-4 text-stone-300 group-hover:text-orange-600 group-hover:translate-x-1 transition-all" />
                  </h3>

                  <p className="mt-2 text-stone-600 text-xs sm:text-sm leading-relaxed line-clamp-2">
                    {tool.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400 font-mono">
                  <div className="flex gap-1.5 flex-wrap">
                    {tool.tags.slice(0, 3).map((tag, idx) => (
                      <span key={idx} className="text-stone-500 hover:text-stone-700">
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <span className="group-hover:text-orange-600 font-semibold transition-colors">
                    Open Tool ➔
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
