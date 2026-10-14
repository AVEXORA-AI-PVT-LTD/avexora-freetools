"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { JsonWorkspace } from "./json-workspace";
import { useReducedMotion, useIsTouchDevice, useIsSmallScreen } from "./use-depth-motion";

const CHIPS = [
  { icon: "json", name: "JSON", cat: "Developer", sx: -36, sy: -26, dx: -15, dy: -7, lead: true },
  { icon: "image", name: "IMAGE", cat: "Image", sx: 32, sy: -30, dx: 15, dy: -7 },
  { icon: "rupee", name: "EMI", cat: "Finance", sx: -32, sy: 22, dx: -14, dy: 9 },
  { icon: "pdf", name: "PDF", cat: "PDF", sx: 36, sy: 24, dx: 16, dy: 9 },
  { icon: "qr", name: "QR", cat: "Developer", sx: -7, sy: -40, dx: -3, dy: -13 },
  { icon: "text", name: "WORD", cat: "Text", sx: -44, sy: 2, dx: -22, dy: 2 },
  { icon: "chart", name: "SEO", cat: "Marketing", sx: 28, sy: 2, dx: 22, dy: 2 },
  { icon: "percent", name: "GST", cat: "Finance", sx: 2, sy: 36, dx: 2, dy: 19 },
];

const STORY_STEPS = [
  { idx: "01", name: "Search", note: "Type two letters" },
  { idx: "02", name: "Discover", note: "Scan what exists" },
  { idx: "03", name: "Open", note: "One clear entry" },
  { idx: "04", name: "Use", note: "Input in, output out" },
  { idx: "05", name: "Done", note: "Copy and carry on" },
];

