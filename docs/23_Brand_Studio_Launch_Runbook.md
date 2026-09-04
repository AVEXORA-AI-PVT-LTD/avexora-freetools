# 23 — Brand Studio Launch Runbook

Everything needed to take `/studio` from "built and verified" to "taking money",
in the order it has to happen. Spec: `22_Brand_Studio_Spec.md`. Research and
positioning: `21_Brand_Studio_Research_and_GTM.md`.

Each step has a **check** — the observable that tells you the step actually
worked. Do not move on without it.

---

## 0. What is already verified, and what isn't

This matters because it tells you where to spend your attention.

### Verified by automated tests and against a running server

| Area | How it was verified |
|---|---|
| Design engine | 121 unit tests over marks, palettes, fonts, layout maths, logo determinism |
| **Export output** | 14 tests that render real PDFs and assert on the **bytes**: A4 is 595.28 × 841.89 pt, visiting cards are 89 × 54 mm plus 3 mm bleed on every edge, CR80 ID cards are 85.6 × 54 mm, the statutory particulars are present as real selectable text, logos stay vector (no raster XObject) |
| Compliance rules | 40+ tests over the entity × document rule matrix, plus CIN / GSTIN mod-36 / PAN / LLPIN / PIN validators pinned to real published identifiers |
| **Entitlements and gating** | 23 route-level tests driving the real handlers: free plan gets 402 with the upgrade target, Launch gets a real PDF and exactly one metered unit, an over-quota request is refused **and the counter rolled back**, a lapsed or halted subscription resolves to free, one user cannot read another's brand |
| **Razorpay webhook** | Valid signature activates and unlocks; tampered body, wrong secret, and missing signature are all rejected with nothing written; cancel and halt drop entitlements immediately while keeping the record; a renewal extends the period; unhandled and unattributable events are acknowledged without writing |
| HTTP surface | Production server booted: `/`, `/studio`, `/studio/pricing`, `/studio/signin`, the free tools, `sitemap.xml` and `robots.txt` all 200; `/studio/app` 307s to sign-in; export and checkout return 401 unauthenticated; the webhook returns 400 on a bad signature |
| SEO | 134 URLs in the sitemap including both Studio marketing pages; `/api/` disallowed in robots; canonical, title and description correct on `/studio` |

The gating tests were **mutation-tested**: disabling the capability check, the
quota rollback, and the webhook signature check each made the suite fail. They
are not passing vacuously.

### Also verified — the SDK integrations, against local stand-ins

Both third-party integrations were exercised with their **real client libraries
over real HTTP**, pointed at a local server instead of the vendor. That does not
prove the vendor behaves as documented, but it proves every line of our side:
request shape, auth header, serialisation, response parsing, and error handling.

| Area | How |
|---|---|
| Anthropic (11 tests) | The request we actually put on the wire carries a `json_schema` whose enums are generated from the palette, font and mark registries. A response is only trusted after zod: an invented palette id, an unlicensed font id, non-JSON prose, an empty array, a refusal, a 500 and a 429 each fall back to the deterministic path with onboarding still completing. The model's choices are kept; the mark seed stays ours. |
| Razorpay (10 tests) | Real Basic auth header, `/v1/subscriptions`, correct plan id per cycle, `total_count` 5 for yearly and 120 for monthly, yearly quoted at the yearly price. Then the loop that a merchant account would not reveal until after a customer had paid: the `notes` written at checkout are fed back through a signed webhook and the entitlement is asserted to actually open. Strip the notes and the user correctly stays on free. |

### And verified against a real MongoDB replica set

A genuine **mongod 8.0.23** was obtained from conda-forge (see §1) and run as a
single-node replica set. Against it:

- `npx prisma db push` created all nine collections and twelve indexes.
- `tests/studio/db-integration.test.ts` — **10 passing** through a real
  `PrismaClient`: brand/kit/employee persistence, the free→paid transition by
  signed webhook, a real PDF returned over the wire, the quota counter
  incrementing *one* row rather than duplicating, and cross-user isolation on
  both a brand and an ID-card batch. Four concurrent exports against two
  remaining units grant **exactly two** — the ceiling holds and the units are
  actually issued.
- The **whole stack, over HTTP**: the production server booted against real
  Mongo, a real Auth.js database session, `/studio/app` 200 signed in, an export
  refused with 402 on free, activated by a signed webhook, then all five asset
  types returned as real PDFs (letterhead, envelope, visiting card, ID cards,
  logo pack). The database showed 5 `Asset` rows, `UsageCounter.count = 5`, and
  an active `growth` subscription. A cancellation webhook dropped access back to
  402 immediately; a tampered webhook 400'd; an unauthenticated export 401'd.

