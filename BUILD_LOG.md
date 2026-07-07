# BUILD LOG — freetools.avexora.in

Read this first at the start of every session. Spec: `20_Free_Tools_Growth_Engine_Spec.md`.

## Session 1 — 2026-07-04

### Deviations / decisions
- **Spec file was missing** from the repo at build start. Derived and committed `20_Free_Tools_Growth_Engine_Spec.md` from the project brief (10 categories, 120 tools, tie-in map). If the owner's original spec differs, edit the spec file — the build is config-driven.
- Stack: Next.js 16 (App Router) + TS + Tailwind 4; leads in SQLite via Prisma; PDF/image tools client-side; AI writers via Claude API behind `ANTHROPIC_API_KEY`.
- **PENDING from owner:** `ANTHROPIC_API_KEY` for AI writer tools (pages will render disabled without it); production `DATABASE_URL` if Postgres is wanted; confirmation of EBOS module URLs (`NEXT_PUBLIC_EBOS_URL`, default `https://ebos.avexora.in`).

### Built
- Milestone 1: scaffold (Next 16, Tailwind 4, Prisma 6, vitest, zod, pdf-lib, qrcode) + derived spec + this log.
- Milestone 2 (Tool Engine core): `src/tools/types.ts` (4 shapes), per-category configs + server registry + per-category client dynamic loaders, shape renderers in `src/components/tool-shapes/`, homepage w/ search, category hubs, tool page route. Proven with 5 pilot tools covering all 4 shapes: gst-calculator, word-counter (calculator), invoice-generator (generator + custom component + email gate), merge-pdf (file-tool, client-side pdf-lib), ai-blog-outline-generator (ai-writer).
- Milestone 3 (Lead Capture Engine): Prisma `Lead` model (SQLite, migration `20260705063106_init`), `POST /api/leads` (zod + honeypot + in-memory rate limit), email-gate modal (localStorage one-time unlock, GateProvider context for custom components), newsletter block, EBOS CTA block with UTM attribution + cta_click logging. **Verified via curl against prod server: email_gate + cta_click rows landed in SQLite, honeypot silently dropped, missing email 400s.**
- Milestone 4 (SEO Engine): per-tool generateMetadata (title/description/canonical/OG/Twitter), JSON-LD (SoftwareApplication + FAQPage + BreadcrumbList), sitemap.ts (16 URLs), robots.ts, breadcrumbs, related-tools + category-chip internal linking. **Verified via curl: title, canonical, JSON-LD, CTA UTM params all present in rendered HTML.**
- AI route: `/api/ai` streams via @anthropic-ai/sdk (`client.messages.stream`), server-side prompt registry (`src/server/ai-prompts.ts`), per-IP rate limit, 503 + disabled UI state when ANTHROPIC_API_KEY is absent. Default model `claude-opus-4-8`, override with `AI_MODEL` env var (owner may prefer a cheaper model for free public tools — decide before launch).
- Evidence this session: `npm test` 11/11 green; `npm run build` statically generated all 5 tool pages + 10 category hubs + home + sitemap + robots.

### Deviations (technical)
- Prisma pinned to v6 (v7 moved connection URLs out of schema files to a new adapter config; v6 is the stable documented path for SQLite).

### Pending (end of session 1)
- Milestone 5: tool build-out via parallel subagents (5/120 done — the pilots). Next: Finance calculators (14 remaining), then Text & Data (10 remaining), then the rest by category.
- Owner inputs still needed: ANTHROPIC_API_KEY (AI writers render disabled without it), production DATABASE_URL if not SQLite, confirmation of EBOS module URLs.

## Session 2 — 2026-07-07 — Milestone 5 complete: 120/120 tools

### Built
- All 10 categories built out to spec, reaching the full 120-tool inventory: Finance Calculators (15), Invoicing & Billing (12), HR & Payroll (12), Marketing & SEO (12), AI Writers (12), PDF Tools (12), Image Tools (11), Text & Data (12), Business & Legal (10), Developer & Web (12).
- PDF and Image tools run entirely client-side (pdf-lib / Canvas API) — no uploads. Developer tools use WebCrypto (hashing) and the `qrcode` package. AI writers are matched 1:1 against the `src/server/ai-prompts.ts` prompt registry (cross-verified, zero mismatches).
- Test suite: 191 vitest tests across 9 `tests/compute/*.test.ts` files, all passing.

### Deviations / defects found and fixed this session
- **Tool count discrepancy**: after Image Tools landed, a `grep -rc "slug:"` audit found `invoicing-billing.ts` had only the 1 pilot tool instead of 12 (109/120 total, not 120). Fixed by building the missing 11 invoicing-billing tools and the entire 10-tool business-legal category.
- **Final spec-conformance audit (subagent-driven, per the self-verification directive)** found 36 tools across image-tools, invoicing-billing, business-legal and pdf-tools with `about[]` sections under the spec's 200-word floor (§5/§6), plus one `seoDescription` a few characters under the ~120-char floor. Independently re-verified every flagged count with a precise word-count script before fixing. Fixed by adding one genuine closing paragraph per short tool (not filler) across all four files; a second verification pass then caught 3 more tools left just under 200 words in invoicing-billing.ts, fixed the same way.
- Several rounds of parallel subagents building categories were interrupted by session usage limits mid-task; recovered each time by reading the partial compute-function output they left behind and writing the remaining config/test files directly, rather than re-spawning agents and duplicating work.

### Verification (this session, final)
- Word-count script re-run across all `src/tools/configs/*.ts`: **0 violations across all 120 tools.**
- `npx tsc --noEmit`: clean.
- `npx vitest run tests/compute`: **191/191 passing.**
- `npm run build`: **138/138 static pages generated** (120 tool pages + 10 category hubs + home + not-found + sitemap.xml + robots.txt).

### Pending (owner inputs, unchanged)
- `ANTHROPIC_API_KEY` — AI writer tools render with a disabled notice until this is set.
- Production `DATABASE_URL` if Postgres is wanted instead of the current SQLite dev database.
- Confirmation of EBOS module URLs (`NEXT_PUBLIC_EBOS_URL`, currently defaults to `https://ebos.avexora.in`).
