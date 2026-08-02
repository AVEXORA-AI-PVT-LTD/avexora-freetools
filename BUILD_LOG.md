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

## Session 3 — 2026-07-07 — Launch prep: SQLite → MongoDB

### Deviations / decisions
- **Switched the Lead datastore from SQLite to MongoDB** at the owner's direction for go-live. SQLite writes to a local file, which is fine on a persistent-disk host but **silently loses data on serverless platforms** (Vercel, etc.) whose filesystem is ephemeral/read-only in production — flagged to the owner before making the change.
- `prisma/schema.prisma`: `datasource db` provider changed `sqlite` → `mongodb`; `Lead.id` changed from `String @id @default(cuid())` to `String @id @default(auto()) @map("_id") @db.ObjectId` (Mongo's native id shape via Prisma). The `id` is never surfaced to clients (checked `src/app/api/leads/route.ts` and all callers), so this is a safe internal change.
- Removed `prisma/migrations/` — Prisma's Mongo connector doesn't use SQL-style migrations; schema changes are applied with `prisma db push` instead.
- Added `.env.example` (git-tracked; `.gitignore` updated to exclude it from the blanket `.env*` ignore) documenting the required `DATABASE_URL` format and noting Prisma's Mongo connector requires a replica set (single-node is fine — Atlas and other managed hosts already run as one).
- **Not tested end-to-end this session**: no Docker daemon was available in this sandbox to run a local MongoDB replica set, so `prisma db push` and a live `/api/leads` round-trip could not be exercised against real Mongo. `npx prisma generate` succeeded (schema is valid), and `tsc`/`vitest`/`npm run build` are all green — but **run `npx prisma db push` and a curl smoke test against the real `DATABASE_URL` before launch** to confirm writes actually land.

### Verification (this session)
- `npx prisma generate`: succeeds against the Mongo schema.
- `npx tsc --noEmit`: clean.
- `npx vitest run tests/compute`: 191/191 passing (unaffected — compute functions don't touch the DB).
- `npm run build`: 138/138 static pages, unchanged (Lead DB is only touched by the dynamic `/api/leads` and `/api/ai` routes, not the static tool pages).

### Pending (owner inputs, updated)
- `DATABASE_URL` — a real MongoDB connection string (Atlas or self-hosted replica set). **Run `npx prisma db push` once set, then smoke-test `/api/leads` before launch** — this was not exercised against a live database in this session.
- `ANTHROPIC_API_KEY` — AI writer tools render with a disabled notice until this is set.
- Confirmation of EBOS module URLs (`NEXT_PUBLIC_EBOS_URL`, currently defaults to `https://ebos.avexora.in`).
- Hosting/deployment target and domain DNS for `freetools.avexora.in` — undecided as of this session.

## Session 4 — 2026-08-02 — Brand Studio: research, spec and MVP

New product, same codebase: a paid subscription tier at `/studio` that generates
business stationery. Specs: `21_Brand_Studio_Research_and_GTM.md` (market, ICP,
offers, GTM) and `22_Brand_Studio_Spec.md` (build spec). Read those first.

### Decisions taken with the owner
- Lives in **this** Next app under `/studio`, not a separate app or repo — the
  120 free tools are already the top of the funnel for this exact ICP.
- **Deterministic design engine**, not diffusion. Curated palettes, OFL font
  pairings and parametric SVG marks drawn from a seed.
- **Razorpay** subscriptions in INR (India-first ICP).
- **India-first, compliance-aware** positioning.
- **Auth.js v5** + Prisma Mongo adapter.

### Positioning (the reason this is not another logo maker)
Companies Act 2013 s.12(3)(c) requires name, registered office address and CIN
on all business letters and billheads; penalty ₹1,000/day capped at ₹1,00,000.
LLPs carry the parallel LLPIN duty. No incumbent design tool knows this rule
exists. Second gap: Indian HR platforms track that an employee ID card is due
but none of them produce it, while design tools have templates and none of the
employee data.

### Built
- **Data model**: `User`/`Account`/`Session`/`VerificationToken` (Auth.js Mongo
  shapes) plus `Brand`, `BrandKit`, `Asset`, `Employee`, `Subscription`,
  `UsageCounter`. `Lead` is untouched.
- **Design engine** (`src/studio/engine/`): one `DocSpec` intermediate, three
  renderers — SVG (preview/download), print PDF via pdf-lib (true vector,
  bleed, crop marks), client-side Canvas raster. Layouts for letterhead,
  envelope (DL/C5/C4), visiting card (89×54mm India standard), CR80 ID cards
  with vCard QR, 8 social/ad formats, and an HTML email signature.
- **Compliance engine** (`src/studio/compliance/`): rule table by entity type ×
  document type with statutory citations and penalty exposure on every finding;
  CIN / GSTIN (mod-36 checksum) / PAN / LLPIN / PIN validators.
- **AI layer**: Claude curates by id from the registries and writes copy, never
  invents colours or fonts; structured outputs + zod validation; deterministic
  fallback when `ANTHROPIC_API_KEY` is unset.
- **Plans & entitlements**: `src/studio/plans.ts` is the single source of truth;
  `assertCapability` / `consumeQuota` / `assertBrandLimit` gate every export and
  AI route **server-side**. Free tier watermarks and blocks print PDFs.
- **Billing**: Razorpay subscriptions + webhook with HMAC-SHA256 signature
  verification over the raw body.
- **UI**: static marketing + pricing pages, magic-link/Google sign-in,
  dashboard, two-step onboarding wizard, and a seven-tab brand workspace with
  live previews and exports.
- **Funnel**: new free tool `letterhead-compliance-checker` in `business-legal`
  runs the same rule table and hands off to Studio; `Lead` rows are matched by
  email on signup for free-tool → paid attribution.

### Deviations / decisions (technical)
- **`middleware.ts` does not exist in Next 16** — it is `proxy.ts` at `src/`.
  Confirmed against `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md`.
  Used for optimistic redirects only; every Studio page and route re-checks the
  real session, per the Next docs' explicit warning.
- **The Studio layout deliberately does not call `auth()`.** Reading the session
  there made `/studio` and `/studio/pricing` dynamic, which would cost us static
  rendering on the primary SEO surface. The header links to `/studio/app`, which
  redirects when signed out. Both pages are `○ (Static)` in the build output.
- **PDF fonts**: pdf-lib embeds the standard-14 faces, mapped per curated family
  (sans→Helvetica, serif→Times, mono→Courier). Print output is always correct
  and needs no network, but a Playfair heading prints as Times Bold. Dropping
  matching TTFs into `public/studio/fonts/` is the upgrade path — see
  `engine/render/fonts-pdf.ts`, which documents the tradeoff rather than hiding it.
- **PDF gradients** are approximated by their midpoint colour (pdf-lib has no
  cheap gradient primitive). Layouts use gradients only for decorative bands,
  never for anything carrying information.
- The PDF renderer includes a **parser for the SVG subset the engine itself
  emits** (`engine/render/svg-subset.ts`) so logos stay vector in print rather
  than being rasterised. It is deliberately not a general SVG parser.

### Defects found and fixed this session
- A failing test exposed a real inconsistency: an LLPIN typed without a hyphen
  printed unhyphenated on stationery, while MCA's canonical form is `AAB-1234`.
  Fixed in `statutoryLines` — the code was wrong, not the test.
- The GSTIN checksum was initially tested only against self-consistent fixtures,
  which would pass even if the algorithm were wrong. Re-pinned to two real
  published GSTINs (`27AAPFU0939F1ZV`, `29AAGCB7383J1Z4`).

### Verification (this session)
- `npx tsc --noEmit`: clean.
- `npx vitest run`: **312/312 passing** (191 pre-existing + 121 new).
- `npm run build`: compiled clean; **121 tool pages + 10 category hubs** still
  generated, `/studio` and `/studio/pricing` static, Studio app routes dynamic.
- `npx eslint`: clean across all new files. (Pre-existing warnings in
  `src/tools/ui/image/*` and one error in `pdf-metadata-editor.tsx` are
  untouched by this session.)

### Not exercised — do before launch
- **No live database was available in this sandbox.** `npx prisma db push` has
  not been run against the new models, and no sign-in, brand creation, or
  export has been round-tripped against real Mongo. Run `npx prisma db push`
  and walk the flow in §11 of `22_Brand_Studio_Spec.md` before going live.
- **Razorpay was not exercised.** No merchant account, so checkout and the
  webhook are untested against the live API. Create the six plan ids, set the
  env vars, and replay a `subscription.activated` webhook in test mode.
- **No AI key was present**, so brand curation ran only through the
  deterministic fallback path. The structured-output path typechecks and is
  zod-guarded but has not been run against the live API.

### Pending (owner inputs)
- `AUTH_SECRET` plus either Resend or Google credentials — sign-in is disabled
  without them and the sign-in page says so.
- `ANTHROPIC_API_KEY` — AI curation and copy fall back to heuristics without it.
- Razorpay keys, webhook secret, and the six plan ids.
- Production `DATABASE_URL`, and `npx prisma db push` against it.