const STACK_CARDS = [
  { icon: "json", name: "JSON Formatter", meta: "Format · Validate · Minify", slug: "json-formatter" },
  { icon: "image", name: "Image Compressor", meta: "Shrink without visible loss", slug: "image-compressor" },
  { icon: "pdf", name: "Merge PDF", meta: "Combine and reorder", slug: "merge-pdf" },
  { icon: "rupee", name: "EMI Calculator", meta: "Schedule and total", slug: "emi-calculator" },
  { icon: "link", name: "UTM Builder", meta: "Tagged links in one field", slug: "utm-builder" },
  { icon: "text", name: "Word Counter", meta: "Words, characters, reading time", slug: "word-counter" },
];

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function ScrollNarrative() {
  const reducedMotion = useReducedMotion();
  const isTouch = useIsTouchDevice();
  const isSmall = useIsSmallScreen(1024);
  const depthDisabled = reducedMotion || isTouch || isSmall;

  const transformRef = useRef<HTMLElement>(null);
  const storyRef = useRef<HTMLElement>(null);
  const stackRef = useRef<HTMLElement>(null);
  const assemblyRef = useRef<HTMLElement>(null);

  const [activeStoryStep, setActiveStoryStep] = useState(0);
  const [transformProgress, setTransformProgress] = useState(0);
  const [stackProgress, setStackProgress] = useState(0);
  const [assemblyProgress, setAssemblyProgress] = useState(0);
  const [mounted, setMounted] = useState(false);

  const rafRef = useRef<number>(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleScroll = useCallback(() => {
    if (!mounted || rafRef.current) return;

    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;

      if (transformRef.current) {
        const rect = transformRef.current.getBoundingClientRect();
        const height = transformRef.current.offsetHeight - window.innerHeight;
        if (height > 0) {
          const p = clamp(-rect.top / height, 0, 1);
          setTransformProgress(p);
        }
      }

      if (storyRef.current) {
        const rect = storyRef.current.getBoundingClientRect();
        const height = storyRef.current.offsetHeight - window.innerHeight;
        if (height > 0) {
          const p = clamp(-rect.top / height, 0, 1);
          const stepIndex = Math.min(4, Math.floor(p * 5));
          setActiveStoryStep(stepIndex);
        }
      }

      if (stackRef.current) {
        const rect = stackRef.current.getBoundingClientRect();
        const height = stackRef.current.offsetHeight - window.innerHeight;
        if (height > 0) {
          const p = clamp(-rect.top / height, 0, 1);
          setStackProgress(p);
        }
      }

      if (assemblyRef.current) {
        const rect = assemblyRef.current.getBoundingClientRect();
        const height = assemblyRef.current.offsetHeight - window.innerHeight;
        if (height > 0) {
          const p = clamp(-rect.top / height, 0, 1);
          setAssemblyProgress(p);
        }
      }
    });
  }, [mounted]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [handleScroll]);

  const getChipStyle = (index: number) => {
    const chip = CHIPS[index];
    if (!mounted) {
      return {
        transform: `translate3d(${chip.sx}%, ${chip.sy}%, 0px) scale(1)`,
        opacity: 0,
      };
    }
    const progress = easeOutCubic(clamp(transformProgress * 1.4, 0, 1));
    const scatterX = chip.sx * (1 - progress);
    const scatterY = chip.sy * (1 - progress);
    const convergeX = chip.dx * progress;
    const convergeY = chip.dy * progress;
    const opacity = transformProgress < 0.05 ? 0 : Math.min(1, transformProgress * 3);
    const scale = 1 - progress * 0.3;
    const translateZ = (1 - progress) * -60;

    return {
      transform: `translate3d(${scatterX + convergeX}%, ${scatterY + convergeY}%, ${translateZ}px) scale(${scale})`,
      opacity,
    };
  };

  const getSurfaceStyle = () => {
    if (!mounted) {
      return {
        transform: `translate3d(0%, 10%, 0px) scale(0.92)`,
        opacity: 0,
      };
    }
    const progress = easeOutCubic(clamp(transformProgress * 1.2, 0, 1));
    return {
      transform: `translate3d(0, ${(1 - progress) * 40}px, ${progress * 60}px) scale(${0.92 + progress * 0.08})`,
      opacity: progress,
    };
  };

  const getTabsStyle = () => {
    if (!mounted) {
      return {
        opacity: 0,
        transform: `translate3d(0, 5%, 0)`,
      };
    }
    const progress = easeOutCubic(clamp((transformProgress - 0.4) * 2, 0, 1));
    return {
      opacity: progress,
      transform: `translate3d(0, ${(1 - progress) * 20}px, 0)`,
    };
  };

  const getStackCardStyle = (index: number) => {
    if (!mounted) {
      return {
        transform: `translate3d(0px, 0px, 0px) rotateX(0deg) rotateY(0deg)`,
        opacity: 0,
      };
    }
    const progress = easeOutCubic(clamp(stackProgress * 1.3, 0, 1));
    const angle = (index / STACK_CARDS.length) * Math.PI * 2;
    const radius = 180 * (1 - progress);
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius * 0.6;
    const z = (1 - progress) * 200;
    const rotateX = (1 - progress) * 15;
    const rotateY = (1 - progress) * 20;

    return {
      transform: `translate3d(${x}px, ${y}px, ${z}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
      opacity: progress,
    };
  };

  const getAssemblyCardStyle = (index: number) => {
    if (!mounted) {
      return {
        transform: `translate3d(0px, 0px, 0px) rotateY(0deg)`,
        opacity: 0,
      };
    }
    const progress = easeOutCubic(clamp(assemblyProgress * 1.2, 0, 1));
    const positions = [
      { x: -180, y: -120 },
      { x: 180, y: -120 },
      { x: -180, y: 120 },
      { x: 180, y: 120 },
    ];
    const pos = positions[index];
    const x = pos.x * (1 - progress);
    const y = pos.y * (1 - progress);
    const z = (1 - progress) * 100;
    const rotateY = index % 2 === 0 ? (1 - progress) * 8 : -(1 - progress) * 8;

    return {
      transform: `translate3d(${x}px, ${y}px, ${z}px) rotateY(${rotateY}deg)`,
      opacity: progress,
    };
  };

  return (
    <>
      {/* ============================================================
           01 / HOW IT WORKS — SCROLL TRANSFORMATION CHIPS
           ============================================================ */}
      <section className="transform" id="transform" ref={transformRef} aria-labelledby="transform-title">
        <div className="transform-stage">
          <div className="transform-head">
            <span className="eyebrow-mono">01 / HOW IT WORKS</span>
            <div className="transform-titles">
              <h2 className="transform-title" id="transform-title">
                Tools for everything.
              </h2>
            </div>
          </div>

          <div className="transform-layers">
            {CHIPS.map((c, i) => (
              <div
                key={c.name}
                className={`chip${c.lead ? " is-lead" : ""}`}
                style={getChipStyle(i)}
              >
                <span className="chip-ico">
                  <svg className="ico ico--sm" viewBox="0 0 24 24" aria-hidden="true">
                    <use href={`#ic-${c.icon}`} />
                  </svg>
                </span>
                <div className="chip-name">{c.name}</div>
                <div className="chip-cat">{c.cat}</div>
              </div>
            ))}
          </div>

          <div className="transform-surface" style={getSurfaceStyle()}>
            <div className="surface-chrome">
              <span className="mono">tools.avexora.in/json-formatter</span>
              <span className="mono t-mut">local</span>
            </div>
            <div className="surface-body">
              <div className="surface-pane">
                <span className="eyebrow-mono">Input</span>
                <pre className="surface-code">
                  <span className="t-brace">&#123;</span>{"\n"}
                  {"  "}<span className="t-key">&quot;ready&quot;</span><span className="t-op">:</span> <span className="t-bool">true</span><span className="t-comma">,</span>{"\n"}
                  {"  "}<span className="t-key">&quot;tools&quot;</span><span className="t-op">:</span> <span className="t-num">130</span>{"\n"}
                  <span className="t-brace">&#125;</span>
                </pre>
              </div>
              <div className="surface-pane">
                <span className="eyebrow-mono">Output</span>
                <pre className="surface-code is-out">
                  <span className="t-ok">valid</span> · <span className="t-mut">0.4 ms</span>
                </pre>
              </div>
            </div>
            <div className="surface-foot">
              <span className="surface-btn" data-pill>Format JSON</span>
              <span className="mono t-mut">json</span>
            </div>
          </div>

          <div className="transform-tabs" style={getTabsStyle()}>
            {["Developer", "Finance", "PDF", "Image", "Marketing", "Text"].map((tab) => (
              <span key={tab} className="tab-item">
                {tab}
                <span className="mono">12</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
           02 / ASSEMBLY — WORKSPACE SIDE CARDS CONVERGENCE
           ============================================================ */}
      <section className="assembly" id="assembly" ref={assemblyRef} aria-labelledby="assembly-title">
        <div className="section-head is-split">
          <div>
            <span className="eyebrow-mono">02 / ONE WORKSPACE</span>
            <h2 className="section-title" id="assembly-title">
              <span className="mask"><span className="mask-in">Different tools.</span></span>
              <span className="mask"><span className="mask-in"><em>One workspace.</em></span></span>
            </h2>
          </div>
          <p className="section-lede">
            Every tool opens the same way — the workspace stays exactly where it is and the tool changes around it. No new tab, nothing to re-learn.
          </p>
        </div>

        <div className="assembly-stage d3-stage d3-scene">
          <div className="assembly-main d3 d3-edge">
            <div className="assembly-chrome">
              <i className="dot" /><i className="dot" /><i className="dot" />
              <span className="mono t-mut" style={{ marginLeft: "auto" }}>tools.avexora.in/json-formatter</span>
            </div>
            <div className="assembly-body">
              <div>
                <div className="assembly-pane-label">Input</div>
                <pre className="assembly-code">
                  <span className="t-key">&quot;tool&quot;</span><span className="t-op">:</span> <span className="t-str">&quot;Avexora&quot;</span><span className="t-comma">,</span>{"\n"}
                  <span className="t-key">&quot;state&quot;</span><span className="t-op">:</span> <span className="t-str">&quot;ready&quot;</span><span className="t-comma">,</span>{"\n"}
                  <span className="t-key">&quot;tools&quot;</span><span className="t-op">:</span> <span className="t-num">130</span>
                </pre>
              </div>
              <div>
                <div className="assembly-pane-label">Result</div>
                <pre className="assembly-code">
                  <span className="t-ok">valid</span> · <span className="t-mut">0.4 ms</span>{"\n"}
                  <span className="t-mut">formatted</span>{"\n"}
                  <span className="t-mut">local only</span>
                </pre>
              </div>
            </div>
            <div className="assembly-foot">
              <span className="surface-btn" data-pill>Format JSON</span>
              <span className="mono t-mut">nothing uploaded</span>
            </div>
          </div>

          {!depthDisabled && (
            <>
              <div className="assembly-side d3 d3-edge tilt" data-slot="lt" style={getAssemblyCardStyle(0)}>
                <svg className="ico" viewBox="0 0 24 24" aria-hidden="true"><use href="#ic-image" /></svg>
                <span>Image Compressor<small>Shrink files, keep quality</small></span>
              </div>
              <div className="assembly-side d3 d3-edge tilt" data-slot="rt" style={getAssemblyCardStyle(1)}>
                <svg className="ico" viewBox="0 0 24 24" aria-hidden="true"><use href="#ic-rupee" /></svg>
                <span>EMI Calculator<small>Instalments and interest</small></span>
              </div>
              <div className="assembly-side d3 d3-edge tilt" data-slot="lb" style={getAssemblyCardStyle(2)}>
                <svg className="ico" viewBox="0 0 24 24" aria-hidden="true"><use href="#ic-pdf" /></svg>
                <span>Merge PDF<small>Combine documents</small></span>
              </div>
              <div className="assembly-side d3 d3-edge tilt" data-slot="rb" style={getAssemblyCardStyle(3)}>
                <svg className="ico" viewBox="0 0 24 24" aria-hidden="true"><use href="#ic-chart" /></svg>
                <span>UTM Builder<small>Tagged campaign links</small></span>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ============================================================
           03 / STICKY PRODUCT STORY
           ============================================================ */}
      <section className="story" id="story" ref={storyRef} aria-labelledby="story-title">
        <div className="story-inner">
          <div className="story-copy">
            <span className="eyebrow-mono">03 / THE WORKFLOW</span>
            <h2 className="story-title" id="story-title">
              <span className="mask"><span className="mask-in">One place.</span></span>
              <span className="mask"><span className="mask-in"><em>Many</em> possibilities.</span></span>
            </h2>
            <p className="story-lede">
              Every tool shares the same shape — find it, open it, use it, get the result. That consistency is the product.
            </p>

            <ol className="story-steps">
              {STORY_STEPS.map((s, idx) => (
                <li key={s.idx} className={idx === activeStoryStep ? "is-on" : ""}>
                  <span className="story-step-idx mono">{s.idx}</span>
                  <span className="story-step-name">{s.name}</span>
                  <span className="story-step-note">{s.note}</span>
                </li>
              ))}
            </ol>

            <div className="story-rail" aria-hidden="true">
              <i style={{ transform: `scaleX(${(activeStoryStep + 1) / 5})` }} />
            </div>
          </div>

          <div className="story-stage">
            <div className="story-pin">
              {activeStoryStep === 0 && (
                <div className="story-state is-active">
                  <div className="mini">
                    <div className="mini-field">
                      <svg className="field-ico" viewBox="0 0 24 24"><use href="#ic-search" /></svg>
                      <span className="mini-typed">json</span><i className="caret" />
                    </div>
                    <div className="mini-hint mono">⌘K from anywhere</div>
                  </div>
                </div>
              )}

              {activeStoryStep === 1 && (
                <div className="story-state is-active">
                  <div className="mini">
                    <div className="mini-head">
                      <span className="eyebrow-mono">12 results</span>
                      <span className="mono t-mut">0.06 ms</span>
                    </div>
                    <ul className="mini-rows">
                      <li className="is-sel">
                        <span className="r-ico"><svg className="ico ico--sm" viewBox="0 0 24 24"><use href="#ic-json" /></svg></span>
                        <span className="r-name">JSON Formatter</span>
                        <span className="r-cat">Developer & Web</span>
                      </li>
                      <li className="is-dim">
                        <span className="r-ico"><svg className="ico ico--sm" viewBox="0 0 24 24"><use href="#ic-image" /></svg></span>
                        <span className="r-name">Image Compressor</span>
                        <span className="r-cat">Image Tools</span>
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              {activeStoryStep === 2 && (
                <div className="story-state is-active">
                  <article className="tool-detail">
                    <div className="tool-detail-top">
                      <span className="tool-card-ico"><svg className="ico" viewBox="0 0 24 24"><use href="#ic-json" /></svg></span>
                      <span className="badge">Developer & Web</span>
                    </div>
                    <h3>JSON Formatter</h3>
                    <p>Format and validate JSON instantly.</p>
                    <div className="tool-detail-meta">
                      <span className="mono">Runs locally · No sign-in</span>
                      <span className="tool-detail-cta">
                        Open tool <svg className="ico ico--sm" viewBox="0 0 24 24"><use href="#ic-arrow" /></svg>
                      </span>
                    </div>
                  </article>
                </div>
              )}

              {(activeStoryStep === 3 || activeStoryStep === 4) && (
                <div className="story-state is-active w-full">
                  <JsonWorkspace />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
           04 / THE TOOL STACK
           ============================================================ */}
      <section className="stack" id="stack" ref={stackRef} aria-labelledby="stack-title">
        <div className="section-head is-split">
          <div>
            <span className="eyebrow-mono">04 / THE STACK</span>
            <h2 className="section-title" id="stack-title">
              <span className="mask"><span className="mask-in">Six tools,</span></span>
              <span className="mask"><span className="mask-in"><em>one shape.</em></span></span>
            </h2>
          </div>
          <p className="section-lede">
            A shared core — same input, same output, same keyboard. Once you know one Avexora tool, you already know the other hundred and thirty.
          </p>
        </div>

        <div className="stack-stage d3-stage d3-scene">
          {STACK_CARDS.map((card, i) => (
            <a
              key={card.name}
              className="stack-card d3 d3-edge tilt"
              href={`#tool/${card.slug}`}
              style={getStackCardStyle(i)}
            >
              <span className="stack-ico"><svg className="ico" viewBox="0 0 24 24" aria-hidden="true"><use href={`#ic-${card.icon}`} /></svg></span>
              <span className="stack-name">{card.name}</span>
              <span className="stack-meta">{card.meta}</span>
            </a>
          ))}
        </div>
      </section>
    </>
  );
}
