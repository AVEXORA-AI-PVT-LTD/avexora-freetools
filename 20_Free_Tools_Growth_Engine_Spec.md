# 20 — Free Tools Growth Engine Specification

**Site:** freetools.avexora.in
**Purpose:** Public free-tools growth engine for Enterprise Business OS (EBOS). ~120 utility/AI tools across 10 categories. Every tool is an independent SEO landing page that (a) delivers real utility instantly, (b) captures leads, and (c) routes the visitor to the matching EBOS paid module.

> Note: the original spec file was not present in the repository at build start. This document was derived from the project brief and committed as the working spec. Corrections to categories, tool lists, or module tie-ins should be made here; the build is config-driven, so changes are cheap to apply.

---

## 1. Architecture Principles

1. **Config-driven Tool Engine.** A new tool is added by adding a `ToolConfig` entry (+ a pure compute function and unit test where applicable) — never by writing a new page template.
2. **Four tool shapes** cover all 120 tools:
   - `calculator` — declarative input fields → pure compute function → result panel. Runs fully client-side.
   - `generator` — form → formatted text / document output (copy / download). Client-side.
   - `file-tool` — file upload → client-side processing (pdf-lib / canvas) → download. **No file ever leaves the browser.**
   - `ai-writer` — form → `POST /api/ai` (Claude API) → streamed text output.
3. **Static-first.** All tool pages are statically generated. Only `/api/leads` and `/api/ai` are dynamic.
4. **Every tool page has:** tool UI, long-form SEO description, FAQ, related tools, lead capture surface, and an EBOS module CTA per the tie-in map.

## 2. Category Structure & Category → EBOS Module Tie-In Map

| # | Category slug | Category name | Tools | EBOS Module | CTA target path |
|---|---------------|---------------|-------|-------------|-----------------|
| 1 | `finance-calculators` | Finance Calculators | 15 | Finance | `/modules/finance` |
| 2 | `invoicing-billing` | Invoicing & Billing Tools | 12 | Billing | `/modules/billing` |
| 3 | `hr-payroll` | HR & Payroll Tools | 12 | HR & Payroll | `/modules/hr-payroll` |
| 4 | `marketing-seo` | Marketing & SEO Tools | 12 | Marketing | `/modules/marketing` |
| 5 | `ai-writers` | AI Writing Tools | 12 | Marketing (AI Assistant) | `/modules/marketing#ai` |
| 6 | `pdf-tools` | PDF Tools | 12 | Documents | `/modules/documents` |
| 7 | `image-tools` | Image Tools | 11 | Documents | `/modules/documents` |
| 8 | `text-data-tools` | Text & Data Tools | 12 | Productivity | `/modules/productivity` |
| 9 | `business-legal` | Business & Legal Generators | 10 | Compliance | `/modules/compliance` |
| 10 | `developer-web` | Developer & Web Utilities | 12 | Website | `/modules/website` |

**Total: 120 tools.** EBOS base URL comes from `NEXT_PUBLIC_EBOS_URL` (default `https://ebos.avexora.in`). Every CTA link appends `?utm_source=freetools&utm_medium=cta&utm_campaign=<tool-slug>`.

## 3. Tool Inventory

### 3.1 Finance Calculators (15) — all `calculator`
| Slug | Tool |
|------|------|
| `gst-calculator` | GST Calculator (inclusive/exclusive, CGST/SGST/IGST split) |
| `emi-calculator` | EMI Calculator (loan amount, rate, tenure → EMI, total interest, schedule summary) |
| `sip-calculator` | SIP Calculator (monthly investment, rate, years → corpus) |
| `fd-calculator` | Fixed Deposit Calculator (compounding frequency) |
| `rd-calculator` | Recurring Deposit Calculator |
| `income-tax-calculator` | Income Tax Calculator (India, new vs old regime, FY 2025-26 slabs) |
| `tds-calculator` | TDS Calculator (common sections: 194C/194J/194I/194H/192 simplified) |
| `compound-interest-calculator` | Compound Interest Calculator |
| `simple-interest-calculator` | Simple Interest Calculator |
| `break-even-calculator` | Break-Even Point Calculator (fixed costs, price, variable cost) |
| `margin-calculator` | Profit Margin Calculator (cost, revenue → gross margin %) |
| `markup-calculator` | Markup Calculator |
| `roi-calculator` | ROI Calculator (with annualized ROI) |
| `depreciation-calculator` | Depreciation Calculator (straight-line & WDV) |
| `working-capital-calculator` | Working Capital Calculator (+ current ratio) |

