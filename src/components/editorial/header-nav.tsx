"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { NavAccount } from "@/components/account/nav-account";

interface HeaderNavProps {
  onOpenAuth?: () => void;
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const current = (document.documentElement.dataset.theme as "light" | "dark") || "light";
    setTheme(current);

    const observer = new MutationObserver(() => {
      const next = (document.documentElement.dataset.theme as "light" | "dark") || "light";
      setTheme(next);
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  const toggle = useCallback(() => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("avexora-theme", next);
    } catch {}
    const m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute("content", next === "dark" ? "#08090b" : "#ffffff");

    // Sync any theme buttons
    document.querySelectorAll("[data-theme-set]").forEach((b) => {
      b.setAttribute("aria-pressed", String((b as HTMLElement).dataset.themeSet === next));
    });
    document.querySelectorAll("[data-theme-toggle]").forEach((b) => {
      b.setAttribute("aria-pressed", String(next === "dark"));
    });
  }, [theme]);

  return (
    <button
      className="theme-toggle"
      type="button"
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={theme === "dark"}
      onClick={toggle}
    >
      <svg className="ico ico--sun" viewBox="0 0 24 24" aria-hidden="true">
        <use href="#ic-sun" />
      </svg>
      <svg className="ico ico--moon" viewBox="0 0 24 24" aria-hidden="true">
        <use href="#ic-moon" />
      </svg>
    </button>
  );
}

export function HeaderNav({ onOpenAuth }: HeaderNavProps) {
  const [isStuck, setIsStuck] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsStuck(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`nav${isStuck ? " is-stuck" : ""}`} id="nav" role="banner">
      <div className="nav-inner">
        <Link className="nav-brand" href="/" aria-label="Avexora Tools home">
          <Image
            src="/logo.png"
            alt="Avexora Tools"
            width={220}
            height={53}
            unoptimized
            className="h-9 sm:h-10 w-auto max-w-[210px] object-contain"
            priority
          />
        </Link>

        <div className="nav-right">
          <ThemeToggle />
          <NavAccount onOpenAuth={onOpenAuth} />
        </div>
      </div>
    </header>
  );
}
