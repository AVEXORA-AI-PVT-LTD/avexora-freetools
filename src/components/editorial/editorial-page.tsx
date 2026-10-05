"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { NavAccount } from "@/components/account/nav-account";
import { initEditorialRuntime } from "./editorial-runtime";

export function EditorialHomePage() {
  useEffect(() => {
    const cleanup = initEditorialRuntime();
    return () => {
      cleanup();
    };
  }, []);

  const openAuth = () => {
    const modal = document.querySelector("#authModal") as any;
    if (modal && modal.__open) modal.__open();
  };

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      {/* ============================================================
           NAVIGATION
           ============================================================ */}
      <header className="nav" id="nav" role="banner">
        <div className="nav-inner">
          <Link className="nav-brand" href="/" aria-label="Avexora Tools home">
            <Image
              src="/logo.png"
              alt="Avexora"
              width={220}
              height={52}
              className="h-7.5 sm:h-8.5 w-auto max-w-[175px] object-contain dark:brightness-110"
              priority
            />
          </Link>

          <div className="nav-right">
            <button
              className="theme-toggle"
              type="button"
              data-theme-toggle
              aria-pressed="false"
              aria-label="Switch to dark mode"
              title="Toggle theme"
            >
              <svg className="ico ico--sun" viewBox="0 0 24 24" aria-hidden="true">
                <use href="#ic-sun" />
              </svg>
              <svg className="ico ico--moon" viewBox="0 0 24 24" aria-hidden="true">
                <use href="#ic-moon" />
              </svg>
            </button>

            <NavAccount onOpenAuth={openAuth} />
          </div>
        </div>

        <div className="mobile-menu" id="mobileMenu" hidden>
          <div className="mobile-menu-theme" role="group" aria-label="Appearance">
            <button className="footer-theme" type="button" data-theme-set="light" aria-pressed="true">
              <i className="theme-dot" aria-hidden="true" />
              Light
            </button>
            <button className="footer-theme" type="button" data-theme-set="dark" aria-pressed="false">
              <i className="theme-dot" aria-hidden="true" />
              Dark
            </button>
          </div>
          <button className="btn btn-primary" type="button" onClick={openAuth}>
            Log in / Sign in
          </button>
        </div>
      </header>

      <main id="main">
        <span id="top" />

        {/* ============================================================
             HERO — editorial, oversized type, one clear action
             ============================================================ */}
        <section className="hero" id="hero" aria-labelledby="hero-title">
          <div className="hero-grid" aria-hidden="true" />

          {/* Depth layer */}
          <div className="hero-3d d3-scene" aria-hidden="true">
            <div className="hero-3d-card d3" data-float="a">
              <svg className="ico" viewBox="0 0 24 24" aria-hidden="true">
                <use href="#ic-json" />
              </svg>
              JSON Formatter
            </div>
            <div className="hero-3d-card d3" data-float="b">
              <svg className="ico" viewBox="0 0 24 24" aria-hidden="true">
                <use href="#ic-image" />
              </svg>
              Image Compressor
            </div>
            <div className="hero-3d-card d3" data-float="c">
              <svg className="ico" viewBox="0 0 24 24" aria-hidden="true">
                <use href="#ic-rupee" />
              </svg>
              EMI Calculator
            </div>
            <div className="hero-3d-card d3" data-float="d">
              <svg className="ico" viewBox="0 0 24 24" aria-hidden="true">
                <use href="#ic-shield" />
              </svg>
              Runs locally
            </div>
          </div>

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
              Simple utilities for work, code, finance, creativity and everyday life. Everything runs locally in your
              browser — nothing to install, nothing to upload.
            </p>

            <div className="hero-search" data-hero-step="4">
              <div className="field" id="heroField">
                <svg className="field-ico" viewBox="0 0 24 24" aria-hidden="true">
                  <use href="#ic-search" />
                </svg>
                <input
                  id="toolSearch"
                  type="text"
                  role="combobox"
                  aria-expanded="false"
                  aria-controls="searchList"
                  aria-autocomplete="list"
                  aria-describedby="searchHint"
                  aria-label="Search tools"
                  placeholder="Search 130+ tools…"
                  autoComplete="off"
                  spellCheck="false"
                />
                <kbd className="field-kbd" aria-hidden="true">
                  ⌘K
                </kbd>

                <div className="field-panel" id="searchPanel" hidden>
                  <div className="field-panel-head">
                    <span className="eyebrow-mono" id="searchPanelLabel">
                      Popular
                    </span>
                    <span className="field-panel-count" id="searchCount" role="status" aria-live="polite" />
                  </div>
                  <ul className="field-list" id="searchList" role="listbox" aria-labelledby="searchPanelLabel" />
                  <div className="field-panel-foot" id="searchHint">
                    <span>
                      <kbd>↑</kbd>
                      <kbd>↓</kbd> to navigate
                    </span>
                    <span>
                      <kbd>↵</kbd> to open
                    </span>
                    <span>
                      <kbd>esc</kbd> to close
                    </span>
                  </div>
                </div>
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

          {/* Product UI preview */}
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
              <span className="hero-card-btn" data-pill>
                Format
              </span>
            </div>
          </aside>

          <div className="hero-cue" aria-hidden="true">
            <span className="eyebrow-mono">Scroll</span>
            <span className="hero-cue-rail">
              <i data-cue />
            </span>
          </div>
        </section>

        {/* ============================================================
             SCROLL TRANSFORMATION
             ============================================================ */}
        <section className="transform" id="transform" aria-labelledby="transform-title">
          <div className="transform-stage">
            <div className="transform-head">
              <span className="eyebrow-mono">01 / HOW IT WORKS</span>
              <div className="transform-titles">
                <h2 className="transform-title" id="transform-title" data-title="a">
                  Tools for everything.
                </h2>
                <h2 className="transform-title" id="transform-title-b" data-title="b" aria-hidden="true">
                  Find exactly what you need.
                </h2>
              </div>
              <div className="transform-field" aria-hidden="true">
                <svg className="field-ico" viewBox="0 0 24 24">
                  <use href="#ic-search" />
                </svg>
                <span>Search for a tool…</span>
                <kbd className="field-kbd">⌘K</kbd>
              </div>
            </div>

            {/* Layered chips */}
            <div className="transform-layers" id="transformLayers" aria-hidden="true" />

            {/* The surface they collapse into */}
            <div className="transform-surface" id="transformSurface" aria-hidden="true">
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
                <span className="surface-btn" data-pill>
                  Format JSON
                </span>
                <span className="mono t-mut">json</span>
              </div>
            </div>

            {/* Category row */}
            <div className="transform-tabs" id="transformTabs" aria-hidden="true" />

            <div className="transform-rail" aria-hidden="true">
              <div className="transform-rail-track">
                <i data-rail-fill />
              </div>
              <ol className="transform-steps">
                <li data-step="0">
                  <span className="mono">01</span> Scatter
                </li>
                <li data-step="1">
                  <span className="mono">02</span> Collect
                </li>
                <li data-step="2">
                  <span className="mono">03</span> Surface
                </li>
                <li data-step="3">
                  <span className="mono">04</span> Filter
                </li>
              </ol>
            </div>
          </div>
        </section>

        {/* ============================================================
             ASSEMBLY — four tools converge on one workspace
             ============================================================ */}
        <section className="assembly" id="assembly" aria-labelledby="assembly-title">
          <div className="section-head is-split">
            <div>
              <span className="eyebrow-mono">02 / ONE WORKSPACE</span>
              <h2 className="section-title" id="assembly-title">
                <span className="mask">
                  <span className="mask-in">Different tools.</span>
                </span>
                <span className="mask">
                  <span className="mask-in">
                    <em>One workspace.</em>
                  </span>
                </span>
              </h2>
            </div>
            <p className="section-lede">
              Every tool opens the same way — the workspace stays exactly where it is and the tool changes around it. No
              new tab, nothing to re-learn.
            </p>
          </div>

          <div className="assembly-stage d3-stage d3-scene" data-3d="assembly">
            <div className="assembly-main d3 d3-edge" data-3d-card="main">
              <div className="assembly-chrome">
                <i className="dot" />
                <i className="dot" />
                <i className="dot" />
                <span className="mono t-mut" style={{ marginLeft: "auto" }}>
                  tools.avexora.in/json-formatter
                </span>
              </div>
              <div className="assembly-body">
                <div>
                  <div className="assembly-pane-label">Input</div>
                  <pre className="assembly-code">
                    <span className="t-key">&quot;tool&quot;</span><span className="t-op">:</span> <span className="t-str">&quot;Avexora&quot;</span><span className="t-comma">,</span>{"\n"}
                    {"  "}<span className="t-key">&quot;state&quot;</span><span className="t-op">:</span> <span className="t-str">&quot;ready&quot;</span><span className="t-comma">,</span>{"\n"}
                    {"  "}<span className="t-key">&quot;tools&quot;</span><span className="t-op">:</span> <span className="t-num">130</span>
                  </pre>
                </div>
                <div>
                  <div className="assembly-pane-label">Result</div>
                  <pre className="assembly-code">
                    <span className="t-ok">valid</span> · <span className="t-mut">0.4 ms</span>{"\n"}
                    {"  "}<span className="t-mut">formatted</span>{"\n"}
                    {"  "}<span className="t-mut">local only</span>
                  </pre>
                </div>
              </div>
              <div className="assembly-foot">
                <span className="surface-btn" data-pill>
                  Format JSON
                </span>
                <span className="mono t-mut">nothing uploaded</span>
              </div>
            </div>

            <div className="assembly-side d3 d3-edge tilt" data-3d-card="lt" data-slot="lt">
              <svg className="ico" viewBox="0 0 24 24" aria-hidden="true">
                <use href="#ic-image" />
              </svg>
              <span>
                Image Compressor<small>Shrink files, keep quality</small>
              </span>
            </div>
            <div className="assembly-side d3 d3-edge tilt" data-3d-card="rt" data-slot="rt">
              <svg className="ico" viewBox="0 0 24 24" aria-hidden="true">
                <use href="#ic-rupee" />
              </svg>
              <span>
                EMI Calculator<small>Instalments and interest</small>
              </span>
            </div>
            <div className="assembly-side d3 d3-edge tilt" data-3d-card="lb" data-slot="lb">
              <svg className="ico" viewBox="0 0 24 24" aria-hidden="true">
                <use href="#ic-pdf" />
              </svg>
              <span>
                Merge PDF<small>Combine documents</small>
              </span>
            </div>
            <div className="assembly-side d3 d3-edge tilt" data-3d-card="rb" data-slot="rb">
              <svg className="ico" viewBox="0 0 24 24" aria-hidden="true">
                <use href="#ic-chart" />
              </svg>
              <span>
                UTM Builder<small>Tagged campaign links</small>
              </span>
            </div>
          </div>
        </section>

        {/* ============================================================
             STICKY PRODUCT STORY
             ============================================================ */}
        <section className="story" id="story" aria-labelledby="story-title">
          <div className="story-inner">
            <div className="story-copy">
              <span className="eyebrow-mono">03 / THE WORKFLOW</span>
              <h2 className="story-title" id="story-title">
                <span className="mask">
                  <span className="mask-in">One place.</span>
                </span>
                <span className="mask">
                  <span className="mask-in">
                    <em>Many</em> possibilities.
                  </span>
                </span>
              </h2>
              <p className="story-lede">
                Every tool shares the same shape — find it, open it, use it, get the result. That consistency is the
                product.
              </p>

              <ol className="story-steps" id="storySteps">
                <li data-step="1">
                  <span className="story-step-idx mono">01</span>
                  <span className="story-step-name">Search</span>
                  <span className="story-step-note">Type two letters</span>
                </li>
                <li data-step="2">
                  <span className="story-step-idx mono">02</span>
                  <span className="story-step-name">Discover</span>
                  <span className="story-step-note">Scan what exists</span>
                </li>
                <li data-step="3">
                  <span className="story-step-idx mono">03</span>
                  <span className="story-step-name">Open</span>
                  <span className="story-step-note">One clear entry</span>
                </li>
                <li data-step="4">
                  <span className="story-step-idx mono">04</span>
                  <span className="story-step-name">Use</span>
                  <span className="story-step-note">Input in, output out</span>
                </li>
                <li data-step="5">
                  <span className="story-step-idx mono">05</span>
                  <span className="story-step-name">Done</span>
                  <span className="story-step-note">Copy and carry on</span>
                </li>
              </ol>

              <div className="story-rail" aria-hidden="true">
                <i data-story-fill />
              </div>
            </div>

            <div className="story-stage" id="storyStage" aria-hidden="true">
              <div className="story-pin">
                <div className="story-state" data-state="1">
                  <div className="mini">
                    <div className="mini-field">
                      <svg className="field-ico" viewBox="0 0 24 24">
                        <use href="#ic-search" />
                      </svg>
                      <span className="mini-typed" data-typed />
                      <i className="caret" />
                    </div>
                    <div className="mini-hint mono">⌘K from anywhere</div>
                  </div>
                </div>

                <div className="story-state" data-state="2">
                  <div className="mini">
                    <div className="mini-head">
                      <span className="eyebrow-mono">12 results</span>
                      <span className="mono t-mut">0.06 ms</span>
                    </div>
                    <ul className="mini-rows" id="storyRows" />
                  </div>
                </div>

                <div className="story-state" data-state="3">
                  <article className="tool-detail" id="storyDetail" />
                </div>

                <div className="story-state" data-state="4">
                  <div className="mini ws-mount" id="story-ws" data-mount="story-ws" />
                </div>

                <div className="story-state" data-state="5">
                  <div className="result">
                    <div className="result-head">
                      <span className="badge badge-ok">
                        <svg className="ico" viewBox="0 0 24 24" aria-hidden="true">
                          <use href="#ic-check" />
                        </svg>
                        Valid
                      </span>
                      <span className="mono t-mut">0.4 ms</span>
                    </div>
                    <pre className="result-code" id="storyResult" />
                    <div className="result-foot">
                      <span className="result-btn" data-pill>
                        <svg className="ico" viewBox="0 0 24 24" aria-hidden="true">
                          <use href="#ic-copy" />
                        </svg>
                        Copy result
                      </span>
                      <span className="mono t-mut">2.1 kB</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================
             TOOL STACK
             ============================================================ */}
        <section className="stack" id="stack" aria-labelledby="stack-title">
          <div className="section-head is-split">
            <div>
              <span className="eyebrow-mono">04 / THE STACK</span>
              <h2 className="section-title" id="stack-title">
                <span className="mask">
                  <span className="mask-in">Six tools,</span>
                </span>
                <span className="mask">
                  <span className="mask-in">
                    <em>one shape.</em>
                  </span>
                </span>
              </h2>
            </div>
            <p className="section-lede">
              A shared core — same input, same output, same keyboard. Once you know one Avexora tool, you already know
              the other hundred and thirty.
            </p>
          </div>

          <div className="stack-stage d3-stage d3-scene" data-3d="stack">
            <a className="stack-card d3 d3-edge tilt" href="#tool/json-formatter" data-3d-card="0">
              <span className="stack-ico">
                <svg className="ico" viewBox="0 0 24 24" aria-hidden="true">
                  <use href="#ic-json" />
                </svg>
              </span>
              <span className="stack-name">JSON Formatter</span>
              <span className="stack-meta">Format · Validate · Minify</span>
            </a>
            <a className="stack-card d3 d3-edge tilt" href="#tool/image-compressor" data-3d-card="1">
              <span className="stack-ico">
                <svg className="ico" viewBox="0 0 24 24" aria-hidden="true">
                  <use href="#ic-image" />
                </svg>
              </span>
              <span className="stack-name">Image Compressor</span>
              <span className="stack-meta">Shrink without visible loss</span>
            </a>
            <a className="stack-card d3 d3-edge tilt" href="#tool/merge-pdf" data-3d-card="2">
              <span className="stack-ico">
                <svg className="ico" viewBox="0 0 24 24" aria-hidden="true">
                  <use href="#ic-pdf" />
                </svg>
              </span>
              <span className="stack-name">Merge PDF</span>
              <span className="stack-meta">Combine and reorder</span>
            </a>
            <a className="stack-card d3 d3-edge tilt" href="#tool/emi-calculator" data-3d-card="3">
              <span className="stack-ico">
                <svg className="ico" viewBox="0 0 24 24" aria-hidden="true">
                  <use href="#ic-rupee" />
                </svg>
              </span>
              <span className="stack-name">EMI Calculator</span>
              <span className="stack-meta">Schedule and total</span>
            </a>
            <a className="stack-card d3 d3-edge tilt" href="#tool/utm-builder" data-3d-card="4">
              <span className="stack-ico">
                <svg className="ico" viewBox="0 0 24 24" aria-hidden="true">
                  <use href="#ic-link" />
                </svg>
              </span>
              <span className="stack-name">UTM Builder</span>
              <span className="stack-meta">Tagged links in one field</span>
            </a>
            <a className="stack-card d3 d3-edge tilt" href="#tool/word-counter" data-3d-card="5">
              <span className="stack-ico">
                <svg className="ico" viewBox="0 0 24 24" aria-hidden="true">
                  <use href="#ic-text" />
                </svg>
              </span>
              <span className="stack-name">Word Counter</span>
              <span className="stack-meta">Words, characters, reading time</span>
            </a>
          </div>
        </section>

        {/* ============================================================
             CATEGORIES
             ============================================================ */}
        <section className="categories" id="categories" aria-labelledby="cat-title">
          <div className="section-head">
            <span className="eyebrow-mono">05 / CATEGORIES</span>
            <h2 className="section-title" id="cat-title">
              <span className="mask">
                <span className="mask-in">Everything you need.</span>
              </span>
              <span className="mask">
                <span className="mask-in">
                  <em>Organised.</em>
                </span>
              </span>
            </h2>
            <p className="section-lede">
              Nine categories, one shared interface. Pick a lane and everything inside it behaves the same way.
            </p>
          </div>

          <ol className="cat-grid" id="catGrid" />
        </section>

        {/* ============================================================
             TOOLS
             ============================================================ */}
        <section className="tools" id="tools" aria-labelledby="tools-title">
          <div className="section-head is-split">
            <div>
              <span className="eyebrow-mono">06 / TOOLS</span>
              <h2 className="section-title" id="tools-title">
                <span className="mask">
                  <span className="mask-in">Useful,</span>
                </span>
                <span className="mask">
                  <span className="mask-in">
                    <em>not</em> overwhelming.
                  </span>
                </span>
              </h2>
            </div>
            <p className="section-lede">
              The eight most-opened tools on Avexora. Each opens into the same focused workspace — nothing else on the
              page.
            </p>
          </div>

          <div className="tool-grid" id="toolGrid" />
        </section>

        {/* ============================================================
             SHOWCASE — the product, floating slightly above the page
             ============================================================ */}
        <section className="showcase" id="showcase" aria-labelledby="showcase-title">
          <div className="showcase-head">
            <span className="eyebrow-mono">07 / PRODUCT</span>
            <h2 className="section-title" id="showcase-title">
              A workspace that stays out of the way.
            </h2>
            <p className="section-lede">Two panes, one primary action, and a status you can trust. Try it — this one is real.</p>
          </div>

          <div className="showcase-stage">
            <div className="showcase-float showcase-float-a" aria-hidden="true">
              <span className="mono t-mut">input</span>
              <span className="float-chip" data-pill>
                Format JSON
              </span>
            </div>
            <div className="showcase-float showcase-float-b" aria-hidden="true">
              <span className="mono t-mut">result</span>
              <span className="float-row">
                <i className="dot dot-ok" />
                <span className="mono">valid · 0.4 ms</span>
              </span>
            </div>

            <div className="ws-mount showcase-ws" id="showcase-ws" data-mount="showcase-ws" />
          </div>
        </section>

        {/* ============================================================
             ABOUT
             ============================================================ */}
        <section className="about" id="about" aria-labelledby="about-title">
          <div className="about-grid">
            <div className="about-label">
              <span className="eyebrow-mono">08 / ABOUT</span>
              <h2 className="section-title" id="about-title">
                Private by default.
              </h2>
            </div>
            <div className="about-body">
              <p className="about-lead">
                Avexora is a shelf of small, sharp utilities. Not a platform, not a suite — a toolbox you open when a
                five-minute job turns into an hour.
              </p>
              <ul className="about-list">
                <li>
                  <svg className="ico" viewBox="0 0 24 24" aria-hidden="true">
                    <use href="#ic-shield" />
                  </svg>
                  <span>
                    <strong>Runs locally.</strong> Parsing, hashing, maths and rendering happen in this tab. Your files
                    never leave the device.
                  </span>
                </li>
                <li>
                  <svg className="ico" viewBox="0 0 24 24" aria-hidden="true">
                    <use href="#ic-bolt" />
                  </svg>
                  <span>
                    <strong>No install.</strong> No account required to start. Open a tool, use it, close the tab.
                  </span>
                </li>
                <li>
                  <svg className="ico" viewBox="0 0 24 24" aria-hidden="true">
                    <use href="#ic-layers" />
                  </svg>
                  <span>
                    <strong>One pattern.</strong> 130+ tools, a single interface. Once you learn one, you know them all.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* ============================================================
             CTA
             ============================================================ */}
        <section className="cta" aria-labelledby="cta-title">
          <div className="cta-inner">
            <h2 className="cta-title" id="cta-title">
              <span className="mask">
                <span className="mask-in">Start with</span>
              </span>
              <span className="mask">
                <span className="mask-in">
                  <em>one tool.</em>
                </span>
              </span>
            </h2>
            <p className="cta-lede">Free while in beta. No card, no sales call, no onboarding call you didn&apos;t ask for.</p>
            <div className="cta-actions">
              <button className="btn btn-primary btn-lg" type="button" data-auth="login">
                Sign in with Email
              </button>
              <button className="btn btn-secondary btn-lg" type="button" data-focus-search>
                Browse all tools
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* ============================================================
           FOOTER
           ============================================================ */}
      <footer className="footer" role="contentinfo">
        <div className="footer-top">
          <div className="footer-brand">
            <Link href="/" className="inline-flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="Avexora"
                width={112}
                height={28}
                className="h-7 w-auto object-contain dark:brightness-110"
              />
            </Link>
            <p className="footer-tag">Tools that get out of your way.</p>
          </div>
          <nav className="footer-links" aria-label="Footer">
            <div>
              <span className="eyebrow-mono">Product</span>
              <a href="#tools">All tools</a>
              <a href="#categories">Categories</a>
              <a href="#showcase">Product tour</a>
            </div>
            <div>
              <span className="eyebrow-mono">Company</span>
              <a href="#about">About</a>
              <a href="#about">Privacy</a>
              <a href="#about">Changelog</a>
            </div>
            <div>
              <span className="eyebrow-mono">Appearance</span>
              <button className="footer-theme" type="button" data-theme-set="light" aria-pressed="true">
                <i className="theme-dot" aria-hidden="true" />
                Light
              </button>
              <button className="footer-theme" type="button" data-theme-set="dark" aria-pressed="false">
                <i className="theme-dot" aria-hidden="true" />
                Dark
              </button>
            </div>
          </nav>
        </div>
        <div className="footer-bottom">
          <span className="mono t-mut">© 2026 Avexora Tools</span>
          <span className="mono t-mut">Runs entirely in your browser</span>
        </div>
      </footer>

      {/* ============================================================
           AUTH MODAL (Magic Link + Google OAuth)
           ============================================================ */}
      <div className="modal" id="authModal" hidden>
        <div className="modal-scrim" data-close-auth />
        <div className="auth" role="dialog" aria-modal="true" aria-labelledby="authTitle" aria-describedby="authCopy">
          <button className="icon-btn auth-close" type="button" aria-label="Close" data-close-auth>
            <svg className="ico" viewBox="0 0 24 24" aria-hidden="true">
              <use href="#ic-x" />
            </svg>
          </button>

          <span className="eyebrow-mono" id="authKicker">
            Avexora account
          </span>
          <h2 className="auth-title" id="authTitle">
            Sign in to Avexora
          </h2>
          <p className="auth-copy" id="authCopy">
            One account for Avexora Tools and Brand Studio. We&apos;ll email you a secure sign-in link.
          </p>

          <div
            id="authSuccess"
            className="rounded-md border border-emerald-500/20 bg-emerald-500/10 p-3.5 text-xs text-emerald-600 dark:text-emerald-400 mb-4"
            role="status"
            hidden
          />

          <form className="auth-form" id="authForm" noValidate>
            <label className="field-label" htmlFor="authEmail">
              Email
            </label>
            <input
              className="auth-input"
              id="authEmail"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              required
            />

            <p className="auth-error" id="authError" role="alert" hidden />

            <button className="btn btn-primary btn-lg auth-submit" type="submit" id="authSubmit">
              Send Magic Link
            </button>
          </form>

          <div className="auth-rule" aria-hidden="true">
            <span className="mono">or</span>
          </div>

          <button className="btn btn-secondary auth-google" type="button" id="googleAuth">
            <svg className="ico" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.7v3h3.9c2.3-2.1 3.5-5.2 3.5-8.9z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3a7.2 7.2 0 0 1-10.7-3.8h-4v3.1A12 12 0 0 0 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.3 14.3a7.1 7.1 0 0 1 0-4.6v-3h-4a12 12 0 0 0 0 10.7l4-3.1z"
              />
              <path
                fill="#EA4335"
                d="M12 4.8c1.8 0 3.4.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1A7.2 7.2 0 0 1 12 4.8z"
              />
            </svg>
            Continue with Google
          </button>
        </div>
      </div>

      {/* ============================================================
           TOOL PAGE — routed at #tool/<slug>
           ============================================================ */}
      <section className="toolpage" id="toolPage" hidden aria-labelledby="toolTitle">
        <div className="toolpage-inner">
          <nav className="crumbs" aria-label="Breadcrumb">
            <a href="#tools" data-exit-tool>
              Tools
            </a>
            <span aria-hidden="true">/</span>
            <a href="#tools" data-exit-tool data-crumb-cat>
              Developer &amp; Web
            </a>
            <span aria-hidden="true">/</span>
            <span className="crumbs-here" data-crumb-name>
              JSON Formatter
            </span>
          </nav>

          <header className="toolpage-head">
            <div className="toolpage-heading">
              <div className="toolpage-cat">
                <svg className="ico" viewBox="0 0 24 24" aria-hidden="true">
                  <use href="#ic-json" data-tool-icon-use="" />
                </svg>
                <span className="eyebrow-mono" data-tool-cat>
                  Developer &amp; Web
                </span>
              </div>
              <h1 className="toolpage-title" id="toolTitle">
                JSON Formatter
              </h1>
              <p className="toolpage-desc" data-tool-desc>
                Format and validate JSON instantly.
              </p>
            </div>
            <button className="btn btn-secondary btn-sm toolpage-back" type="button" data-exit-tool>
              <svg className="ico" viewBox="0 0 24 24" aria-hidden="true">
                <use href="#ic-arrow-left" />
              </svg>
              All tools
            </button>
          </header>

          <div className="toolpage-work" data-tool-work>
            <div className="ws-mount" id="tool-ws" data-mount="tool-ws" />
          </div>

          <div className="toolpage-soon" data-tool-soon hidden>
            <div className="toolpage-soon-mark" aria-hidden="true">
              <svg className="ico" viewBox="0 0 24 24">
                <use href="#ic-json" data-soon-icon="" />
              </svg>
            </div>
            <h2>This tool is on the roadmap</h2>
            <p>
              It is listed so you can find it, but the workspace is not built in this demo yet. The JSON Formatter is
              fully working — try that one.
            </p>
            <div className="toolpage-soon-actions">
              <button className="btn btn-primary btn-sm" type="button" data-exit-tool>
                Back to tools
              </button>
              <button className="btn btn-secondary btn-sm" type="button" data-open-tool="json-formatter">
                Open JSON Formatter
              </button>
            </div>
          </div>

          <div className="toolpage-meta">
            <div className="toolpage-about">
              <h2>About this tool</h2>
              <p data-tool-about>
                Parses, validates, formats and minifies JSON entirely in the browser. Nothing is uploaded, and the page
                keeps working offline once loaded.
              </p>
              <ul className="toolpage-feats">
                <li>Syntax highlighting with real error messages</li>
                <li>Format, minify or pretty-print</li>
                <li>Copy to clipboard in one click</li>
                <li>Works offline after the first load</li>
              </ul>
            </div>
            <aside className="toolpage-side">
              <div className="side-block">
                <span className="eyebrow-mono">Details</span>
                <dl className="side-dl">
                  <div>
                    <dt>Category</dt>
                    <dd data-tool-cat>Developer &amp; Web</dd>
                  </div>
                  <div>
                    <dt>Runs on</dt>
                    <dd>Browser (WebAssembly-free)</dd>
                  </div>
                  <div>
                    <dt>Uploads data</dt>
                    <dd>No</dd>
                  </div>
                  <div>
                    <dt>Sign-in</dt>
                    <dd>Not required</dd>
                  </div>
                </dl>
              </div>
              <div className="side-block">
                <span className="eyebrow-mono">Related</span>
                <ul className="side-list" id="relatedTools" />
              </div>
            </aside>
          </div>
        </div>
      </section>

      <div className="sr-only" role="status" aria-live="polite" id="liveRegion" />
    </>
  );
}