### 3.2 Invoicing & Billing (12)
| Slug | Tool | Kind |
|------|------|------|
| `invoice-generator` | Invoice Generator (GST invoice, line items → printable/PDF) | generator |
| `quotation-generator` | Quotation Generator | generator |
| `proforma-invoice-generator` | Proforma Invoice Generator | generator |
| `receipt-generator` | Payment Receipt Generator | generator |
| `credit-note-generator` | Credit Note Generator | generator |
| `debit-note-generator` | Debit Note Generator | generator |
| `purchase-order-generator` | Purchase Order Generator | generator |
| `delivery-challan-generator` | Delivery Challan Generator | generator |
| `payment-reminder-generator` | Payment Reminder Email/Message Generator (template-based) | generator |
| `late-fee-calculator` | Late Payment Fee/Interest Calculator | calculator |
| `discount-calculator` | Discount Calculator (single & stacked discounts) | calculator |
| `invoice-due-date-calculator` | Invoice Due Date Calculator (net terms) | calculator |

### 3.3 HR & Payroll (12)
| Slug | Tool | Kind |
|------|------|------|
| `salary-calculator` | In-Hand Salary Calculator (CTC → take-home, India) | calculator |
| `gratuity-calculator` | Gratuity Calculator | calculator |
| `pf-calculator` | EPF Calculator (corpus at retirement) | calculator |
| `hra-exemption-calculator` | HRA Exemption Calculator | calculator |
| `leave-encashment-calculator` | Leave Encashment Calculator | calculator |
| `bonus-calculator` | Statutory Bonus Calculator | calculator |
| `overtime-calculator` | Overtime Pay Calculator | calculator |
| `notice-period-recovery-calculator` | Notice Period Recovery Calculator | calculator |
| `payslip-generator` | Payslip Generator | generator |
| `offer-letter-generator` | Offer Letter Generator | generator |
| `appointment-letter-generator` | Appointment Letter Generator | generator |
| `experience-letter-generator` | Experience Letter Generator | generator |

### 3.4 Marketing & SEO (12)
| Slug | Tool | Kind |
|------|------|------|
| `meta-tag-generator` | Meta Tag Generator (title/description/OG/Twitter) | generator |
| `utm-builder` | UTM Link Builder | generator |
| `slug-generator` | URL Slug Generator | generator |
| `keyword-density-checker` | Keyword Density Checker | calculator |
| `headline-analyzer` | Headline Analyzer (length, word balance, sentiment words) | calculator |
| `hashtag-generator` | Hashtag Generator (from keywords, template-based) | generator |
| `serp-snippet-preview` | Google SERP Snippet Preview | generator |
| `robots-txt-generator` | Robots.txt Generator | generator |
| `email-subject-line-tester` | Email Subject Line Tester | calculator |
| `roas-calculator` | ROAS Calculator | calculator |
| `cpm-calculator` | CPM / CPC Calculator | calculator |
| `engagement-rate-calculator` | Engagement Rate Calculator | calculator |

### 3.5 AI Writers (12) — all `ai-writer`
`ai-blog-outline-generator`, `ai-blog-intro-generator`, `ai-product-description-generator`, `ai-ad-copy-generator`, `ai-cold-email-writer`, `ai-social-media-post-generator`, `ai-business-name-generator`, `ai-tagline-generator`, `ai-email-reply-generator`, `ai-linkedin-post-generator`, `ai-seo-title-generator`, `ai-faq-generator`

All AI writers share one API route (`/api/ai`) with a per-tool prompt template defined in the tool config (server-side registry — prompts are not client-supplied). Rate-limited per IP. If `ANTHROPIC_API_KEY` is unset, the page renders with the form disabled and a "temporarily unavailable" notice.

### 3.6 PDF Tools (12) — all `file-tool` (client-side via pdf-lib)
`merge-pdf`, `split-pdf`, `compress-pdf` (re-save/strip metadata — basic), `jpg-to-pdf`, `png-to-pdf`, `pdf-page-remover`, `extract-pdf-pages`, `reorder-pdf-pages`, `rotate-pdf`, `add-watermark-to-pdf`, `add-page-numbers-to-pdf`, `pdf-metadata-editor`

