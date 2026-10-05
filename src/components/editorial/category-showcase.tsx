"use client";

import Link from "next/link";
import { JsonWorkspace } from "./json-workspace";

const CATEGORIES = [
  { icon: "code", slug: "developer-web", name: "Developer & Web", desc: "JSON, regex, encoders, QR codes and web utilities.", count: 18 },
  { icon: "calc", slug: "finance-calculators", name: "Finance Calculators", desc: "EMI, SIP, GST, tax and business numbers.", count: 21 },
  { icon: "pdf", slug: "pdf-tools", name: "PDF Tools", desc: "Merge, split, compress, convert and edit documents.", count: 14 },
  { icon: "image", slug: "image-tools", name: "Image Tools", desc: "Compress, resize, crop and convert images.", count: 13 },
  { icon: "chart", slug: "marketing-seo", name: "Marketing & SEO", desc: "Meta tags, UTM links, SERP previews and audits.", count: 13 },
  { icon: "text", slug: "text-data-tools", name: "Text & Data", desc: "Counters, formatters, converters and data tools.", count: 13 },
  { icon: "invoice", slug: "invoicing-billing", name: "Invoicing & Billing", desc: "Invoices, quotations, receipts and payments.", count: 13 },
  { icon: "users", slug: "hr-payroll", name: "HR & Payroll", desc: "Salary, PF, gratuity, HRA and HR generators.", count: 14 },
  { icon: "spark", slug: "ai-writers", name: "AI Writing", desc: "Focused AI utilities for everyday writing.", count: 11 },
];

const POPULAR_TOOLS = [
  { slug: "json-formatter", icon: "json", name: "JSON Formatter", catSlug: "developer-web", catName: "Developer & Web", desc: "Format and validate JSON instantly." },
  { slug: "image-compressor", icon: "image", name: "Image Compressor", catSlug: "image-tools", catName: "Image Tools", desc: "Shrink file size with no visible quality loss." },
  { slug: "emi-calculator", icon: "rupee", name: "EMI Calculator", catSlug: "finance-calculators", catName: "Finance Calculators", desc: "Monthly instalment and interest breakdown." },
  { slug: "utm-builder", icon: "link", name: "UTM Link Builder", catSlug: "marketing-seo", catName: "Marketing & SEO", desc: "Build tagged campaign URLs in seconds." },
  { slug: "merge-pdf", icon: "pdf", name: "Merge PDF", catSlug: "pdf-tools", catName: "PDF Tools", desc: "Combine several PDFs into one document." },
  { slug: "word-counter", icon: "text", name: "Word Counter", catSlug: "text-data-tools", catName: "Text & Data", desc: "Words, characters, reading time and more." },
  { slug: "qr-generator", icon: "qr", name: "QR Code Generator", catSlug: "developer-web", catName: "Developer & Web", desc: "Create scannable codes for any text or link." },
  { slug: "gst-calculator", icon: "percent", name: "GST Calculator", catSlug: "finance-calculators", catName: "Finance Calculators", desc: "Add, remove and split GST on any amount." },
];

