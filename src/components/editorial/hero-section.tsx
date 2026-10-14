"use client";

import { useEffect, useRef, useState } from "react";
import { useDepthMotion, useReducedMotion, useIsTouchDevice, useIsSmallScreen, useParallax } from "./use-depth-motion";

interface HeroSectionProps {
  onOpenSearch?: () => void;
}

const FLOATING_CARDS = [
  { icon: "json", name: "JSON Formatter", cat: "Developer", depth: 44, x: -12, y: -8, delay: 0 },
  { icon: "image", name: "Image Compressor", cat: "Image", depth: 78, x: 14, y: -12, delay: 120 },
  { icon: "rupee", name: "EMI Calculator", cat: "Finance", depth: 112, x: -16, y: 10, delay: 240 },
  { icon: "shield", name: "Runs locally", cat: "Privacy", depth: 60, x: 10, y: 14, delay: 360 },
];

export function HeroSection({ onOpenSearch }: HeroSectionProps) {
  const heroRef = useRef<HTMLElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [mounted, setMounted] = useState(false);
  const reducedMotion = useReducedMotion();
  const isTouch = useIsTouchDevice();
  const isSmall = useIsSmallScreen(1024);
  const depthDisabled = reducedMotion || isTouch || isSmall;
  const gridParallax = useParallax(0.15, depthDisabled);

  useEffect(() => {
    setMounted(true);
  }, []);

  const card1 = useDepthMotion<HTMLDivElement>({ maxRotateX: 3, maxRotateY: 5, disabled: depthDisabled });
  const card2 = useDepthMotion<HTMLDivElement>({ maxRotateX: 3, maxRotateY: 5, disabled: depthDisabled });
  const card3 = useDepthMotion<HTMLDivElement>({ maxRotateX: 3, maxRotateY: 5, disabled: depthDisabled });
  const card4 = useDepthMotion<HTMLDivElement>({ maxRotateX: 3, maxRotateY: 5, disabled: depthDisabled });

  const cardHooks = [card1, card2, card3, card4];

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
      heroRef.current?.classList.add("is-ready");
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="hero" id="hero" ref={heroRef} aria-labelledby="hero-title">
      <div
        ref={gridParallax.ref}
        className="hero-grid"
        aria-hidden="true"
        style={!depthDisabled && mounted ? { transform: `translate3d(0, ${gridParallax.offset}px, 0)` } : undefined}
      />

      {/* Decorative 3D Floating Depth Layer */}
      {!depthDisabled && (
        <div className="hero-3d d3-scene" aria-hidden="true">
          {FLOATING_CARDS.map((card, i) => {
            const hook = cardHooks[i];
            return (
              <div
                key={card.name}
                ref={hook.ref}
                className="hero-3d-card d3"
                data-float={String.fromCharCode(97 + i)}
                style={{
                  ...hook.style,
                  transform: `translate3d(${card.x}vw, ${card.y}vh, ${card.depth}px)`,
                  animationDelay: `${card.delay}ms`,
                }}
                onMouseMove={hook.onMouseMove}
                onMouseLeave={hook.onMouseLeave}
              >
                <svg className="ico" viewBox="0 0 24 24" aria-hidden="true">
                  <use href={`#ic-${card.icon}`} />
                </svg>
                <span className="hero-3d-card-name">{card.name}</span>
                <span className="hero-3d-card-cat">{card.cat}</span>
              </div>
            );
          })}
        </div>
      )}

      <div className="hero-inner">
        <div className="hero-mark" data-hero-step="1">
          <span className="hero-mark-line" aria-hidden="true" />
          <span className="eyebrow-mono">AVEXORA / UTILITIES</span>
          <span className="hero-mark-line" aria-hidden="true" />
        </div>

        <h1 className="hero-title" id="hero-title" data-hero-step="2">
          <span className="mask">
            <span className="mask-in">Tools for</span>
          </span>
          <span className="mask">
            <span className="mask-in">
              <em>getting things</em> done.
            </span>
          </span>
        </h1>

        <p className="hero-lede" data-hero-step="3">
          Simple utilities for work, code, finance, creativity and everyday life.
          Everything runs locally in your browser — nothing to install, nothing to upload.
        </p>

        <div className="hero-search" data-hero-step="4">
          <div className="field" id="heroField" onClick={onOpenSearch}>
            <svg className="field-ico" viewBox="0 0 24 24" aria-hidden="true">
              <use href="#ic-search" />
            </svg>
            <input
              id="toolSearch"
              type="text"
              readOnly
              aria-label="Search tools"
              placeholder="Search 130+ tools…"
              className="cursor-pointer"
            />
            <kbd className="field-kbd" aria-hidden="true">⌘K</kbd>
          </div>
        </div>

        <dl className="hero-meta" data-hero-step="5">
          <div className="hero-meta-cell">
            <dt>Tools</dt>
            <dd>130+</dd>
          </div>
          <div className="hero-meta-cell">
            <dt>Runtime</dt>
            <dd>In-browser</dd>
          </div>
          <div className="hero-meta-cell">
            <dt>Install</dt>
            <dd>None</dd>
          </div>
          <div className="hero-meta-cell">
            <dt>Uploads</dt>
            <dd>Zero</dd>
          </div>
        </dl>
      </div>

      {/* Floating product UI card */}
      <aside className="hero-card" data-hero-step="6" aria-hidden="true">
        <div className="hero-card-bar">
          <span className="mono">json-formatter</span>
          <span className="pill-dot" data-pill />
        </div>
        <pre className="hero-card-code">
          <span className="t-key">&quot;tool&quot;</span>: <span className="t-str">&quot;Avexora&quot;</span>,{"\n"}
          <span className="t-key">&quot;state&quot;</span>: <span className="t-str">&quot;ready&quot;</span>,{"\n"}
          <span className="t-key">&quot;tools&quot;</span>: <span className="t-num">130</span>
        </pre>
        <div className="hero-card-foot">
          <span className="mono t-mut">0.4 ms</span>
          <span className="hero-card-btn" data-pill>Format</span>
        </div>
      </aside>

      <div className="hero-cue" aria-hidden="true">
        <span className="eyebrow-mono">Scroll</span>
        <span className="hero-cue-rail">
          <i data-cue />
        </span>
      </div>
    </section>
  );
}
