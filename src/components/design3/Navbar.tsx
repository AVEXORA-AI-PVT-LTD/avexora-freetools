"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import { Search, ExternalLink, User, LogOut, Palette, LayoutGrid, ChevronDown } from 'lucide-react';

interface NavbarProps {
  onSearchClick: () => void;
  onNavigateSection?: (sectionId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onSearchClick }) => {
  const { data: session, status } = useSession();
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('pointerdown', handleOutsideClick);
    return () => document.removeEventListener('pointerdown', handleOutsideClick);
  }, []);

  const userInitial = session?.user?.name
    ? session.user.name.charAt(0).toUpperCase()
    : session?.user?.email
    ? session.user.email.charAt(0).toUpperCase()
    : 'U';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-stone-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 sm:h-22 flex items-center justify-between">
        
        {/* Brand / Logo */}
        <div className="flex items-center gap-6">
          <Link 
            href="/"
            onClick={() => {
              if (window.location.pathname === "/") {
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            }}
            className="flex items-center gap-2.5 group cursor-pointer"
            aria-label="AvexTools Home"
          >
            <Image
              src="/logo.png"
              alt="AvexTools"
              width={220}
              height={53}
              priority
              unoptimized
              className="h-9 sm:h-10 w-auto max-w-[210px] object-contain transition-transform group-hover:scale-105"
            />
          </Link>
        </div>

        {/* Right Action Items */}
        <div className="flex items-center gap-3">
          {/* Enhanced Command Search Input Box */}
          <button
            type="button"
            onClick={onSearchClick}
            className="flex items-center justify-between gap-3 w-44 sm:w-60 md:w-72 px-3.5 py-2 rounded-xl border border-stone-200/90 bg-stone-50/90 hover:bg-white hover:border-orange-400/90 text-stone-500 hover:text-stone-800 text-xs sm:text-sm transition-all cursor-pointer group shadow-2xs hover:shadow-xs"
            title="Search across all 130+ tools"
          >
            <div className="flex items-center gap-2.5">
              <Search className="w-4 h-4 text-stone-400 group-hover:text-orange-600 transition-colors shrink-0" />
              <span className="font-normal text-stone-500 group-hover:text-stone-700">Search 130+ tools...</span>
            </div>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded-md bg-white border border-stone-200/90 text-[10px] font-mono text-stone-400 group-hover:text-stone-600 shadow-2xs">
              ⌘K
            </kbd>
          </button>

          {/* Try EBOS CTA Button (Orange Glow) */}
          <a
            href="https://ebos.avexora.in"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#ffffff' }}
            className="btn-orange-glow !text-white px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm hover:shadow-orange-500/25 transition shrink-0"
          >
            <span className="!text-white text-white">Try EBOS</span>
            <ExternalLink className="w-3.5 h-3.5 text-white/90" />
          </a>

          {/* Sign In / User Profile */}
          <div className="relative" ref={dropdownRef}>
            {status === 'loading' ? (
              <div className="w-8 h-8 rounded-full bg-stone-200 animate-pulse" />
            ) : status === 'authenticated' && session?.user ? (
              <div>
                <button
                  type="button"
                  onClick={() => setProfileOpen((prev) => !prev)}
                  className="flex items-center gap-1.5 p-1 rounded-xl hover:bg-stone-100 transition cursor-pointer border border-stone-200/80 shadow-2xs"
                  aria-label="User Profile"
                >
                  <div className="w-8 h-8 rounded-lg bg-stone-900 border border-stone-800 text-orange-400 flex items-center justify-center font-bold text-xs shadow-xs">
                    {userInitial}
                  </div>
                  <ChevronDown className="w-3 h-3 text-stone-500" />
                </button>

                {/* Profile Dropdown Menu */}
                {profileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl border border-stone-200 shadow-xl p-3 z-50 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200/70 mb-2">
                      <div className="font-bold text-stone-900 text-sm truncate">
                        {session.user.name || 'Avexora User'}
                      </div>
                      <div className="text-stone-500 text-[11px] truncate">
                        {session.user.email}
                      </div>
                      <div className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-mono text-[10px] font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                        <span>PRO WORKSPACE</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Link
                        href="/studio"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-stone-700 hover:text-stone-950 hover:bg-stone-100 font-medium transition"
                      >
                        <Palette className="w-3.5 h-3.5 text-stone-500" />
                        <span>Avexora Brand Studio</span>
                      </Link>

                      <Link
                        href="/#categories-showcase"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-stone-700 hover:text-stone-950 hover:bg-stone-100 font-medium transition"
                      >
                        <LayoutGrid className="w-3.5 h-3.5 text-stone-500" />
                        <span>Explore All Tools</span>
                      </Link>
                    </div>

                    <div className="border-t border-stone-100 my-1 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setProfileOpen(false);
                          signOut();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-rose-600 hover:bg-rose-50 font-medium transition text-left cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/studio/signin"
                className="px-3.5 py-2 rounded-xl border border-stone-200 hover:border-orange-500 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-800 hover:text-orange-600 transition flex items-center gap-1.5 shadow-2xs shrink-0"
              >
                <User className="w-3.5 h-3.5 text-stone-500 group-hover:text-orange-600" />
                <span>Sign In</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