export function CategoryShowcase() {
  return (
    <>
      {/* ============================================================
           05 / CATEGORIES
           ============================================================ */}
      <section className="categories" id="categories" aria-labelledby="cat-title">
        <div className="section-head">
          <span className="eyebrow-mono">05 / CATEGORIES</span>
          <h2 className="section-title" id="cat-title">
            <span className="mask"><span className="mask-in">Everything you need.</span></span>
            <span className="mask"><span className="mask-in"><em>Organised.</em></span></span>
          </h2>
          <p className="section-lede">
            Nine categories, one shared interface. Pick a lane and everything inside it behaves the same way.
          </p>
        </div>

        <ol className="cat-grid is-settled">
          {CATEGORIES.map((c, idx) => (
            <li key={c.slug} style={{ animationDelay: `${idx * 50}ms` }}>
              <Link className="cat-card" href={`/${c.slug}`}>
                <span className="cat-card-ico">
                  <svg className="ico" viewBox="0 0 24 24" aria-hidden="true">
                    <use href={`#ic-${c.icon}`} />
                  </svg>
                </span>
                <span className="cat-card-num">{String(idx + 1).padStart(2, "0")}</span>
                <h3>{c.name}</h3>
                <p>{c.desc}</p>
                <span className="cat-card-foot">
                  <span className="cat-count">{c.count} tools</span>
                  <span className="cat-go">
                    Browse <svg className="ico ico--sm" viewBox="0 0 24 24" aria-hidden="true"><use href="#ic-arrow" /></svg>
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      {/* ============================================================
           06 / TOOLS
           ============================================================ */}
      <section className="tools" id="tools" aria-labelledby="tools-title">
        <div className="section-head is-split">
          <div>
            <span className="eyebrow-mono">06 / TOOLS</span>
            <h2 className="section-title" id="tools-title">
              <span className="mask"><span className="mask-in">Useful,</span></span>
              <span className="mask"><span className="mask-in"><em>not</em> overwhelming.</span></span>
            </h2>
          </div>
          <p className="section-lede">
            The most-opened tools on Avexora. Each opens into the same focused workspace — nothing else on the page.
          </p>
        </div>

        <div className="tool-grid">
          {POPULAR_TOOLS.map((t, idx) => (
            <div key={t.slug}>
              <Link className="tool-card" href={`/${t.catSlug}/${t.slug}`}>
                <span className="tool-card-top">
                  <span className="tool-card-ico">
                    <svg className="ico" viewBox="0 0 24 24" aria-hidden="true">
                      <use href={`#ic-${t.icon}`} />
                    </svg>
                  </span>
                  <span className="tool-card-num">{String(idx + 1).padStart(2, "0")}</span>
                </span>
                <h3>{t.name}</h3>
                <p>{t.desc}</p>
                <span className="tool-card-foot">
                  <span className="tool-card-cat">{t.catName}</span>
                  <span className="tool-card-go">
                    Open <svg className="ico ico--sm" viewBox="0 0 24 24" aria-hidden="true"><use href="#ic-arrow" /></svg>
                  </span>
                </span>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================================
           07 / SHOWCASE — REAL LIVE WORKSPACE
           ============================================================ */}
      <section className="showcase" id="showcase" aria-labelledby="showcase-title">
        <div className="showcase-head">
          <span className="eyebrow-mono">07 / PRODUCT</span>
          <h2 className="section-title" id="showcase-title">A workspace that stays out of the way.</h2>
          <p className="section-lede">Two panes, one primary action, and a status you can trust. Try it — this one is real.</p>
        </div>

        <div className="showcase-stage">
          <div className="showcase-ws">
            <JsonWorkspace />
          </div>
        </div>
      </section>

      {/* ============================================================
           08 / ABOUT
           ============================================================ */}
      <section className="about" id="about" aria-labelledby="about-title">
        <div className="about-grid">
          <div className="about-label">
            <span className="eyebrow-mono">08 / ABOUT</span>
            <h2 className="section-title" id="about-title">Private by default.</h2>
          </div>
          <div className="about-body">
            <p className="about-lead">
              Avexora is a shelf of small, sharp utilities. Not a platform, not a suite — a toolbox you open when a five-minute job turns into an hour.
            </p>
            <ul className="about-list">
              <li>
                <svg className="ico" viewBox="0 0 24 24" aria-hidden="true"><use href="#ic-shield" /></svg>
                <span><strong>Runs locally.</strong> Parsing, hashing, maths and rendering happen in this tab. Your files never leave the device.</span>
              </li>
              <li>
                <svg className="ico" viewBox="0 0 24 24" aria-hidden="true"><use href="#ic-bolt" /></svg>
                <span><strong>No install.</strong> No account required to start. Open a tool, use it, close the tab.</span>
              </li>
              <li>
                <svg className="ico" viewBox="0 0 24 24" aria-hidden="true"><use href="#ic-layers" /></svg>
                <span><strong>One pattern.</strong> 130+ tools, a single interface. Once you learn one, you know them all.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