Every suite was **mutation-tested** rather than trusted: 13 separate mutations
across capability gating, quota rollback, webhook signatures, mark styles, the
brand seed, zod validation, checkout `notes`, yearly billing counts, and
user-scoped brand lookup — each one broke tests.

### Nothing is left unexercised

All three integrations that were previously handed off are now closed. What a
production account adds is the vendor's own behaviour — that Razorpay echoes
`notes` back intact, and that the live model has taste — not any new code path.

---

## 1. Database

```bash
export DATABASE_URL="mongodb+srv://<user>:<pass>@<cluster>/freetools?retryWrites=true&w=majority"
npx prisma db push
```

Prisma's Mongo connector needs a **replica set**. Atlas is one already; a local
single-node install must be started with `--replSet` and initiated.

`db push` is correct here — the Mongo connector has no migration files. It is
additive against the existing `Lead` collection, which is untouched.

> **Check:** `npx prisma studio` lists `Brand`, `BrandKit`, `Asset`, `Employee`,
> `Subscription`, `UsageCounter`, `User`, `Account`, `Session` alongside the
> existing `Lead`, and `Lead` still holds its rows.

### Then run the integration suite — this is the launch gate

Point it at a **scratch database**, never production. It creates and deletes its
own users and brands, and is gated on its own env var precisely so a shell that
happens to have `DATABASE_URL` set at production cannot trigger it.

```bash
STUDIO_TEST_DATABASE_URL="mongodb+srv://…/studio_scratch" \
  npx vitest run tests/studio/db-integration.test.ts
```

It drives the real route handlers through a real `PrismaClient`: brand and kit
and employee persistence, the free→paid transition via a signed webhook, a real
PDF coming back over the wire, the quota counter incrementing one row rather
than inserting duplicates, four concurrent exports against two remaining units,
and cross-user isolation on both a brand and an ID-card batch.

It passes against mongod 8.0.23 and is mutation-tested: removing the quota
rollback breaks 2 of these tests, and dropping the `userId` scope from the brand
lookup breaks another. Run it against your own cluster too — Atlas enforces
things a local replica set does not, and this is the cheapest place to find out.

> **Check:** 10 passing, and the scratch database is empty again afterwards.

### Getting a local mongod when you need one

Useful for CI, and for anyone without Atlas access. conda-forge ships a real
mongod, no Docker and no MongoDB account required:

```bash
curl -sSLO https://conda.anaconda.org/conda-forge/linux-64/mongodb-8.0.23-h8ca7601_0.conda
unzip -q mongodb-8.0.23-h8ca7601_0.conda && tar --zstd -xf pkg-mongodb-*.tar.zst
LD_LIBRARY_PATH=$PWD/lib ./bin/mongod --replSet rs0 --dbpath ./data --port 27017 &
# then, once: db.adminCommand({replSetInitiate: {_id:"rs0", members:[{_id:0, host:"127.0.0.1:27017"}]}})
```

The replica set is not optional — **Prisma's Mongo connector wraps every write
in `startTransaction` regardless of topology**. That is also why FerretDB and
other wire-compatible stand-ins do not work: they implement neither transactions
nor `$and` inside `$match`, which the `UsageCounter` upsert needs. Reads succeed
and writes fail, which is a confusing way to lose an afternoon.

### Indexes

`db push` creates every index and unique constraint declared in the schema,
including the compound ones that match the actual query shapes —
`Brand[userId, updatedAt]`, `Employee[brandId, createdAt]`,
`Asset[brandId, type]`, and the `UsageCounter[userId, period, metric]` unique
that makes the quota upsert atomic. Nothing needs creating by hand.

> **Check:** `db.UsageCounter.getIndexes()` shows the compound unique. Without
> it, two concurrent exports can both pass the quota check.

---

## 2. Auth

```bash
npx auth secret            # writes AUTH_SECRET
export AUTH_URL="https://freetools.avexora.in"
```

Then **at least one** provider — the sign-in page hides whichever is unset, and
says so plainly if neither is configured:

- **Magic link:** `AUTH_RESEND_KEY` and `EMAIL_FROM` (both, or neither works).
  The sending domain must be verified in Resend first.
- **Google:** `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`, with
  `https://freetools.avexora.in/api/auth/callback/google` registered as an
  authorised redirect URI.

> **Check:** sign in end to end. A `User` and a `Session` row appear. If the
> email already exists in `Lead`, the free-tool → paid attribution wrote through
> (`events.createUser` in `src/server/auth.ts`).

---

## 3. Billing

In the Razorpay dashboard create **six plans** — three tiers × two cycles — with
these amounts, in paise, matching `src/studio/plans.ts` exactly:

| Plan | Monthly | Yearly |
|---|---|---|
| Launch | 49900 (₹499) | 478800 (₹4,788) |
| Growth | 149900 (₹1,499) | 1438800 (₹14,388) |
| Agency | 399900 (₹3,999) | 3838800 (₹38,388) |

