import crypto from "node:crypto";
import { z } from "zod";
import type { DigitalCard, Prisma } from "@prisma/client";
import { SITE_URL } from "@/tools/categories";
import { EntitlementError, resolvePlan } from "@/server/studio/entitlements";
import { getAllPlans } from "@/server/studio/plans";
import {
  buildCardHtml,
  buildVCard,
  MAX_EXTRA_WEBSITES,
  normalizeUrl,
  SOCIAL_NETWORKS,
  validateBusinessCard,
  type BusinessCardInput,
  type QrTarget,
} from "@/tools/compute/legal/business-card";

/**
 * Saved Digital Business Cards (the "Save & share" half of the generator).
 *
 * A card is the same `BusinessCardInput` the tool builds its downloads from,
 * validated with the same rules on every write, and rendered on request with
 * the same `buildCardHtml` — so the public page at /card/<slug> is exactly the
 * card the owner previewed.
 */

export const MAX_CARDS_PER_USER = 10;

/** Save & share is a paid feature: any plan with a price, on an active subscription. */
export async function hasPaidPlan(userId: string): Promise<boolean> {
  const plan = await resolvePlan(userId);
  return plan.monthlyPaise > 0;
}

export async function assertCanSaveCards(userId: string): Promise<void> {
  if (await hasPaidPlan(userId)) return;
  const cheapest = (await getAllPlans()).find((p) => p.monthlyPaise > 0 && p.isActive !== false);
  throw new EntitlementError(
    "Saving and sharing cards is included in paid plans.",
    "capability",
    cheapest?.id ?? "launch",
  );
}

const QR_TARGETS = ["contact", "website", "card"] as const satisfies readonly QrTarget[];

const text = (max: number) => z.string().max(max).default("");

const cardSchema = z.object({
  name: text(200),
  title: text(200),
  company: text(200),
  tagline: text(400),
  phone: text(40),
  whatsapp: text(40),
  email: text(254),
  website: text(300),
  moreWebsites: z
    .array(z.object({ label: z.string().max(40).default(""), url: z.string().max(300).default("") }))
    .max(MAX_EXTRA_WEBSITES)
    .optional(),
  address: text(400),
  socials: z.partialRecord(z.enum(SOCIAL_NETWORKS), z.string().max(300)).default({}),
  primaryColor: z.string().max(7),
  accentColor: z.string().max(7),
  theme: z.enum(["light", "dark"]).default("light"),
  photo: z.string().max(500_000).optional(),
  logo: z.string().max(400_000).optional(),
  photoRatio: z.number().min(0.3).max(3).optional(),
  morePhotos: z.array(z.string().max(500_000)).max(3).optional(),
  photoMotion: z.boolean().optional(),
});

const payloadSchema = z.object({
  card: cardSchema,
  qrTarget: z.enum(QR_TARGETS).default("contact"),
});

export type CardPayload = { card: BusinessCardInput; qrTarget: QrTarget };

/** Parse and validate a save request; the error is a message for the form. */
export function parseCardPayload(body: unknown): { ok: true; value: CardPayload } | { ok: false; error: string } {
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) return { ok: false, error: "Check the card details and try again." };
  const { card, qrTarget } = parsed.data;
  const problem = validateBusinessCard(card);
  if (problem) return { ok: false, error: problem };
  if (qrTarget === "website" && !normalizeUrl(card.website)) {
    return { ok: false, error: "Add your website, or set the QR code to open something else." };
  }
  return { ok: true, value: { card, qrTarget } };
}

/** `priya-sharma-k3x9q2`: readable, and unguessable enough that cards aren't enumerable. */
export function newCardSlug(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40)
    .replace(/-$/, "");
  const suffix = crypto.randomBytes(6).toString("base64url").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 6).padEnd(6, "0");
  return `${base || "card"}-${suffix}`;
}

const SLUG_RE = /^[a-z0-9-]{3,60}$/;
export function isCardSlug(slug: string): boolean {
  return SLUG_RE.test(slug);
}

export function cardUrl(slug: string): string {
  return `${SITE_URL}/card/${slug}`;
}

/** The stored JSON back to a card, tolerating rows written by older versions. */
export function cardFromRow(row: Pick<DigitalCard, "data">): BusinessCardInput | null {
  const parsed = cardSchema.safeParse(row.data);
  return parsed.success ? parsed.data : null;
}

export function cardToJson(card: BusinessCardInput): Prisma.InputJsonObject {
  return JSON.parse(JSON.stringify(card)) as Prisma.InputJsonObject;
}

export interface CardSummary {
  id: string;
  slug: string;
  url: string;
  name: string;
  company: string;
  qrTarget: QrTarget;
  views: number;
  updatedAt: string;
}

export function toCardSummary(row: DigitalCard): CardSummary {
  const card = cardFromRow(row);
  return {
    id: row.id,
    slug: row.slug,
    url: cardUrl(row.slug),
    name: card?.name ?? "",
    company: card?.company ?? "",
    qrTarget: (QR_TARGETS as readonly string[]).includes(row.qrTarget) ? (row.qrTarget as QrTarget) : "contact",
    views: row.views,
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** What the card's QR code encodes. */
export function qrPayload(card: BusinessCardInput, target: QrTarget, url: string): string {
  if (target === "card") return url;
  if (target === "website") return normalizeUrl(card.website) ?? url;
  return buildVCard(card, { includePhoto: false });
}

/** The public page for a saved card, plus the CSP that fits it. */
export async function renderSavedCard(row: DigitalCard): Promise<{ html: string; csp: string } | null> {
  const card = cardFromRow(row);
  if (!card) return null;
  const summary = toCardSummary(row);
  const QRCode = (await import("qrcode")).default;
  const qrSvg = await QRCode.toString(qrPayload(card, summary.qrTarget, summary.url), {
    type: "svg",
    margin: 1,
    errorCorrectionLevel: "M",
  });
  const html = buildCardHtml(card, {
    qrSvg,
    qrTarget: summary.qrTarget,
    shareUrl: summary.url,
    ogImageUrl: card.photo ? `${summary.url}/photo` : undefined,
    noindex: true,
  });
  // The page's only script is the one buildCardHtml writes; allow exactly it.
  const script = /<script>([\s\S]*?)<\/script>/.exec(html)?.[1] ?? "";
  const hash = crypto.createHash("sha256").update(script).digest("base64");
  const csp = [
    "default-src 'none'",
    "img-src data:",
    "style-src 'unsafe-inline'",
    `script-src 'sha256-${hash}'`,
    "base-uri 'none'",
    "form-action 'none'",
  ].join("; ");
  return { html, csp };
}

/** Decode a stored photo data URL for the og:image route. */
export function decodePhoto(dataUrl: string | undefined): { bytes: Buffer; type: string } | null {
  const match = /^data:(image\/(?:png|jpeg));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl ?? "");
  if (!match) return null;
  return { type: match[1]!, bytes: Buffer.from(match[2]!, "base64") };
}