### 3.7 Image Tools (11) — all `file-tool` (client-side via canvas)
`image-compressor`, `image-resizer`, `image-cropper`, `png-to-jpg`, `jpg-to-png`, `webp-converter`, `image-to-base64`, `base64-to-image`, `favicon-generator` (PNG set + HTML snippet), `image-color-picker`, `image-rotator-flipper`

### 3.8 Text & Data Tools (12)
| Slug | Kind |
|------|------|
| `word-counter` | calculator |
| `character-counter` | calculator |
| `case-converter` | generator |
| `json-formatter` | generator |
| `csv-to-json` | generator |
| `json-to-csv` | generator |
| `text-diff-checker` | generator |
| `lorem-ipsum-generator` | generator |
| `password-generator` | generator |
| `remove-duplicate-lines` | generator |
| `text-sorter` | generator |
| `find-and-replace` | generator |

### 3.9 Business & Legal Generators (10) — all `generator`
`nda-generator`, `privacy-policy-generator`, `terms-and-conditions-generator`, `refund-policy-generator`, `disclaimer-generator`, `rent-agreement-generator`, `freelance-contract-generator`, `employment-contract-generator`, `loan-agreement-generator`, `partnership-deed-generator`

Template-based document assembly from form fields. Every output carries a "not legal advice" disclaimer. These tools are **email-gated on download** (highest lead intent).

### 3.10 Developer & Web Utilities (12)
`qr-code-generator` (generator), `url-encoder-decoder` (generator), `base64-encoder-decoder` (generator), `uuid-generator` (generator), `hash-generator` (SHA-1/256/512 via WebCrypto) (generator), `regex-tester` (generator), `color-converter` (generator), `css-gradient-generator` (generator), `html-entity-encoder-decoder` (generator), `timestamp-converter` (calculator), `jwt-decoder` (generator), `markdown-to-html` (generator)

## 4. Lead Capture Engine

**Storage:** Prisma + SQLite (`DATABASE_URL`, default `file:./dev.db`); schema is Postgres-portable.

**`Lead` model:** id, email, name (optional), toolSlug, category, event (`email_gate` | `newsletter` | `cta_click`), utmSource/utmMedium/utmCampaign (optional, captured from landing URL), createdAt.

**Capture surfaces:**
1. **Email gate** — tools flagged `emailGate: true` require an email before download/copy of the produced document (all Business & Legal generators, invoice-type generators, payslip/offer/appointment/experience letters). One-time per browser (localStorage), never gates the calculation itself.
2. **Newsletter block** — on every tool page below the tool.
3. **EBOS CTA block** — on every tool page: category-specific headline + link to the mapped EBOS module with UTM params; click fires a `cta_click` lead event (email optional/absent).

**API:** `POST /api/leads` — zod-validated, honeypot field rejected silently, per-IP rate limit (in-memory, 20/min), stores UTM params.

## 5. SEO Engine

- Per-tool `generateMetadata` from config: `<title>` = "{Tool Name} — Free Online Tool | Avexora Free Tools" (brand suffix applied via the root layout title template), meta description, canonical `https://freetools.avexora.in/{category}/{slug}`, OpenGraph + Twitter cards.
- JSON-LD on every tool page: `SoftwareApplication` (free, web) + `FAQPage` (from config FAQ) + `BreadcrumbList`.
- `sitemap.xml` (all tools + category hubs + home), `robots.txt`.
- Internal linking: breadcrumbs, related tools (config), category hub pages listing all tools, footer category links.
- Each tool page includes a 200–400 word "About / How it works" section and ≥3 FAQs from config.

## 6. Per-Category Task Breakdown (definition of done for each tool)

| Task | Requirement |
|------|-------------|
| Frontend | Renders via its shape's shared renderer from config; responsive; no per-tool page template |
| Compute/Backend | `calculator`/`generator`: pure function in `src/tools/compute/**`; `file-tool`: client processor; `ai-writer`: prompt template + shared `/api/ai` |
| DB/API | Lead events fire per §4 (gate where flagged, newsletter, CTA click) |
| SEO | Metadata + JSON-LD + FAQ (≥3) + about text + related tools present in config |
| Testing | Unit test for every pure compute function; page present in `npm run build` static output |

## 7. Verification Protocol

- Check-in every 5 tools (or every core-infra milestone): subagent audit against this spec — shape correctness, lead capture, CTA → correct module per §2.
- `npm run build` must emit one static page per registry entry (count check).
- `vitest run` green.
- Progress reports must cite actual build/test output from the session.