If a Razorpay plan amount ever disagrees with `plans.ts`, **`plans.ts` is the
source of truth for entitlements and Razorpay is the source of truth for the
charge** — a mismatch means a customer is billed one number and entitled to
another. Re-check this whenever pricing changes.

```bash
export RAZORPAY_KEY_ID=... RAZORPAY_KEY_SECRET=... RAZORPAY_WEBHOOK_SECRET=...
export RAZORPAY_PLAN_LAUNCH_MONTHLY=plan_... RAZORPAY_PLAN_LAUNCH_YEARLY=plan_...
export RAZORPAY_PLAN_GROWTH_MONTHLY=plan_... RAZORPAY_PLAN_GROWTH_YEARLY=plan_...
export RAZORPAY_PLAN_AGENCY_MONTHLY=plan_... RAZORPAY_PLAN_AGENCY_YEARLY=plan_...
```

`tests/studio/billing-contract.test.ts` already proves our side of this against
the real SDK, including that the `notes` written at checkout are what the webhook
later reads to attribute the payment. What a live account adds is confirmation
that Razorpay behaves as documented — chiefly that it echoes `notes` back intact.

Register the webhook at `https://freetools.avexora.in/api/studio/webhooks/razorpay`
subscribed to `subscription.activated`, `.charged`, `.halted`, `.cancelled`,
`.completed`, `.paused`, `.resumed`, `.pending`.

The signature is HMAC-SHA256 over the **raw body**. If a proxy or body parser
ahead of the route rewrites the body, every webhook will 400 — this is the most
likely deployment-specific failure, so check it first if activations don't land.

> **Check (test mode):** subscribe to Launch with a test card. The webhook
> returns 200, a `Subscription` row appears with `status: "active"`, and a
> letterhead PDF export that returned 402 a minute earlier now returns 200.
> Then cancel: `resolvePlan` drops to free and the export 402s again.

---

## 4. AI

```bash
export ANTHROPIC_API_KEY=sk-ant-...
export STUDIO_AI_MODEL=claude-opus-5   # optional
```

Unset, curation silently uses deterministic ranking — the product still works,
it just stops being surprising. Claude only ever picks a palette, font pairing
and mark style **by id** from the curated registries, so a bad response is
rejected by zod rather than rendered. Both of those claims are asserted in
`tests/studio/ai-contract.test.ts` against the real SDK; what setting the key
adds is the live model's judgement, not a new code path.

> **Check:** run the onboarding wizard twice with the same inputs. With the key
> set you get three distinct, reasoned directions; the rationale text is not
> boilerplate.

---

## 5. Ship it — build and run the container

The app builds to `output: "standalone"`: `next build` emits `.next/standalone`,
a self-contained server plus only the `node_modules` it actually traced. The
`Dockerfile` ships exactly that, so the runtime image has no package manager and
never runs an install.

```bash
docker build -t avexora-freetools:$(git rev-parse --short HEAD) .
docker run -d -p 3000:3000 --env-file .env avexora-freetools:$(git rev-parse --short HEAD)
```

You do not have to build it yourself. Every push to a branch publishes the same
image to this repository's own registry, tagged with both the commit SHA and the
branch name, but only after `verify` and `image` have passed — so nothing is
published that has not already built and served the expected surface:

```bash
echo "$GITHUB_TOKEN" | docker login ghcr.io -u <your-username> --password-stdin
docker pull ghcr.io/wpdigitals/avexora-freetools:<commit-sha>
```

The package inherits the repository's visibility. This repo is private, so the
package is private too and a token with `read:packages` is needed to pull it.

The base is Debian (`node:22-bookworm-slim`), not Alpine, and that is load
bearing: `prisma generate` emits `libquery_engine-debian-openssl-3.0.x.so.node`.
A musl base needs a different `binaryTargets`, and it fails at the first query
rather than at build — the most expensive time to find out.

Runtime environment, all read at request time so one image promotes across
environments unchanged: `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`, whichever
sign-in provider you configured (§2), the Razorpay keys and six plan ids (§3),
and `ANTHROPIC_API_KEY` (§4). Only `DATABASE_URL` is needed for the app to be
useful; the rest degrade the feature rather than breaking the boot, which is why
the smoke test below passes with no environment at all.

> **Check:** with **no** env set, `/`, `/studio`, `/studio/pricing`,
> `sitemap.xml` and `robots.txt` return 200, `/studio/app` 307s to sign-in, a
> `POST` to `/api/studio/export` 401s, and the webhook 400s on a bad signature.
> This is asserted on every push by the `image` job in
> `.github/workflows/ci.yml`, against a container built from this Dockerfile.

### Or deploy on Vercel

