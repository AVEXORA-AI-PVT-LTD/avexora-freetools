// Avexora Tools — Design 2 Interaction Engine & Runtime
import { signIn } from "next-auth/react";

export function initEditorialRuntime() {
  if (typeof window === "undefined" || typeof document === "undefined") return () => {};

  /* Helpers */
  const $ = <T extends HTMLElement = HTMLElement>(sel: string, ctx: ParentNode = document): T | null =>
    ctx.querySelector(sel);
  const $$ = <T extends HTMLElement = HTMLElement>(sel: string, ctx: ParentNode = document): T[] =>
    Array.from(ctx.querySelectorAll(sel));
  const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
  const smoothstep = (edge0: number, edge1: number, v: number) => {
    const t = clamp((v - edge0) / (edge1 - edge0));
    return t * t * (3 - 2 * t);
  };
  const esc = (str: string) =>
    String(str).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] || c)
    );

  const icon = (id: string, cls = "ico") =>
    `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true"><use href="#ic-${id}"/></svg>`;

  /* Motion preferences */
  const reduceMq = window.matchMedia("(prefers-reduced-motion: reduce)");
  const compactMq = window.matchMedia("(max-width: 1024px)");
  let reduced = reduceMq.matches;
  let compact = compactMq.matches;
  const sceneOn = () => !reduced && !compact;

  const announce = (msg: string) => {
    const live = $("#liveRegion");
    if (live) live.textContent = msg;
  };

  /* Data */
  const CATEGORIES = [
    { slug: "developer-web", icon: "code", name: "Developer & Web", desc: "JSON, regex, encoders, QR codes and web utilities.", count: 18 },
    { slug: "finance-calculators", icon: "calc", name: "Finance Calculators", desc: "EMI, SIP, GST, tax and business numbers.", count: 21 },
    { slug: "pdf-tools", icon: "pdf", name: "PDF Tools", desc: "Merge, split, compress, convert and edit documents.", count: 14 },
    { slug: "image-tools", icon: "image", name: "Image Tools", desc: "Compress, resize, crop and convert images.", count: 13 },
    { slug: "marketing-seo", icon: "chart", name: "Marketing & SEO", desc: "Meta tags, UTM links, SERP previews and audits.", count: 13 },
    { slug: "text-data-tools", icon: "text", name: "Text & Data", desc: "Counters, formatters, converters and data tools.", count: 13 },
    { slug: "invoicing-billing", icon: "invoice", name: "Invoicing & Billing", desc: "Invoices, quotations, receipts and payments.", count: 13 },
    { slug: "hr-payroll", icon: "users", name: "HR & Payroll", desc: "Salary, PF, gratuity, HRA and HR generators.", count: 14 },
    { slug: "ai-writers", icon: "spark", name: "AI Writing", desc: "Focused AI utilities for everyday writing.", count: 11 },
  ];

  const TOOLS = [
    {
      slug: "json-formatter",
      icon: "json",
      name: "JSON Formatter",
      cat: "Developer & Web",
      desc: "Format and validate JSON instantly.",
      built: true,
      about:
        "Parses, validates, formats and minifies JSON entirely in this tab. Nothing is uploaded, and the page keeps working offline once loaded.",
    },
    { slug: "image-compressor", icon: "image", name: "Image Compressor", cat: "Image Tools", desc: "Shrink file size with no visible quality loss." },
    { slug: "emi-calculator", icon: "rupee", name: "EMI Calculator", cat: "Finance Calculators", desc: "Monthly instalment and interest breakdown." },
    { slug: "utm-builder", icon: "link", name: "UTM Link Builder", cat: "Marketing & SEO", desc: "Build tagged campaign URLs in seconds." },
    { slug: "merge-pdf", icon: "pdf", name: "Merge PDF", cat: "PDF Tools", desc: "Combine several PDFs into one document." },
    { slug: "word-counter", icon: "text", name: "Word Counter", cat: "Text & Data", desc: "Words, characters, reading time and more." },
    { slug: "qr-generator", icon: "qr", name: "QR Code Generator", cat: "Developer & Web", desc: "Create scannable codes for any text or link." },
    { slug: "gst-calculator", icon: "percent", name: "GST Calculator", cat: "Finance Calculators", desc: "Add, remove and split GST on any amount." },
  ];

  const CHIPS = [
    { icon: "json", name: "JSON", cat: "Developer", sx: -36, sy: -26, dx: -15, dy: -7, lead: true },
    { icon: "image", name: "IMAGE", cat: "Image", sx: 32, sy: -30, dx: 15, dy: -7, lead: false },
    { icon: "rupee", name: "EMI", cat: "Finance", sx: -32, sy: 22, dx: -14, dy: 9, lead: false },
    { icon: "pdf", name: "PDF", cat: "PDF", sx: 36, sy: 24, dx: 16, dy: 9, lead: false },
    { icon: "qr", name: "QR", cat: "Developer", sx: -7, sy: -40, dx: -3, dy: -13, lead: false },
    { icon: "text", name: "WORD", cat: "Text", sx: -44, sy: 2, dx: -22, dy: 2, lead: false },
    { icon: "chart", name: "SEO", cat: "Marketing", sx: 28, sy: 2, dx: 22, dy: 2, lead: false },
    { icon: "percent", name: "GST", cat: "Finance", sx: 2, sy: 36, dx: 2, dy: 19, lead: false },
  ];

  const TRANSFORM_TABS = [
    { name: "Developer", count: 18 },
    { name: "Finance", count: 21 },
    { name: "PDF", count: 14 },
    { name: "Image", count: 13 },
    { name: "SEO", count: 13 },
    { name: "Text", count: 13 },
    { name: "Business", count: 27 },
  ];

  const STORY_TOOL = TOOLS[0];
  const SAMPLE_JSON = '{ "name": "Avexora", "tools": 130, "fast": true }';

  const CARD_MOTION = [
    "m-slide-l", "m-fade", "m-slide-r", "m-layer",
    "m-fade", "m-depth", "m-slide-r", "m-layer", "m-focus",
  ];

  /* DOM Builders */
  function buildChips() {
    const host = $("#transformLayers");
    if (!host) return;
    host.innerHTML = CHIPS.map(
      (c) => `
      <div class="chip${c.lead ? " is-lead" : ""}">
        <span class="chip-ico">${icon(c.icon, "ico ico--sm")}</span>
        <div class="chip-name">${esc(c.name)}</div>
        <div class="chip-cat">${esc(c.cat)}</div>
      </div>`
    ).join("");
  }

  function buildTransformTabs() {
    const host = $("#transformTabs");
    if (!host) return;
    host.innerHTML = TRANSFORM_TABS.map(
      (t, i) => `
      <span class="tab-item${i === 0 ? " is-on" : ""}">${esc(t.name)}<span class="mono">${t.count}</span></span>
    `
    ).join("");
  }

  function buildStoryRows() {
    const host = $("#storyRows");
    if (!host) return;
    host.innerHTML = TOOLS.slice(0, 5)
      .map(
        (t, i) => `
      <li class="${i === 0 ? "is-sel" : "is-dim"}">
        <span class="r-ico">${icon(t.icon, "ico ico--sm")}</span>
        <span class="r-name">${esc(t.name)}</span>
        <span class="r-cat">${esc(t.cat)}</span>
      </li>`
      )
      .join("");
  }

  function buildStoryDetail() {
    const host = $("#storyDetail");
    if (!host) return;
    host.innerHTML = `
      <div class="tool-detail-top">
        <span class="tool-card-ico">${icon(STORY_TOOL.icon)}</span>
        <span class="badge">${esc(STORY_TOOL.cat)}</span>
      </div>
      <h3>${esc(STORY_TOOL.name)}</h3>
      <p>${esc(STORY_TOOL.desc)}</p>
      <div class="tool-detail-meta">
        <span class="mono">Runs locally · No sign-in</span>
        <span class="tool-detail-cta">Open tool ${icon("arrow", "ico ico--sm")}</span>
      </div>`;
  }

  function buildCategories() {
    const host = $("#catGrid");
    if (!host) return;
    host.innerHTML = CATEGORIES.map(
      (c, i) => `
      <li data-motion="${CARD_MOTION[i % CARD_MOTION.length]}" style="--d:${i * 70}">
        <a class="cat-card" href="/${esc(c.slug)}" data-cat="${esc(c.name)}">
          <span class="cat-card-ico">${icon(c.icon)}</span>
          <span class="cat-card-num">${String(i + 1).padStart(2, "0")}</span>
          <h3>${esc(c.name)}</h3>
          <p>${esc(c.desc)}</p>
          <span class="cat-card-foot">
            <span class="cat-count">${c.count} tools</span>
            <span class="cat-go">Browse ${icon("arrow", "ico ico--sm")}</span>
          </span>
        </a>
      </li>`
    ).join("");
  }

  function buildTools() {
    const host = $("#toolGrid");
    if (!host) return;
    host.innerHTML = TOOLS.map(
      (t, i) => `
      <li data-motion="m-layer" style="--d:${i * 65}">
        <a class="tool-card" href="#tool/${esc(t.slug)}">
          <span class="tool-card-top">
            <span class="tool-card-ico">${icon(t.icon)}</span>
            <span class="tool-card-num">${String(i + 1).padStart(2, "0")}</span>
          </span>
          <h3>${esc(t.name)}</h3>
          <p>${esc(t.desc)}</p>
          <span class="tool-card-foot">
            <span class="tool-card-cat">${esc(t.cat)}</span>
            <span class="tool-card-go">Open ${icon("arrow", "ico ico--sm")}</span>
          </span>
        </a>
      </li>`
    ).join("");
  }

  function buildRelated() {
    const host = $("#relatedTools");
    if (!host) return;
    host.innerHTML = TOOLS.slice(1, 5)
      .map(
        (t) => `
      <li><a href="#tool/${esc(t.slug)}">${icon(t.icon)}<span>${esc(t.name)}</span></a></li>`
      )
      .join("");
  }

  /* Shared scroll ticker (one rAF for all scenes) */
  const scenes: Array<() => void> = [];
  let scenesQueued = false;
  const onScroll = () => {
    if (scenesQueued) return;
    scenesQueued = true;
    requestAnimationFrame(() => {
      scenesQueued = false;
      for (const fn of scenes) fn();
    });
  };

  const inView = (el: HTMLElement, pad = 240) => {
    const r = el.getBoundingClientRect();
    return r.bottom > -pad && r.top < window.innerHeight + pad;
  };

  let resizeTimer: ReturnType<typeof setTimeout>;
  const onResize = () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      reduced = reduceMq.matches;
      compact = compactMq.matches;
      for (const fn of remeasure) fn();
      for (const fn of scenes) fn();
    }, 140);
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onResize, { passive: true });

  /* Hero */
  function initHero() {
    const hero = $("#hero");
    if (!hero) return;
    const inner = $(".hero-inner", hero);
    const card = $(".hero-card", hero);
    const cue = $("[data-cue]", hero);

    requestAnimationFrame(() => requestAnimationFrame(() => hero.classList.add("is-ready")));

    if (!sceneOn()) {
      if (cue) cue.style.transform = "scaleX(1)";
      return;
    }

    let range = 1;
    const measure = () => {
      range = Math.max(hero.offsetHeight - window.innerHeight, 1);
    };
    measure();

    scenes.push(() => {
      if (!inView(hero, 80)) return;
      const p = clamp(window.scrollY / range);
      if (inner) {
        inner.style.transform = `translate3d(0, ${(-p * 64).toFixed(2)}px, 0)`;
        inner.style.opacity = (1 - p * 0.9).toFixed(3);
      }
      if (card) card.style.opacity = (1 - p * 0.95).toFixed(3);
      if (cue) cue.style.transform = `scaleX(${clamp(p * 6).toFixed(4)})`;
    });
  }

  /* Reveal engine (THIS IS WHAT SHOWS ALL HEADINGS AND CARDS!) */
  function show(el: HTMLElement) {
    el.style.setProperty("--in", "1");
    el.setAttribute("data-in", "");
  }
  function showAll(list: HTMLElement[]) {
    list.forEach(show);
  }

  let revealIO: IntersectionObserver | null = null;
  function initReveals() {
    const lone = $$("[data-motion]").filter((el) => !el.parentElement?.closest("[data-cascade]"));
    const masks = $$(".mask");

    if (!("IntersectionObserver" in window)) {
      showAll(lone);
      masks.forEach((m) => m.classList.add("is-in"));
      return;
    }

    revealIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          if (entry.target.classList.contains("mask")) {
            entry.target.classList.add("is-in");
          } else {
            show(entry.target as HTMLElement);
          }
          revealIO?.unobserve(entry.target);
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -5% 0px" }
    );

    lone.forEach((el) => revealIO?.observe(el));
    masks.forEach((el) => revealIO?.observe(el));
  }

  function initCascade(container: HTMLElement | null, done?: () => void) {
    if (!container) return;
    container.setAttribute("data-cascade", "");
    const items = $$("[data-motion]", container);

    const run = () => {
      items.forEach((el, i) => {
        setTimeout(() => show(el), reduced ? 0 : i * 90);
      });
      if (done) setTimeout(done, reduced ? 0 : items.length * 90 + 180);
    };

    if (!("IntersectionObserver" in window)) return run();
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          run();
        }
      },
      { threshold: 0.08 }
    );
    io.observe(container);
  }

  /* 06 — Scroll transformation (Pattern G) */
  function initTransform() {
    const section = $("#transform");
    if (!section) return;

    const chips = $$(".chip", section);
    const surface = $("#transformSurface", section);
    const tabs = $$(".tab-item", section);
    const titleA = $('.transform-title[data-title="a"]', section);
    const titleB = $('.transform-title[data-title="b"]', section);
    const field = $(".transform-field", section);
    const fill = $("[data-rail-fill]", section);
    const steps = $$(".transform-steps li", section);

    if (!sceneOn()) {
      section.classList.add("is-static");
      return;
    }

    let range = 1, vw = 0, vh = 0;
    const measure = () => {
      const stage = $(".transform-stage", section);
      range = Math.max(section.offsetHeight - window.innerHeight, 1);
      vw = stage ? stage.clientWidth : 0;
      vh = stage ? stage.clientHeight : 0;
    };
    measure();

    scenes.push(() => {
      if (!inView(section, 120)) return;
      const rect = section.getBoundingClientRect();
      const p = clamp(-rect.top / range);

      if (fill) fill.style.transform = `scaleX(${p.toFixed(4)})`;
      const step = clamp(Math.floor(p / 0.25), 0, steps.length - 1);
      steps.forEach((s, i) => s.classList.toggle("is-on", i === step));

      /* Headline hands over to the filter headline */
      const swap = smoothstep(0.7, 0.84, p);
      if (titleA) {
        titleA.style.opacity = (1 - swap).toFixed(3);
        titleA.style.transform = `translate3d(0, ${(-14 * swap).toFixed(2)}px, 0)`;
      }
      if (titleB) {
        titleB.style.opacity = swap.toFixed(3);
        titleB.style.transform = `translate3d(0, ${(18 * (1 - swap)).toFixed(2)}px, 0)`;
      }

      /* Search field retires */
      const fOut = smoothstep(0.24, 0.4, p);
      if (field) {
        field.style.opacity = (1 - fOut).toFixed(3);
        field.style.transform = `translate3d(0, ${(-12 * fOut).toFixed(2)}px, 0)`;
      }

      /* Layers: scatter -> pile -> unzip */
      const openT = smoothstep(0.44, 0.6, p);
      chips.forEach((el, i) => {
        const d = CHIPS[i];
        if (!d) return;
        const appear = smoothstep(0.01 + i * 0.013, 0.12 + i * 0.013, p);
        const gather = easeOut(smoothstep(0.05 + i * 0.017, 0.44, p));
        const fx = (d.sx / 100) * vw, fy = (d.sy / 100) * vh;
        const tx = (d.dx / 100) * vw, ty = (d.dy / 100) * vh;
        const x = lerp(fx, tx, gather);
        const y = lerp(fy, ty, gather);
        const s = lerp(0.84, 1, gather) * lerp(1, 1.16, openT);
        const rotX = (d.sy < 0 ? 3 : -2.4) * (1 - gather);
        const rotY = (d.sx < 0 ? 2.6 : -2.2) * (1 - gather);
        const z = lerp(-130, 0, gather);
        el.style.opacity = (appear * (1 - openT)).toFixed(3);
        el.style.transform =
          `translate3d(-50%, -50%, 0) translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, ${z.toFixed(1)}px) ` +
          `rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) scale(${s.toFixed(4)})`;
      });

      /* The pile becomes one surface */
      const sIn = smoothstep(0.45, 0.61, p);
      const sOut = smoothstep(0.79, 0.9, p);
      if (surface) {
        const e = easeOut(sIn);
        surface.style.opacity = (sIn * (1 - sOut)).toFixed(3);
        surface.style.transform =
          `translate3d(0, ${(lerp(30, 0, e) - sOut * 46).toFixed(2)}px, ${lerp(-28, 62, e).toFixed(1)}px) ` +
          `scale(${lerp(0.94, 1, e).toFixed(4)}) rotateX(${lerp(3, 0, e).toFixed(2)}deg)`;
      }

      /* Tabs arrive */
      tabs.forEach((el, i) => {
        const k = smoothstep(0.82 + i * 0.013, 0.93 + i * 0.013, p);
        el.style.opacity = k.toFixed(3);
        el.style.transform = `translate3d(0, ${((1 - k) * 16).toFixed(2)}px, 0)`;
      });
    });
  }

  /* 07 — Sticky product story (Pattern G) */
  let typeTimer: ReturnType<typeof setTimeout>;
  function initStory() {
    const section = $("#story");
    if (!section) return;

    const stage = $("#storyStage", section);
    const states = $$(".story-state", section);
    const steps = $$(".story-steps li", section);
    const fill = $("[data-story-fill]", section);
    const typed = $("[data-typed]", section);
    const result = $("#storyResult", section);

    if (result) result.innerHTML = highlightJson(JSON.stringify(JSON.parse(SAMPLE_JSON), null, 2));

    const setActive = (i: number) => {
      states.forEach((s, idx) => s.classList.toggle("is-active", idx === i));
      steps.forEach((s, idx) => s.classList.toggle("is-on", idx === i));
      if (fill) fill.style.transform = `scaleX(${((i + 1) / states.length).toFixed(4)})`;
      playTyping(i === 0);
    };

    function playTyping(run: boolean) {
      clearTimeout(typeTimer);
      if (!typed) return;
      if (!run || reduced) {
        typed.textContent = run ? "json" : "";
        return;
      }
      const word = "json";
      typed.textContent = "";
      let i = 0;
      (function step() {
        typed.textContent = word.slice(0, ++i);
        if (i < word.length) typeTimer = setTimeout(step, 78);
      })();
    }

    if (!sceneOn()) {
      states.forEach((s) => s.classList.add("is-active"));
      steps.forEach((s) => s.classList.add("is-on"));
      if (fill) fill.style.transform = "scaleX(1)";
      if (typed) typed.textContent = "json";
      return;
    }

    let range = 1;
    const measure = () => {
      range = Math.max((stage?.offsetHeight || 0) - window.innerHeight, 1);
    };
    measure();
    let last = -1;

    scenes.push(() => {
      if (!inView(section, 120) || !stage) return;
      const p = clamp(-stage.getBoundingClientRect().top / range);
      const seg = 1 / states.length;

      states.forEach((el, i) => {
        const enter = smoothstep(i * seg - 0.09, i * seg + 0.05, p);
        const exit = i === states.length - 1 ? 1 : 1 - smoothstep((i + 1) * seg - 0.05, (i + 1) * seg + 0.11, p);
        const v = enter * exit;
        el.style.opacity = v.toFixed(3);
        el.style.transform =
          `translate3d(0, ${(lerp(20, 0, enter) - (1 - exit) * 18).toFixed(2)}px, ${(lerp(-20, 56, enter) - (1 - exit) * 28).toFixed(1)}px) ` +
          `scale(${lerp(0.965, 1, enter).toFixed(4)}) ` +
          `rotateX(${lerp(2.2, 0, enter).toFixed(2)}deg)`;
        el.style.zIndex = String(10 - i);
      });

      const idx = clamp(Math.floor(p / seg), 0, states.length - 1);
      if (idx !== last) {
        last = idx;
        setActive(idx);
      }
      if (fill && last < 0) fill.style.transform = `scaleX(${p.toFixed(4)})`;
    });
  }

  /* 08 — Categories */
  function initCategories() {
    const grid = $("#catGrid");
    if (!grid) return;

    initCascade(grid, () => grid.classList.add("is-settled"));
  }

  /* 09 — JSON Workspace Component */
  function highlightJson(src: string) {
    const re = /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false)\b|\bnull\b|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g;
    let out = "", last = 0, m: RegExpExecArray | null;
    while ((m = re.exec(src)) !== null) {
      out += esc(src.slice(last, m.index));
      if (m[1]) {
        out += `<span class="${m[2] ? "t-key" : "t-str"}">${esc(m[1])}</span>`;
        if (m[2]) out += `<span class="t-op">${esc(m[2])}</span>`;
      } else if (m[3]) out += `<span class="t-bool">${m[3]}</span>`;
      else if (m[4]) out += `<span class="t-num">${m[4]}</span>`;
      last = re.lastIndex;
    }
    return out + esc(src.slice(last));
  }

  function wsTemplate() {
    return `
      <div class="ws">
        <div class="ws-bar">
          <span class="ws-dots" aria-hidden="true"><i></i><i></i><i></i></span>
          <span class="ws-url">tools.avexora.in/json-formatter</span>
          <span class="ws-flag">Runs locally</span>
        </div>
        <div class="ws-body">
          <div class="ws-pane">
            <div class="ws-pane-head"><span class="eyebrow-mono">Input</span><span class="mono">JSON</span></div>
            <textarea class="ws-input" spellcheck="false" aria-label="JSON input"></textarea>
          </div>
          <div class="ws-pane">
            <div class="ws-pane-head"><span class="eyebrow-mono">Output</span><span class="ws-status" role="status">READY</span></div>
            <pre class="ws-output"></pre>
          </div>
        </div>
        <div class="ws-actions">
          <button class="btn btn-primary btn-sm" type="button" data-act="format">Format JSON</button>
          <button class="btn btn-secondary btn-sm" type="button" data-act="minify">Minify</button>
          <button class="btn btn-ghost btn-sm" type="button" data-act="copy">Copy</button>
          <button class="btn btn-ghost btn-sm" type="button" data-act="clear">Clear</button>
        </div>
      </div>`;
  }

  function mountWorkspace(host: HTMLElement | null) {
    if (!host) return;
    host.innerHTML = wsTemplate();
    const ws = $(".ws", host);
    const input = $(".ws-input", host) as HTMLTextAreaElement | null;
    const out = $(".ws-output", host);
    const status = $(".ws-status", host);
    if (!ws || !input || !out || !status) return;

    const run = (mode: string) => {
      const raw = input.value;
      if (!raw.trim()) {
        out.textContent = "";
        status.textContent = "EMPTY";
        status.className = "ws-status";
        return;
      }
      try {
        const parsed = JSON.parse(raw);
        out.innerHTML = highlightJson(
          mode === "minify" ? JSON.stringify(parsed) : JSON.stringify(parsed, null, 2)
        );
        status.textContent = "VALID";
        status.className = "ws-status is-ok";
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        out.innerHTML = `<span class="err">${esc(message)}</span>`;
        status.textContent = "INVALID";
        status.className = "ws-status is-err";
      }
    };

    input.addEventListener("input", () => run("format"));

    ws.addEventListener("click", (e) => {
      const btn = (e.target as HTMLElement).closest("[data-act]") as HTMLElement | null;
      if (!btn) return;
      const act = btn.dataset.act;
      if (act === "format") run("format");
      if (act === "minify") run("minify");
      if (act === "clear") {
        input.value = "";
        run("format");
        input.focus();
      }
      if (act === "copy") {
        const text = out.textContent || "";
        if (!text) return;
        const done = () => {
          const label = btn.textContent;
          btn.textContent = "Copied";
          setTimeout(() => {
            btn.textContent = label;
          }, 1400);
          announce("Result copied to clipboard");
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done, done);
        } else done();
      }
    });

    input.value = SAMPLE_JSON;
    run("format");
  }

  function initWorkspaces() {
    $$("[data-mount]").forEach((el) => mountWorkspace(el));
  }

  /* 10 — Search Combobox */
  function initSearch() {
    const input = $("#toolSearch") as HTMLInputElement | null;
    const panel = $("#searchPanel");
    const list = $("#searchList");
    if (!input || !panel || !list) return;

    const label = $("#searchPanelLabel");
    const count = $("#searchCount");
    let cursor = -1;
    let items: HTMLElement[] = [];

    const matches = (q: string) => {
      const needle = q.trim().toLowerCase();
      const hit = (s: string) => !needle || s.toLowerCase().includes(needle);
      return {
        tools: TOOLS.filter((t) => hit(t.name) || hit(t.cat) || hit(t.desc)).slice(0, 6),
        cats: CATEGORIES.filter((c) => hit(c.name) || hit(c.desc)).slice(0, needle ? 4 : 3),
      };
    };

    function row(tool: (typeof TOOLS)[0]) {
      return `<li role="option" id="sopt-${esc(tool.slug)}" aria-selected="false" data-slug="${esc(tool.slug)}">
        <span class="s-ico">${icon(tool.icon, "ico ico--sm")}</span>
        <span class="s-name">${esc(tool.name)}</span>
        <span class="s-cat">${esc(tool.cat)}</span>
      </li>`;
    }
    function catRow(cat: (typeof CATEGORIES)[0]) {
      const id = "scat-" + cat.name.toLowerCase().replace(/[^a-z]+/g, "-");
      return `<li role="option" id="${id}" aria-selected="false" data-cat="${esc(cat.name)}">
        <span class="s-ico">${icon(cat.icon, "ico ico--sm")}</span>
        <span class="s-name">${esc(cat.name)}</span>
        <span class="s-cat">${cat.count} tools</span>
      </li>`;
    }

    function render() {
      if (!input || !panel || !list) return;
      const q = input.value;
      const res = matches(q);
      items = [];

      if (!res.tools.length && !res.cats.length) {
        list.innerHTML = `<li class="field-panel-empty">No tools match “${esc(q.trim())}”. Try another word.</li>`;
      } else {
        const head = q.trim() ? "Results" : "Popular";
        let html = "";
        if (res.tools.length) {
          html += res.tools.map(row).join("");
          items.push(...$$("[data-slug]", list).slice(0, res.tools.length));
        }
        if (res.cats.length) {
          html += res.cats.map(catRow).join("");
          items.push(...$$("[data-cat]", list));
        }
        list.innerHTML = html;
        items = $$('li[role="option"]', list);
        if (label) label.textContent = head;
      }

      if (count) {
        const n = items.length;
        count.textContent = n ? `${n} ${n === 1 ? "result" : "results"}` : "";
      }
      cursor = -1;
      input.removeAttribute("aria-activedescendant");
    }

    function open() {
      if (!input || !panel) return;
      render();
      panel.hidden = false;
      input.setAttribute("aria-expanded", "true");
    }
    function close() {
      if (!input || !panel) return;
      panel.hidden = true;
      input.setAttribute("aria-expanded", "false");
      input.removeAttribute("aria-activedescendant");
    }
    function highlight(i: number) {
      if (!input) return;
      items.forEach((el, idx) => el.setAttribute("aria-selected", String(idx === i)));
      if (i >= 0 && items[i]) {
        input.setAttribute("aria-activedescendant", items[i].id);
        items[i].scrollIntoView({ block: "nearest" });
      } else {
        input.removeAttribute("aria-activedescendant");
      }
    }

    input.addEventListener("focus", open);
    input.addEventListener("input", open);
    input.addEventListener("click", () => {
      if (panel.hidden) open();
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        if (!items.length) return;
        cursor =
          e.key === "ArrowDown"
            ? (cursor + 1) % items.length
            : (cursor - 1 + items.length) % items.length;
        highlight(cursor);
      } else if (e.key === "Home" && items.length) {
        e.preventDefault();
        cursor = 0;
        highlight(0);
      } else if (e.key === "End" && items.length) {
        e.preventDefault();
        cursor = items.length - 1;
        highlight(cursor);
      } else if (e.key === "Enter") {
        const target = items[cursor >= 0 ? cursor : 0];
        if (target) {
          e.preventDefault();
          target.dataset.slug
            ? (location.hash = "#tool/" + target.dataset.slug)
            : selectCategory(target.dataset.cat);
        }
      } else if (e.key === "Escape") {
        close();
        input.blur();
      } else if (e.key === "Tab") {
        close();
      }
    });

    list.addEventListener("mousedown", (e) => e.preventDefault());
    list.addEventListener("click", (e) => {
      const li = (e.target as HTMLElement).closest('li[role="option"]') as HTMLElement | null;
      if (!li) return;
      li.dataset.slug
        ? (location.hash = "#tool/" + li.dataset.slug)
        : selectCategory(li.dataset.cat);
      close();
      input.blur();
    });

    document.addEventListener("click", (e) => {
      if (!(e.target as HTMLElement).closest("#heroField")) close();
    });
    input.addEventListener("blur", () => setTimeout(close, 120));

    function selectCategory(name?: string) {
      if (!name) return;
      const card = $(`.cat-card[data-cat="${name}"]`);
      if (card) {
        card.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
        $$(".cat-card").forEach((c) => c.classList.toggle("is-active", c === card));
      }
      announce(`${name} — ${CATEGORIES.find((c) => c.name === name)?.count || ""} tools`);
    }
  }

  function focusSearch() {
    const input = $("#toolSearch") as HTMLInputElement | null;
    if (!input) return;
    const hero = $("#hero");
    const limit = hero ? hero.offsetHeight - window.innerHeight : 400;
    if (window.scrollY > limit) window.scrollTo({ top: 0, behavior: "instant" });
    input.focus({ preventScroll: true });
    if (input.value) input.select();
  }

  /* 11 — Auth Modal (Magic Link + Google OAuth) */
  function initAuth() {
    const modal = $("#authModal");
    if (!modal) return;
    const card = $(".auth", modal);
    const title = $("#authTitle");
    const copy = $("#authCopy");
    const kicker = $("#authKicker");
    const form = $("#authForm") as HTMLFormElement | null;
    const email = $("#authEmail") as HTMLInputElement | null;
    const error = $("#authError");
    const success = $("#authSuccess");
    const submit = $("#authSubmit");
    let lastFocus: HTMLElement | null = null;

    function open() {
      lastFocus = document.activeElement as HTMLElement | null;
      if (title) title.textContent = "Sign in to Avexora";
      if (copy) {
        copy.textContent = "Enter your email to receive a secure sign-in link, or continue with Google.";
      }
      if (kicker) kicker.textContent = "Avexora account";
      if (submit) {
        submit.textContent = "Send Magic Link";
        submit.removeAttribute("disabled");
      }
      if (error) {
        error.textContent = "";
        error.hidden = true;
      }
      if (success) {
        success.textContent = "";
        success.hidden = true;
      }
      if (form) form.hidden = false;
      modal!.hidden = false;
      document.body.classList.add("is-locked");
      requestAnimationFrame(() => email?.focus({ preventScroll: true }));
    }

    function close() {
      if (!modal) return;
      modal.hidden = true;
      document.body.classList.remove("is-locked");
      form?.reset();
      if (form) form.hidden = false;
      if (error) error.hidden = true;
      if (success) success.hidden = true;
      if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    }

    $$("[data-auth]").forEach((btn) => btn.addEventListener("click", () => open()));
    $$("[data-close-auth]", modal).forEach((el) => el.addEventListener("click", close));

    form?.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!email || !submit || !error) return;
      const rawEmail = email.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(rawEmail)) {
        error.textContent = "Enter a valid email address.";
        error.hidden = false;
        return;
      }
      error.hidden = true;
      submit.textContent = "Sending link…";
      submit.setAttribute("disabled", "true");

      try {
        const res = await signIn("resend", {
          email: rawEmail,
          redirect: false,
          callbackUrl: window.location.href,
        });

        if (res?.error) {
          error.textContent = "Unable to send magic link. Please check your email or try again.";
          error.hidden = false;
          submit.textContent = "Send Magic Link";
          submit.removeAttribute("disabled");
        } else {
          if (form) form.hidden = true;
          if (success) {
            success.innerHTML = `<strong>Check your inbox!</strong><br />We sent a secure sign-in link to <code>${esc(rawEmail)}</code>. Click the link in the email to sign in.`;
            success.hidden = false;
          }
        }
      } catch (err) {
        error.textContent = "An error occurred while sending the link. Please try again.";
        error.hidden = false;
        submit.textContent = "Send Magic Link";
        submit.removeAttribute("disabled");
      }
    });

    $("#googleAuth")?.addEventListener("click", () => {
      signIn("google", { callbackUrl: window.location.href });
    });

    modal.addEventListener("keydown", (e) => {
      if (e.key !== "Tab" || !card) return;
      const focusable = $$<HTMLElement>("button, [href], input, select, textarea", card).filter(
        (el) => !(el as HTMLButtonElement).disabled && el.offsetParent !== null
      );
      if (!focusable.length) return;
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });

    (modal as any).__close = close;
    (modal as any).__open = open;
  }

  function closeAuth() {
    const modal = $("#authModal") as any;
    if (modal && !modal.hidden && modal.__close) modal.__close();
  }

  /* 12 — Tool page router */
  function initToolPage() {
    const page = $("#toolPage");
    const main = $("#main");
    const footer = $(".footer");
    if (!page || !main) return;

    const title = $("#toolTitle", page);
    const cat = $("[data-tool-cat]", page);
    const desc = $("[data-tool-desc]", page);
    const about = $("[data-tool-about]", page);
    const iconUse = $("[data-tool-icon-use]");
    const soonIcon = $("[data-soon-icon]");
    const crumbCat = $("[data-crumb-cat]", page);
    const crumbName = $("[data-crumb-name]", page);
    const work = $("[data-tool-work]", page);
    const soon = $("[data-tool-soon]", page);

    function open(slug: string) {
      const tool = TOOLS.find((t) => t.slug === slug) || TOOLS[0];
      if (title) title.textContent = tool.name;
      if (cat) cat.textContent = tool.cat;
      if (desc) desc.textContent = tool.desc;
      if (crumbCat) crumbCat.textContent = tool.cat;
      if (crumbName) crumbName.textContent = tool.name;
      if (about) {
        about.textContent =
          tool.about ||
          `${tool.name} is catalogued on Avexora so you can find it, but the workspace is not built in this demo yet. The JSON Formatter above is fully working.`;
      }
      if (iconUse) iconUse.setAttribute("href", "#ic-" + tool.icon);
      if (soonIcon) soonIcon.setAttribute("href", "#ic-" + tool.icon);
      if (work) work.hidden = !tool.built;
      if (soon) soon.hidden = !!tool.built;

      page!.hidden = false;
      main!.hidden = true;
      if (footer) footer.hidden = true;
      document.title = `${tool.name} — Avexora Tools`;
      window.scrollTo({ top: 0, behavior: "instant" });
      announce(`${tool.name} tool page opened`);
    }

    function close() {
      if (!page || !main) return;
      page.hidden = true;
      main.hidden = false;
      if (footer) footer.hidden = false;
      document.title = "Avexora Tools — Tools for getting things done";
    }

    function route() {
      const m = location.hash.match(/^#tool\/([\w-]+)/);
      if (m) open(m[1]);
      else close();
    }

    window.addEventListener("hashchange", route);
    route();

    $$("[data-exit-tool]", page).forEach((el) =>
      el.addEventListener("click", (e) => {
        e.preventDefault();
        location.hash = "#tools";
      })
    );

    document.addEventListener("click", (e) => {
      const jump = (e.target as HTMLElement).closest("[data-open-tool]") as HTMLElement | null;
      if (jump) location.hash = "#tool/" + jump.dataset.openTool;
    });
  }

  /* 13 — Chrome: Nav & Theme */
  function initNav() {
    const nav = $("#nav");
    const burger = $("[data-burger]");
    const menu = $("#mobileMenu");
    if (!nav) return;

    const sync = () => nav.classList.toggle("is-stuck", window.scrollY > 6);
    scenes.push(sync);
    sync();

    burger?.addEventListener("click", () => {
      if (!menu) return;
      const open = menu.hidden;
      menu.hidden = !open;
      nav.classList.toggle("is-open", open);
      burger.setAttribute("aria-expanded", String(open));
      burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
    menu?.addEventListener("click", (e) => {
      if ((e.target as HTMLElement).tagName === "A") {
        menu.hidden = true;
        nav.classList.remove("is-open");
        burger?.setAttribute("aria-expanded", "false");
      }
    });
  }

  function initTheme() {
    const root = document.documentElement;
    const KEY = "avexora-theme";
    const darkMq = window.matchMedia("(prefers-color-scheme: dark)");

    function stored() {
      try {
        return localStorage.getItem(KEY);
      } catch (err) {
        return null;
      }
    }

    function apply(name: string, persist: boolean) {
      const mode = name === "dark" ? "dark" : "light";
      root.dataset.theme = mode;

      $$("[data-theme-set]").forEach((btn) =>
        btn.setAttribute("aria-pressed", String(btn.dataset.themeSet === mode))
      );

      $$("[data-theme-toggle]").forEach((btn) => {
        const dark = mode === "dark";
        btn.setAttribute("aria-pressed", String(dark));
        btn.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
        btn.setAttribute("title", dark ? "Light mode" : "Dark mode");
      });

      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute("content", mode === "dark" ? "#08090b" : "#ffffff");

      if (persist) {
        try {
          localStorage.setItem(KEY, mode);
        } catch (err) {}
      }
    }

    const saved = stored();
    apply(saved === "dark" || saved === "light" ? saved : darkMq.matches ? "dark" : "light", false);

    $$("[data-theme-toggle]").forEach((btn) =>
      btn.addEventListener("click", () => {
        const next = root.dataset.theme === "dark" ? "light" : "dark";
        apply(next, true);
        announce(`${next === "dark" ? "Dark" : "Light"} mode active`);
      })
    );

    $$("[data-theme-set]").forEach((btn) =>
      btn.addEventListener("click", () => {
        const setVal = btn.dataset.themeSet || "light";
        apply(setVal, true);
        announce(`${setVal === "dark" ? "Dark" : "Light"} mode active`);
      })
    );

    const onOsChange = (e: MediaQueryListEvent) => {
      if (stored()) return;
      apply(e.matches ? "dark" : "light", false);
    };
    if (darkMq.addEventListener) darkMq.addEventListener("change", onOsChange);
  }

  function initShortcuts() {
    document.addEventListener("keydown", (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        focusSearch();
        return;
      }
      if (e.key === "Escape") {
        closeAuth();
        const panel = $("#searchPanel");
        if (panel && !panel.hidden) {
          panel.hidden = true;
          $("#toolSearch")?.setAttribute("aria-expanded", "false");
        }
      }
    });

    $$("[data-focus-search]").forEach((btn) =>
      btn.addEventListener("click", () => {
        focusSearch();
      })
    );
  }

  /* 14 — 3D Depth */
  const ROT_X_MAX = 3;
  const ROT_Y_MAX = 5;
  const TILT_MAX = 2;

  const d3 = (el: HTMLElement, prop: string, value: number, unit: string, dp = 2) =>
    el.style.setProperty(prop, value.toFixed(dp) + unit);

  function sectionProgress(el: HTMLElement, lead = 0.9, tail = 0.15) {
    const r = el.getBoundingClientRect();
    const vh = window.innerHeight || 1;
    return clamp((vh * lead - r.top) / (r.height + vh * (lead + tail)));
  }

  const remeasure: Array<() => void> = [];
  function offsetsFrom(stage: HTMLElement, items: HTMLElement[]) {
    const s = stage.getBoundingClientRect();
    const cx = s.left + s.width / 2;
    const cy = s.top + s.height / 2;
    return items.map((c) => {
      const r = c.getBoundingClientRect();
      return { dx: r.left + r.width / 2 - cx, dy: r.top + r.height / 2 - cy };
    });
  }

  /* 14a. Hero Depth */
  function initHeroDepth() {
    const stage = $(".hero-3d");
    const hero = $("#hero");
    if (!stage || !hero) return;
    const cards = $$(".hero-3d-card", stage);
    if (!cards.length || !sceneOn()) return;

    let range = 1, base: Array<{ dx: number; dy: number }> = [];
    const measure = () => {
      base = offsetsFrom(stage, cards);
      range = Math.max(hero.offsetHeight * 0.8, window.innerHeight * 0.4, 1);
    };
    measure();
    remeasure.push(measure);

    scenes.push(() => {
      if (!inView(hero, 80)) return;
      const p = clamp(window.scrollY / range);
      const converge = easeOut(smoothstep(0, 0.55, p));
      const fade = 1 - smoothstep(0.55, 1, p);
      const par = -p * 30;
      cards.forEach((c, i) => {
        const b = base[i];
        if (!b) return;
        c.classList.add("is-live");
        d3(c, "--tx", -b.dx * converge * 0.55, "px");
        d3(c, "--ty", -b.dy * converge * 0.55 + par, "px");
        d3(c, "--tz", lerp(0, 26, converge), "px");
        d3(c, "--rx", clamp(-b.dy / 900, -ROT_X_MAX, ROT_X_MAX), "deg");
        d3(c, "--ry", clamp(b.dx / 900, -ROT_Y_MAX, ROT_Y_MAX), "deg");
        d3(c, "--ds", lerp(0.94, 1, converge), "", 4);
        d3(c, "--do", fade, "", 3);
      });
    });
  }

  /* 14b. Assembly */
  const ASSEMBLY_FROM: Record<string, { x: number; y: number; rx: number; ry: number }> = {
    lt: { x: -130, y: 0, rx: 1.4, ry: 5.0 },
    rt: { x: 130, y: 0, rx: 1.4, ry: -5.0 },
    lb: { x: 0, y: -110, rx: 3.0, ry: 0 },
    rb: { x: 0, y: 110, rx: -3.0, ry: 0 },
  };

  function initAssembly() {
    const stage = $('[data-3d="assembly"]');
    if (!stage) return;
    const main = $('[data-3d-card="main"]', stage);
    const sides = $$(".assembly-side", stage);
    if (!sceneOn()) return;

    scenes.push(() => {
      if (!inView(stage, 200)) return;
      const p = sectionProgress(stage);
      const t = easeOut(smoothstep(0.05, 0.78, p));
      const par = -p * 60;

      sides.forEach((el) => {
        const f = ASSEMBLY_FROM[el.dataset.slot || ""] || ASSEMBLY_FROM.lt;
        const k = 1 - t;
        el.classList.add("is-live");
        d3(el, "--tx", f.x * k, "px");
        d3(el, "--ty", f.y * k + par, "px");
        d3(el, "--tz", -40 * k, "px");
        d3(el, "--rx", f.rx * k, "deg");
        d3(el, "--ry", f.ry * k, "deg");
        d3(el, "--ds", lerp(0.92, 1, t), "", 4);
        d3(el, "--do", smoothstep(0, 0.3, p), "", 3);
      });

      if (main) {
        main.classList.add("is-live");
        d3(main, "--tz", lerp(-14, 40, t), "px");
        d3(main, "--rx", lerp(2, 0, t), "deg");
        d3(main, "--ds", lerp(0.96, 1, t), "", 4);
        d3(main, "--do", smoothstep(0.02, 0.22, p), "", 3);
      }
    });
  }

  /* 14c. Tool Stack */
  function initStack() {
    const stage = $('[data-3d="stack"]');
    if (!stage) return;
    const cards = $$(".stack-card", stage);
    if (!cards.length || !sceneOn()) return;

    let off: Array<{ dx: number; dy: number }> = [];
    const measure = () => {
      off = offsetsFrom(stage, cards);
    };
    measure();
    remeasure.push(measure);

    scenes.push(() => {
      if (!inView(stage, 200)) return;
      const p = sectionProgress(stage);
      cards.forEach((c, i) => {
        const o = off[i];
        if (!o) return;
        const t = easeOut(clamp((p - i * 0.045) / 0.55));
        const k = 1 - t;
        c.classList.add("is-live");
        d3(c, "--tx", o.dx * k, "px");
        d3(c, "--ty", o.dy * k, "px");
        d3(c, "--tz", -70 * k, "px");
        d3(c, "--rx", 1.6 * k, "deg");
        d3(c, "--ry", (i % 2 ? -ROT_Y_MAX : ROT_Y_MAX) * 0.6 * k, "deg");
        d3(c, "--ds", lerp(0.86, 1, t), "", 4);
        d3(c, "--do", smoothstep(0, 0.25, p), "", 3);
      });
    });
  }

  /* 14d. Pointer Tilt */
  function initTilt() {
    if (reduced) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    $$(".tilt, .tool-card, .cat-card").forEach((card) => {
      let frame = 0, px = 50, py = 50, rx = 0, ry = 0;

      const paint = () => {
        frame = 0;
        d3(card, "--tiltX", rx, "deg");
        d3(card, "--tiltY", ry, "deg");
        card.style.setProperty("--spotX", px.toFixed(1) + "%");
        card.style.setProperty("--spotY", py.toFixed(1) + "%");
      };
      const queue = () => {
        if (!frame) frame = requestAnimationFrame(paint);
      };

      card.addEventListener(
        "pointermove",
        (e: PointerEvent) => {
          if (e.pointerType && e.pointerType !== "mouse") return;
          const r = card.getBoundingClientRect();
          if (!r.width || !r.height) return;
          const fx = (e.clientX - r.left) / r.width - 0.5;
          const fy = (e.clientY - r.top) / r.height - 0.5;
          ry = clamp(fx * TILT_MAX * 2, -TILT_MAX, TILT_MAX);
          rx = clamp(fy * TILT_MAX * 2, -TILT_MAX, TILT_MAX);
          px = (fx + 0.5) * 100;
          py = (fy + 0.5) * 100;
          card.classList.add("is-tracking");
          queue();
        },
        { passive: true }
      );

      card.addEventListener("pointerleave", () => {
        rx = 0;
        ry = 0;
        px = 50;
        py = 50;
        card.classList.remove("is-tracking");
        queue();
      });
    });
  }

  /* Boot all systems */
  function boot() {
    buildChips();
    buildTransformTabs();
    buildStoryRows();
    buildStoryDetail();
    buildCategories();
    buildTools();
    buildRelated();

    initTheme();
    initHero();
    initHeroDepth();
    initAssembly();
    initStack();
    initTilt();
    initTransform();
    initStory();
    initCategories();
    initReveals();
    initWorkspaces();
    initSearch();
    initAuth();
    initToolPage();
    initNav();
    initShortcuts();

    for (const fn of scenes) fn();
  }

  boot();

  return () => {
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onResize);
    revealIO?.disconnect();
    clearTimeout(typeTimer);
    clearTimeout(resizeTimer);
  };
}
