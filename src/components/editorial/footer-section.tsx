"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { ExternalLink } from "lucide-react";
import { EBOS_URL } from "@/tools/categories";

export interface NavigationLinkItem {
  id: string;
  label: string;
  href: string;
  location?: "HEADER" | "FOOTER";
  openInNewTab?: boolean;
}

interface FooterSectionProps {
  onOpenSearch?: () => void;
  onOpenAuth?: (type: "login" | "signup") => void;
  footerLinks?: NavigationLinkItem[];
}

export function FooterSection({ onOpenSearch, onOpenAuth, footerLinks }: FooterSectionProps) {
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const current = (document.documentElement.dataset.theme as "light" | "dark") || "light";
    setTheme(current);
  }, []);

  const setThemeExplicit = useCallback((mode: "light" | "dark") => {
    setTheme(mode);
    document.documentElement.dataset.theme = mode;
    try {
      localStorage.setItem("avexora-theme", mode);
    } catch {}
    const m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute("content", mode === "dark" ? "#08090b" : "#ffffff");
  }, []);

  return (
    <>
      {/* ============================================================
           CTA — INVERTED BLOCK
           ============================================================ */}
      <section className="cta" aria-labelledby="cta-title">
        <div className="cta-inner !py-12 sm:!py-16">
          <h2 className="cta-title" id="cta-title">
            <span className="mask is-in"><span className="mask-in">Start with</span></span>
            <span className="mask is-in"><span className="mask-in"><em>one tool.</em></span></span>
          </h2>
          <p className="cta-lede">Free while in beta. No card, no sales call, no onboarding call you didn&apos;t ask for.</p>
          <div className="cta-actions">
            {isAuthenticated ? (
              <a
                href={EBOS_URL || "https://ebos.avexora.in"}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary btn-lg inline-flex items-center gap-2"
              >
                <span>Enterprise Business OS</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            ) : (
              <>
                <button
                  className="btn btn-primary btn-lg"
                  type="button"
                  onClick={() => {
                    if (onOpenAuth) {
                      onOpenAuth("login");
                    } else {
                      window.location.href = "/studio/signin";
                    }
                  }}
                >
                  Sign in with Email
                </button>
                <button className="btn btn-secondary btn-lg" type="button" onClick={onOpenSearch}>
                  Browse all tools
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ============================================================
           FOOTER
           ============================================================ */}
      <footer className="footer bg-stone-950 text-stone-300 border-t border-stone-800" role="contentinfo">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-14 pb-4 sm:pb-5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-5 flex flex-col items-start text-left">
              <Link href="/" className="inline-flex items-center group">
                <Image
                  src="/logo.png"
                  alt="AvexTools"
                  width={200}
                  height={48}
                  unoptimized
                  className="h-7.5 sm:h-8.5 w-auto max-w-[175px] object-contain object-left transition-transform group-hover:scale-105"
                />
              </Link>
              <p className="mt-3 text-sm text-stone-400 max-w-sm">Tools that get out of your way.</p>
            </div>
            <nav className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8 text-left" aria-label="Footer">
              <div className="flex flex-col gap-2.5 items-start">
                <span className="eyebrow-mono text-stone-500 text-xs font-mono uppercase tracking-wider mb-1">Product</span>
                <a href="/#categories-showcase" className="text-sm text-stone-400 hover:text-white transition-colors">All tools</a>
                <a href="/#categories-showcase" className="text-sm text-stone-400 hover:text-white transition-colors">Categories</a>
                <a href="/#matrix-terminal" className="text-sm text-stone-400 hover:text-white transition-colors">Product tour</a>
                <a href="/studio/pricing" className="text-sm text-stone-400 hover:text-white transition-colors">Pricing</a>
              </div>
              <div className="flex flex-col gap-2.5 items-start">
                <span className="eyebrow-mono text-stone-500 text-xs font-mono uppercase tracking-wider mb-1">Company</span>
                <a href="/about" className="text-sm text-stone-400 hover:text-white transition-colors">About</a>
                <a href="/privacy-policy" className="text-sm text-stone-400 hover:text-white transition-colors">Privacy</a>
                <a href="/terms" className="text-sm text-stone-400 hover:text-white transition-colors">Terms</a>
                <a href={EBOS_URL} target="_blank" rel="noopener noreferrer" className="text-sm text-stone-400 hover:text-white transition-colors">Avexora EBOS</a>
              </div>
              {footerLinks && footerLinks.length > 0 && (
                <div className="flex flex-col gap-2.5 items-start">
                  <span className="eyebrow-mono text-stone-500 text-xs font-mono uppercase tracking-wider mb-1">Quick Links</span>
                  {footerLinks.map((link) => (
                    <a
                      key={link.id}
                      href={link.href}
                      target={link.openInNewTab ? "_blank" : undefined}
                      rel={link.openInNewTab ? "noopener noreferrer" : undefined}
                      className="text-sm text-stone-400 hover:text-white transition-colors"
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              )}
            </nav>
          </div>

          <div className="mt-10 sm:mt-12 pt-6 sm:pt-7 border-t border-stone-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-stone-500">
            <span>© {new Date().getFullYear()} Avexora Tools</span>
            <span>Runs entirely in your browser</span>
          </div>
        </div>
      </footer>
    </>
  );
}
