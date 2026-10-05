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
import { ALL_TOOLS, CATEGORIES, ToolItem, CategoryInfo } from '@/data/toolsData';
import type { HomepageSection } from "@/server/homepage-service";
import type { NavigationLinkItem } from "@/components/editorial/footer-section";

export interface Design3PageProps {
  homepageSections?: HomepageSection[];
  effectiveCategories?: CategoryInfo[];
  effectiveTools?: ToolItem[];
  headerNav?: NavigationLinkItem[];
  footerNav?: NavigationLinkItem[];
}

export function Design3Page({
  homepageSections,
  effectiveCategories,
  effectiveTools,
  headerNav,
  footerNav,
}: Design3PageProps = {}) {
  const [selectedTool, setSelectedTool] = useState<ToolItem | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);

  const toolsList = effectiveTools && effectiveTools.length > 0 ? effectiveTools : ALL_TOOLS;
  const categoriesList = effectiveCategories && effectiveCategories.length > 0 ? effectiveCategories : CATEGORIES;

  const heroSection = homepageSections?.find((s) => s.sectionKey === "hero");
  const brandStudioSection = homepageSections?.find((s) => s.sectionKey === "brand_studio");

  const heroConfig = heroSection ? {
    heading: heroSection.heading,
    description: heroSection.description,
    ctaText: heroSection.config?.ctaText,
    ctaUrl: heroSection.config?.ctaUrl,
  } : undefined;

  const brandStudioConfig = brandStudioSection ? {
    heading: brandStudioSection.heading,
    description: brandStudioSection.description,
    ctaText: brandStudioSection.config?.ctaText,
    ctaUrl: brandStudioSection.config?.ctaUrl,
    pricingText: brandStudioSection.config?.pricingText,
  } : undefined;

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
    const tool = toolsList.find((t) => t.id === toolId);
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
        headerLinks={headerNav}
      />

      {/* Hero Section with 3D Canvas, Tilted 3D Screen & Live Simulator */}
      <HeroSection 
        onExploreClick={() => scrollToSection('categories-showcase')}
        onOpenTool={handleOpenToolById}
        heroConfig={heroConfig}
      />

      {/* Bento Grid Feature Matrix with 3D Hover Tilt & Scroll Reveals */}
      <FeatureMatrix />

      {/* Kinetic Categories Showcase with Scroll Animations */}
      <CategoriesShowcase 
        onSelectTool={(tool) => setSelectedTool(tool)}
        onOpenSearch={() => setIsSearchOpen(true)}
        categories={categoriesList}
        tools={toolsList}
      />

      {/* Avexora Brand Studio Showcase (Corporate Stationery) */}
      {brandStudioSection?.enabled !== false && (
        <BrandStudioSection config={brandStudioConfig} />
      )}

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
        footerLinks={footerNav}
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
        tools={toolsList}
        categories={categoriesList}
      />
    </div>
  );
}

export default Design3Page;