Vercel does not use the Dockerfile — it builds through its own adapter — so the
container above is the self-hosting path and this is the alternative, not a
second step. Import `wpdigitals/avexora-freetools` at `vercel.com/new`; the
framework is detected automatically and nothing needs configuring at import
time.

Two things in the repo exist for this:

- **`package.json` has `postinstall: prisma generate`.** Vercel restores a
  cached `node_modules` between builds and can skip a dependency's own install
  hooks, which leaves a stale or missing client and fails the build somewhere
  confusing. The explicit postinstall makes generation part of every install.
  Note it errors rather than skipping when it cannot find a schema, which is why
  the Dockerfile copies `prisma/` before `npm ci`.
- **`vercel.json` pins `regions: ["bom1"]`** (Mumbai). Match this to wherever
  the Atlas cluster actually lives — a function in Washington talking to a
  cluster in Mumbai pays that round trip on every query, and PDF export is the
  place it shows.

Set the §1–§4 environment variables in **Project → Settings → Environment
Variables** before the first deploy, `AUTH_URL` among them, set to the real
origin. Production deploys come from the repository's **default branch**, so
this work has to be merged to `main` — a green branch is not a deploy.

> **Check:** the deployment shows Ready, `/` and `/studio` load on the Vercel
> URL, and `/studio/signin` offers whichever provider you configured rather than
> reporting that none is set.

If PDF export ever times out on a large ID-card batch, raise `maxDuration` for
`src/app/api/studio/export/route.ts` via the `functions` key in `vercel.json`.
It is deliberately not set now, because a `functions` pattern that matches
nothing fails the build outright.

### Behind a proxy — the one deployment-specific failure to expect

The Razorpay webhook signature is HMAC-SHA256 over the **raw body** (§3). Any
ingress that re-encodes, pretty-prints, or re-chunks the request body before it
reaches `/api/studio/webhooks/razorpay` will make every webhook 400 and no
subscription will ever activate. If activations do not land, check this first —
`buffer` the body untouched, or exempt that one path from body rewriting.

Also set `AUTH_URL` to the external origin and forward `X-Forwarded-Proto`, or
Auth.js will mint callback URLs against the container's own host and sign-in
will bounce.

---

## 6. Pre-launch walk-through

Do this once, by hand, on the deployed site, as a real user would:

1. Sign in.
2. Onboard a Pvt Ltd **with** a CIN → three brand directions → pick one.
3. Export the letterhead PDF. Open it. The statutory footer carries the legal
   name, registered office and CIN, and the text is **selectable**.
4. Re-run onboarding **without** a CIN. The compliance panel returns `fail`
   citing s.12(3)(c) and the ₹1,000/day exposure.
5. On the free plan, confirm PDF export is refused with a 402 that names Launch.
6. Add 3 employees, export ID cards on Growth, and check the QR against a phone
   camera — it should offer to save a contact.
7. Export a 1080² social post and check it on a phone.

`SAMPLE_OUT=./samples npx vitest run tests/studio/samples.test.ts` regenerates
one of everything into a browsable contact sheet, which is faster than clicking
through the app when you only want to look at output.

---

## 7. Day-one GTM (from `21_…_Research_and_GTM.md` §6)

- Point the ~30 branding, HR and legal tool pages at Studio via the CTA block.
- Publish `letterhead-compliance-checker` and treat it as the wedge: the
  diagnosis is genuinely useful on its own, and fixing it is the product.
- Open the CA/CS and incorporation-platform conversations — every company they
  register needs compliant stationery in week one, and Agency is built for it.

---

## 8. Known limits — say these out loud rather than discovering them later

- **PDF fonts are the standard 14**, mapped per curated family. A Playfair
  heading prints as Times Bold. Drop matching TTFs into `public/studio/fonts/`
  to fix; `engine/render/fonts-pdf.ts` documents the path.
- **PDF gradients** are flattened to their midpoint colour. Only decorative
  bands use them; nothing carrying information does.
- **Compliance output is informational, not legal advice**, and carries that
  disclaimer. The rule table covers the Companies Act s.12(3)(c) and LLP Act
  s.21 particulars — it is not a full statutory audit.
- **Quota metering is per calendar month in IST** and has no proration. A plan
  upgrade mid-month raises the ceiling; it does not reset the counter.
- **The free-plan watermark is a speed bump, not a boundary.** Screen assets
  (social posts, ads) are rasterised in the browser — that is the repo's
  standing convention and it means the artwork is already client-side, so a
  determined free user can skip the watermark from devtools. This is a
  deliberate line, not an oversight: the thing customers actually pay for is the
  **print-ready PDF**, and that is rendered server-side behind
  `assertCapability("printPdf")` where it cannot be bypassed. If watermark
  evasion ever shows up in the numbers, the fix is to move screen-asset
  rasterisation server-side for free accounts only — not to add client-side
  obfuscation, which would not hold either.
