"use client";

import React, { useState, useEffect } from 'react';
import { Navbar } from './Navbar';
import { HeroSection } from './HeroSection';
import { FeatureMatrix } from './FeatureMatrix';
import { CategoriesShowcase } from './CategoriesShowcase';
import { BrandStudioSection } from './BrandStudioSection';
import { MatrixTerminalSection } from './MatrixTerminalSection';
import { FAQSection } from './FAQSection';
import { FooterSection } from '@/components/editorial/footer-section';
import { ToolModal } from './ToolModal';
import { SearchModal } from './SearchModal';
import { ALL_TOOLS, ToolItem } from '@/data/toolsData';

export function Design3Page() {
  const [selectedTool, setSelectedTool] = useState<ToolItem | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);

  // Handle Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleOpenToolById = (toolId: string) => {
    const tool = ALL_TOOLS.find((t) => t.id === toolId);
    if (tool) {
      setSelectedTool(tool);
    }
  };

  const scrollToSection = (sectionId: string) => {
    const elem = document.getElementById(sectionId);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white text-stone-900 selection:bg-orange-500 selection:text-white font-sans">
      {/* Fixed Luxury Navbar */}
      <Navbar 
        onSearchClick={() => setIsSearchOpen(true)}
        onNavigateSection={scrollToSection}
      />

      {/* Hero Section with 3D Canvas, Tilted 3D Screen & Live Simulator */}
      <HeroSection 
        onExploreClick={() => scrollToSection('categories-showcase')}
        onOpenTool={handleOpenToolById}
      />

      {/* Bento Grid Feature Matrix with 3D Hover Tilt & Scroll Reveals */}
      <FeatureMatrix />

      {/* Kinetic Categories Showcase with Scroll Animations */}
      <CategoriesShowcase 
        onSelectTool={(tool) => setSelectedTool(tool)}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      {/* Avexora Brand Studio Showcase (Corporate Stationery) */}
      <BrandStudioSection />

      {/* Cyber Black Matrix Terminal & Telemetry */}
      <MatrixTerminalSection 
        onOpenTool={handleOpenToolById}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      {/* Knowledge Base FAQ */}
      <FAQSection />

      {/* Restored Previous CTA & Footer */}
      <FooterSection 
        onOpenSearch={() => {
          setIsSearchOpen(true);
        }}
      />

      {/* Interactive Tool Modal */}
      <ToolModal 
        tool={selectedTool}
        onClose={() => setSelectedTool(null)}
      />

      {/* Quick Tool Search Modal (⌘K) */}
      <SearchModal 
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectTool={(tool) => setSelectedTool(tool)}
      />
    </div>
  );
}

export default Design3Page;
