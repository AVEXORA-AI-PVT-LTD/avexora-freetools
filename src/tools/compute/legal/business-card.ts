/**
 * Digital business card: validation, link building, vCard and the standalone
 * HTML card.
 *
 * Everything here is pure so the same builders drive the live preview (the
 * exported HTML rendered in a sandboxed iframe), the downloads and the tests.
 * All user text is escaped on the way into HTML and every link is rebuilt from
 * a normalised value with a known-safe scheme — nothing typed into the form is
 * ever interpolated into markup or an href as-is.
 */

export const SOCIAL_NETWORKS = ["linkedin", "instagram", "facebook", "x", "youtube", "github"] as const;
export type SocialNetwork = (typeof SOCIAL_NETWORKS)[number];

export const SOCIAL_META: Record<SocialNetwork, { label: string; color: string; base: string }> = {
  linkedin: { label: "LinkedIn", color: "#0A66C2", base: "https://www.linkedin.com/in/" },
  instagram: { label: "Instagram", color: "#E1306C", base: "https://www.instagram.com/" },
  facebook: { label: "Facebook", color: "#1877F2", base: "https://www.facebook.com/" },
  x: { label: "X", color: "#111111", base: "https://x.com/" },
  youtube: { label: "YouTube", color: "#FF0000", base: "https://www.youtube.com/@" },
  github: { label: "GitHub", color: "#24292F", base: "https://github.com/" },
};

export type CardTheme = "light" | "dark";
/** What the card's QR code opens: the contact (vCard), the website, or the saved card's own link. */
export type QrTarget = "contact" | "website" | "card";

export interface BusinessCardInput {
  name: string;
  title: string;
  company: string;
  tagline: string;
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
  address: string;
  socials: Partial<Record<SocialNetwork, string>>;
  primaryColor: string;
  accentColor: string;
  theme: CardTheme;
  /** A `data:image/(png|jpeg);base64,…` URL, already resized by the UI. */
  photo?: string;
  /** Company logo, same format as the photo (PNG keeps transparency). */
  logo?: string;
  /** Width ÷ height of the photo, so the header can show it whole. */
  photoRatio?: number;
  /** Cycle the photo through its five layouts (see PHOTO_LAYOUTS). */
  photoMotion?: boolean;
}

export const DEFAULT_CARD_COLORS = { primaryColor: "#EA580C", accentColor: "#7C3AED" } as const;

const HEX_RE = /^#[0-9a-f]{6}$/i;
const EMAIL_RE = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/;
const HANDLE_RE = /^[A-Za-z0-9._-]{1,100}$/;
const PHOTO_RE = /^data:image\/(png|jpeg);base64,([A-Za-z0-9+/=]+)$/;

export const LIMITS = { name: 80, title: 80, company: 80, tagline: 160, address: 200, photoBytes: 400_000, logoBytes: 300_000 } as const;

// --- normalisers ------------------------------------------------------------

const digits = (s: string) => s.replace(/\D/g, "");

/** An absolute http(s) URL, adding `https://` when the scheme is missing; null if it isn't one. */
export function normalizeUrl(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`;
  try {
    const url = new URL(withScheme);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    if (!url.hostname.includes(".")) return null;
    return url.href;
  } catch {
    return null;
  }
}

/** A profile URL from a full link, a bare `site.com/path`, or a handle (`@name` / `name`). */
export function normalizeSocial(network: SocialNetwork, raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  if (/^https?:\/\//i.test(value) || /^[\w-]+(\.[\w-]+)+\//.test(value)) return normalizeUrl(value);
  const handle = value.replace(/^@/, "");
  return HANDLE_RE.test(handle) ? SOCIAL_META[network].base + handle : null;
}

export function telHref(phone: string): string {
  const trimmed = phone.trim();
  return `tel:${trimmed.startsWith("+") ? "+" : ""}${digits(trimmed)}`;
}

export function whatsappHref(number: string): string {
  return `https://wa.me/${digits(number)}`;
}

export function mapsHref(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address.trim())}`;
}

/** `example.com/about` for display: no scheme, no `www.`, no trailing slash. */
export function prettyUrl(url: string): string {
  return url.replace(/^https?:\/\//i, "").replace(/^www\./i, "").replace(/\/$/, "");
}

export function initials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]!.toUpperCase())
      .join("") || "•"
  );
}

export function cardFilename(name: string, ext: "html" | "vcf" | "png"): string {
  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${slug || "business-card"}${ext === "png" ? "-qr" : ""}.${ext}`;
}

// --- validation -------------------------------------------------------------

/** The first problem with the input, or null when the card can be built. */
export function validateBusinessCard(input: BusinessCardInput): string | null {
  if (!input.name.trim()) return "Enter your name.";
  for (const key of ["name", "title", "company", "tagline", "address"] as const) {
    if (input[key].length > LIMITS[key]) return `Keep the ${key} under ${LIMITS[key]} characters.`;
  }
  const hasContact = [input.phone, input.whatsapp, input.email, input.website].some((v) => v.trim());
  if (!hasContact) return "Add at least one way to reach you: phone, WhatsApp, email or website.";
  if (input.phone.trim()) {
    const n = digits(input.phone).length;
    if (n < 7 || n > 15) return "The phone number should have 7 to 15 digits.";
  }
  if (input.whatsapp.trim()) {
    const n = digits(input.whatsapp).length;
    if (n < 8 || n > 15) return "Enter the WhatsApp number with its country code, e.g. +91 98765 43210.";
  }
  if (input.email.trim() && !EMAIL_RE.test(input.email.trim())) return "That email address doesn't look right.";
  if (input.website.trim() && !normalizeUrl(input.website)) return "That website address doesn't look right.";
  for (const network of SOCIAL_NETWORKS) {
    const value = input.socials[network];
    if (value?.trim() && !normalizeSocial(network, value)) {
      return `Enter a full ${SOCIAL_META[network].label} link or just the username.`;
    }
  }
  if (!HEX_RE.test(input.primaryColor) || !HEX_RE.test(input.accentColor)) return "Pick the brand colours again.";
  if (input.photo) {
    if (!PHOTO_RE.test(input.photo)) return "The photo must be a PNG or JPEG image.";
    if (input.photo.length > LIMITS.photoBytes) return "That photo is too large — try a smaller image.";
  }
  if (input.photoRatio !== undefined && !(input.photoRatio >= 0.3 && input.photoRatio <= 3)) {
    return "Choose the photo again.";
  }
  if (input.logo) {
    if (!PHOTO_RE.test(input.logo)) return "The logo must be a PNG or JPEG image.";
    if (input.logo.length > LIMITS.logoBytes) return "That logo is too large — try a smaller image.";
  }
  return null;
}

// --- contact rows -----------------------------------------------------------

export type ContactKind = "phone" | "whatsapp" | "email" | "website" | "address";

export interface ContactRow {
  kind: ContactKind;
  label: string;
  value: string;
  href: string;
  external: boolean;
}

export function contactRows(input: BusinessCardInput): ContactRow[] {
  const rows: ContactRow[] = [];
  const phone = input.phone.trim();
  if (phone) rows.push({ kind: "phone", label: "Call", value: phone, href: telHref(phone), external: false });
  const wa = input.whatsapp.trim();
  if (wa) rows.push({ kind: "whatsapp", label: "WhatsApp", value: wa, href: whatsappHref(wa), external: true });
  const email = input.email.trim();
  if (email) rows.push({ kind: "email", label: "Email", value: email, href: `mailto:${email}`, external: false });
  const site = normalizeUrl(input.website);
  if (site) rows.push({ kind: "website", label: "Website", value: prettyUrl(site), href: site, external: true });
  const address = input.address.trim();
  if (address) rows.push({ kind: "address", label: "Address", value: address, href: mapsHref(address), external: true });
  return rows;
}

export function socialLinks(input: BusinessCardInput): { network: SocialNetwork; url: string }[] {
  return SOCIAL_NETWORKS.flatMap((network) => {
    const url = normalizeSocial(network, input.socials[network] ?? "");
    return url ? [{ network, url }] : [];
  });
}

// --- vCard ------------------------------------------------------------------

function vEscape(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

/** RFC 6350 §3.2: fold lines longer than 75 octets (ASCII here, so characters). */
function vFold(line: string): string {
  if (line.length <= 75) return line;
  const parts = [line.slice(0, 75)];
  for (let i = 75; i < line.length; i += 74) parts.push(" " + line.slice(i, i + 74));
  return parts.join("\r\n");
}

/** vCard 3.0 — the version every phone's contacts app imports. */
export function buildVCard(input: BusinessCardInput, opts: { includePhoto?: boolean } = {}): string {
  const words = input.name.trim().split(/\s+/);
  const last = words.length > 1 ? words.pop()! : "";
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${vEscape(last)};${vEscape(words.join(" "))};;;`,
    `FN:${vEscape(input.name.trim())}`,
  ];
  if (input.company.trim()) lines.push(`ORG:${vEscape(input.company.trim())}`);
  if (input.title.trim()) lines.push(`TITLE:${vEscape(input.title.trim())}`);
  if (input.phone.trim()) lines.push(`TEL;TYPE=CELL,VOICE:${telHref(input.phone).slice(4)}`);
  if (input.whatsapp.trim() && digits(input.whatsapp) !== digits(input.phone)) {
    lines.push(`TEL;TYPE=CELL:+${digits(input.whatsapp)}`);
  }
  if (input.email.trim()) lines.push(`EMAIL;TYPE=INTERNET,WORK:${input.email.trim()}`);
  const site = normalizeUrl(input.website);
  if (site) lines.push(`URL:${site}`);
  if (input.address.trim()) lines.push(`ADR;TYPE=WORK:;;${vEscape(input.address.trim())};;;;`);
  for (const { network, url } of socialLinks(input)) lines.push(`X-SOCIALPROFILE;TYPE=${network}:${url}`);
  if (input.tagline.trim()) lines.push(`NOTE:${vEscape(input.tagline.trim())}`);
  const photo = opts.includePhoto !== false && input.photo ? PHOTO_RE.exec(input.photo) : null;
  if (photo) lines.push(`PHOTO;ENCODING=b;TYPE=${photo[1]!.toUpperCase()}:${photo[2]}`);
  lines.push("END:VCARD");
  return lines.map(vFold).join("\r\n") + "\r\n";
}

// --- animated photo -----------------------------------------------------------

/**
 * The five ways the header presents the photo. The card crossfades through
 * them in a loop; each is a different composition of the one uploaded image
 * (stored once, referenced through a CSS variable), always anchored at the top
 * so the head is never cut off.
 */
export const PHOTO_LAYOUTS = [
  { id: "portrait", label: "Full portrait" },
  { id: "spotlight", label: "Spotlight" },
  { id: "polaroid", label: "Polaroid" },
  { id: "split", label: "Split panel" },
  { id: "cover", label: "Magazine cover" },
] as const;
export type PhotoLayoutId = (typeof PHOTO_LAYOUTS)[number]["id"];

/** Seconds each layout stays on screen before the next fades in. */
const LAYOUT_SECONDS = 3.2;
const DEFAULT_RATIO = 0.8;

const HERO_CSS = `.banner.hero{height:auto;background:#0f172a}
.stage{position:relative;width:100%;aspect-ratio:var(--ratio);max-height:520px;min-height:260px;overflow:hidden}
.lay{position:absolute;inset:0;overflow:hidden;container-type:size}
.pic{position:absolute;inset:0;background:var(--photo) center top/cover no-repeat}
.lay-spotlight,.lay-polaroid,.lay-split .panel{background:linear-gradient(135deg,var(--primary),var(--accent))}
.lay-spotlight .disc{position:absolute;left:50%;top:48%;width:min(78cqw,74cqh);aspect-ratio:1;transform:translate(-50%,-50%);border-radius:50%;background:var(--photo) center 12%/cover no-repeat;box-shadow:0 0 0 6px rgba(255,255,255,.92),0 22px 50px rgba(0,0,0,.35)}
.lay-spotlight .disc::after{content:"";position:absolute;inset:-18px;border-radius:50%;border:2px solid rgba(255,255,255,.45)}
.lay-polaroid{background:radial-gradient(circle at 25% 15%,color-mix(in srgb,var(--accent) 55%,#fff),transparent 55%),linear-gradient(135deg,var(--primary),var(--accent))}
.lay-polaroid .print{position:absolute;left:50%;top:50%;width:min(78cqw,70cqh);aspect-ratio:.82;transform:translate(-50%,-50%) rotate(-4deg);background:#fff;border-radius:4px;box-shadow:0 24px 50px rgba(0,0,0,.35)}
.lay-polaroid .print .pic{inset:5% 5% 19% 5%;border-radius:2px}
.lay-polaroid figcaption{position:absolute;left:0;right:0;bottom:4%;text-align:center;font:600 clamp(15px,4.4vw,20px)/1.1 "Segoe Print","Bradley Hand","Comic Sans MS",cursive;color:#1f2937;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding:0 8px}
.lay-split .pic{right:44%}
.lay-split .panel{position:absolute;top:0;bottom:0;right:0;width:44%;display:flex;flex-direction:column;justify-content:center;gap:6px;padding:18px 16px;color:#fff}
.lay-split .panel b{font-size:clamp(18px,5.4vw,24px);line-height:1.1;overflow-wrap:anywhere}
.lay-split .panel span{font-size:13px;opacity:.9;overflow-wrap:anywhere}
.lay-split .panel i{width:36px;height:3px;border-radius:3px;background:rgba(255,255,255,.8)}
.lay-cover{background:linear-gradient(180deg,var(--primary),color-mix(in srgb,var(--primary) 40%,#000))}
.lay-cover .pic{top:min(17%,64px)}
.lay-cover .mast{position:absolute;top:14px;left:58px;right:58px;text-align:center;color:#fff;font-weight:900;font-size:clamp(24px,8vw,38px);line-height:1;letter-spacing:.03em;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:clip}
.lay-cover .lines{position:absolute;left:16px;right:16px;bottom:14px;color:#fff;text-shadow:0 2px 12px rgba(0,0,0,.6)}
.lay-cover .lines small{display:inline-block;padding:2px 8px;border-radius:3px;background:var(--accent);font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;text-shadow:none}
.lay-cover .lines b{display:block;margin-top:6px;font-size:clamp(17px,5vw,22px);line-height:1.15}
.lay-cover::after{content:"";position:absolute;inset:auto 0 0;height:42%;background:linear-gradient(transparent,rgba(0,0,0,.55))}
.lay-cover .lines{z-index:1}
.hero-scrim{position:absolute;inset:0 0 auto;height:80px;background:linear-gradient(rgba(0,0,0,.28),transparent);pointer-events:none}`;

function layoutHtml(id: PhotoLayoutId, text: { name: string; title: string; company: string }): string {
  const name = esc(text.name);
  const title = esc(text.title);
  const company = esc(text.company);
  switch (id) {
    case "portrait":
      return `<i class="pic"></i>`;
    case "spotlight":
      return `<i class="disc"></i>`;
    case "polaroid":
      return `<figure class="print"><i class="pic"></i><figcaption>${name}</figcaption></figure>`;
    case "split":
      return `<i class="pic"></i><div class="panel"><i></i><b>${name}</b>${title ? `<span>${title}</span>` : ""}${company ? `<span>${company}</span>` : ""}</div>`;
    case "cover":
      return `<i class="pic"></i><div class="mast">${company || name}</div><div class="lines"><small>In focus</small><b>${name}${title ? ` — ${title}` : ""}</b></div>`;
  }
}

/** Header markup and CSS for a photo card: every layout, or just `only`. */
function heroParts(
  photo: string,
  ratio: number,
  text: { name: string; title: string; company: string },
  opts: { animate: boolean; only?: PhotoLayoutId },
): { html: string; css: string } {
  const layouts = opts.only
    ? PHOTO_LAYOUTS.filter((l) => l.id === opts.only)
    : opts.animate
      ? PHOTO_LAYOUTS
      : PHOTO_LAYOUTS.slice(0, 1);
  const html = `<div class="stage" role="img" aria-label="${esc(text.name)}" style="--photo:url('${photo}');--ratio:${ratio}">${layouts
    .map((l, i) => `<div class="lay lay-${l.id}${i === 0 ? " base" : ""}">${layoutHtml(l.id, text)}</div>`)
    .join("")}</div>`;
  if (!opts.animate || opts.only) return { html, css: HERO_CSS };

  // Keyframe stops as a percentage of the loop: each layout holds for one slot
  // and crossfades into the next over FADE; its entrance move plays as it arrives.
  const cycle = PHOTO_LAYOUTS.length * LAYOUT_SECONDS;
  const SLOT = Math.round(100 / PHOTO_LAYOUTS.length);
  const FADE = 4;
  const OUT = SLOT + FADE;
  const delay = (i: number) => `${(i * LAYOUT_SECONDS).toFixed(1)}s`;
  const css = `${HERO_CSS}
.lay{opacity:0;animation:lay ${cycle}s linear infinite}
.lay.base{opacity:1;animation-name:lay-base}
${PHOTO_LAYOUTS.map((l, i) => `.lay-${l.id}{animation-delay:${delay(i)}}`).join("\n")}
.lay-portrait .pic,.lay-spotlight .disc,.lay-polaroid .print,.lay-split .panel,.lay-cover .mast{animation:${cycle}s var(--ease) infinite both}
.lay-portrait .pic{transform-origin:50% 0;animation-name:m-portrait;animation-delay:${delay(0)}}
.lay-spotlight .disc{animation-name:m-spotlight;animation-delay:${delay(1)}}
.lay-polaroid .print{animation-name:m-polaroid;animation-delay:${delay(2)}}
.lay-split .panel{animation-name:m-split;animation-delay:${delay(3)}}
.lay-cover .mast{animation-name:m-cover;animation-delay:${delay(4)}}
@keyframes lay{0%{opacity:0}${FADE}%{opacity:1}${SLOT}%{opacity:1}${OUT}%{opacity:0}100%{opacity:0}}
@keyframes lay-base{0%,${SLOT}%{opacity:1}${OUT}%,${100 - FADE}%{opacity:0}100%{opacity:1}}
@keyframes m-portrait{0%{transform:scale(1)}${OUT}%,100%{transform:scale(1.05)}}
@keyframes m-spotlight{0%{transform:translate(-50%,-50%) scale(.86)}${Math.round(OUT / 2)}%,100%{transform:translate(-50%,-50%) scale(1)}}
@keyframes m-polaroid{0%{transform:translate(-50%,-44%) rotate(-9deg)}${Math.round(OUT / 2)}%,100%{transform:translate(-50%,-50%) rotate(-4deg)}}
@keyframes m-split{0%{transform:translateX(100%)}${Math.round(OUT / 2)}%,100%{transform:none}}
@keyframes m-cover{0%{opacity:0;transform:translateY(-30%)}${Math.round(OUT / 2)}%,100%{opacity:1;transform:none}}
@media(prefers-reduced-motion:reduce){.lay{display:none}.lay.base{display:block;opacity:1}.lay .pic,.lay .disc,.lay .print,.lay .panel,.lay .mast{animation:none!important}}`;
  return { html, css };
}

/**
 * A tiny standalone page showing one layout, for the form's thumbnails (the
 * same markup and CSS the card uses, rendered at card width).
 */
export function photoLayoutDoc(input: BusinessCardInput, id: PhotoLayoutId): string {
  const photo = input.photo && PHOTO_RE.test(input.photo) ? input.photo : "";
  const primary = safeHex(input.primaryColor, DEFAULT_CARD_COLORS.primaryColor);
  const accent = safeHex(input.accentColor, DEFAULT_CARD_COLORS.accentColor);
  const { html, css } = heroParts(
    photo,
    photoRatio(input),
    { name: input.name.trim() || "Your Name", title: input.title.trim(), company: input.company.trim() },
    { animate: false, only: id },
  );
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>:root{--primary:${primary};--accent:${accent}}*{box-sizing:border-box}body{margin:0;width:390px;font-family:ui-sans-serif,system-ui,sans-serif;background:#0f172a}figure{margin:0}${css}.lay{opacity:1}</style></head><body>${html}</body></html>`;
}

function photoRatio(input: BusinessCardInput): number {
  const r = input.photoRatio;
  return r && r >= 0.3 && r <= 3 ? Math.round(r * 1000) / 1000 : DEFAULT_RATIO;
}

// --- icons (shared by the preview and the export) ----------------------------

export const CARD_ICONS: Record<ContactKind | SocialNetwork | "download" | "share" | "sun" | "moon", string> = {
  phone:
    '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>',
  whatsapp:
    '<path d="M3.5 20.5l1.3-4.2A8.5 8.5 0 1 1 8 19.3z"/><path d="M9 8.6c.2-.4.5-.5.8-.5h.5c.2 0 .4.1.5.4l.7 1.6c.1.2 0 .5-.1.7l-.5.6c-.1.1-.1.3 0 .5.6 1 1.4 1.8 2.4 2.3.2.1.4.1.5-.1l.6-.7c.2-.2.4-.2.6-.1l1.6.8c.2.1.3.3.3.5v.4c0 .4-.2.8-.6 1-.6.3-1.3.4-2 .2-2.4-.7-4.4-2.7-5.1-5.1-.2-.8-.1-1.6.2-2.5z" fill="currentColor" stroke="none"/>',
  email: '<rect x="2" y="4" width="20" height="16" rx="3"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
  website: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
  address: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  linkedin:
    '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>',
  instagram: '<rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/>',
  facebook: '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>',
  x: '<path d="M4 4l11.73 16H20L8.27 4z"/><path d="M4 20l6.77-6.77M13.23 10.77 20 4"/>',
  youtube:
    '<path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/><path d="m10 15 5-3-5-3z"/>',
  github:
    '<path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.4 5.4 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65S8.93 17.38 9 18v4"/><path d="M9 18c-4.51 2-5-2-7-2"/>',
  download: '<path d="M12 15V3"/><path d="m7 10 5 5 5-5"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>',
  share:
    '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
};

const icon = (name: keyof typeof CARD_ICONS) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${CARD_ICONS[name]}</svg>`;

// --- standalone HTML card ---------------------------------------------------

/** A validated `#rrggbb`, or the fallback — colours go straight into CSS. */
function safeHex(value: string, fallback: string): string {
  return HEX_RE.test(value) ? value : fallback;
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

const ROW_COLOR: Record<ContactKind, string> = {
  phone: "var(--primary)",
  whatsapp: "#25D366",
  email: "var(--accent)",
  website: "#0EA5E9",
  address: "#F59E0B",
};

export interface CardHtmlOptions {
  /** Public URL of the saved card: used for Share, canonical and link previews. */
  shareUrl?: string;
  /** Absolute URL of the photo for link previews (og:image). */
  ogImageUrl?: string;
  /** Keep the page out of search engines (saved cards default to this). */
  noindex?: boolean;
  /** SVG markup from the `qrcode` library (it emits only rects/paths). */
  qrSvg?: string;
  /** What the QR code opens, for its caption. */
  qrTarget?: QrTarget;
  /** Play the load-in sequence (the live preview turns it off between edits). */
  entrance?: boolean;
}

/**
 * A complete, self-contained HTML page for the card: inline CSS and JS, no
 * external requests (system font stack), so it can be hosted anywhere as a
 * single file. Save Contact is a `data:` link to the vCard, so it works with
 * JavaScript disabled; Share uses the Web Share API with a copy-link fallback.
 */
export function buildCardHtml(input: BusinessCardInput, opts: CardHtmlOptions = {}): string {
  const entrance = opts.entrance !== false;
  const primary = safeHex(input.primaryColor, DEFAULT_CARD_COLORS.primaryColor);
  const accent = safeHex(input.accentColor, DEFAULT_CARD_COLORS.accentColor);
  const rows = contactRows(input);
  const socials = socialLinks(input);
  const name = input.name.trim();
  const title = input.title.trim();
  const company = input.company.trim();
  const tagline = input.tagline.trim();
  const vcard = buildVCard(input);
  const vcfHref = `data:text/vcard;charset=utf-8,${encodeURIComponent(vcard)}`;

  const role = [title && esc(title), company && `<strong>${esc(company)}</strong>`].filter(Boolean).join(" at ");
  const photo = input.photo && PHOTO_RE.test(input.photo) ? input.photo : null;
  const logo = input.logo && PHOTO_RE.test(input.logo) ? input.logo : null;
  const motion = Boolean(photo && input.photoMotion !== false);
  // With a photo, the header shows it whole and loops through its layouts.
  const hero = photo
    ? heroParts(photo, photoRatio(input), { name, title, company }, { animate: motion })
    : null;
  const heroHtml = hero
    ? `${hero.html}<div class="hero-scrim"></div>`
    : `<div class="blob b1"></div><div class="blob b2"></div><div class="blob b3"></div>\n<div class="shape ring"></div><div class="shape sq"></div>`;
  const frameCss = hero?.css ?? "";
  // The circle carries the logo when there is one, initials when there is no
  // photo either, and is left out when the photo already fills the header.
  const avatar = logo
    ? `<div class="avatar logo"><div><img src="${logo}" alt="${esc(company || name)} logo"></div></div>`
    : photo
      ? ""
      : `<div class="avatar"><div><span aria-hidden="true">${esc(initials(name))}</span></div></div>`;

  const rowHtml = rows
    .map((r, i) => {
      const d = 1250 + i * 120;
      const ext = r.external ? ' target="_blank" rel="noopener noreferrer"' : "";
      return `<li class="rise-x" style="--d:${d}ms"><a class="row" href="${esc(r.href)}"${ext} style="--c:${ROW_COLOR[r.kind]}"><span class="ic">${icon(r.kind)}</span><span class="tx"><small>${r.label}</small><span>${esc(r.value)}</span></span></a></li>`;
    })
    .join("");
  let t = 1250 + rows.length * 120 + 60;

  const qrCaption =
    opts.qrTarget === "website" ? "Scan to visit the website" : opts.qrTarget === "card" ? "Scan to open this card" : "Scan to save this contact";
  const qrHtml = opts.qrSvg
    ? `<section class="qr rise" style="--d:${t}ms"><div class="qr-code" role="img" aria-label="QR code">${opts.qrSvg}</div><p>${qrCaption}</p></section>`
    : "";
  if (opts.qrSvg) t += 140;

  const socialHtml = socials.length
    ? `<nav class="socials" aria-label="Social profiles">${socials
        .map(
          (s, i) =>
            `<a class="pop" href="${esc(s.url)}" target="_blank" rel="noopener noreferrer" aria-label="${SOCIAL_META[s.network].label}" style="--d:${t + i * 90}ms;--c:${SOCIAL_META[s.network].color}">${icon(s.network)}</a>`,
        )
        .join("")}</nav>`
    : "";

  const dark = input.theme === "dark";
  const pageTitle = [name, company].filter(Boolean).join(" · ");
  const description = [title, company].filter(Boolean).join(" at ") || tagline || "Digital business card";

  return `<!DOCTYPE html>
<html lang="en" data-theme="${dark ? "dark" : "light"}"${entrance ? "" : ' class="no-entrance"'}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(pageTitle)}</title>
<meta name="description" content="${esc(description)}">
<meta name="theme-color" content="${primary}">
${opts.noindex ? '<meta name="robots" content="noindex">\n' : ""}${
    opts.shareUrl
      ? `<link rel="canonical" href="${esc(opts.shareUrl)}">\n<meta property="og:type" content="profile">\n<meta property="og:url" content="${esc(opts.shareUrl)}">\n`
      : ""
  }<meta property="og:title" content="${esc(pageTitle)}">
<meta property="og:description" content="${esc(description)}">
${opts.ogImageUrl ? `<meta property="og:image" content="${esc(opts.ogImageUrl)}">\n<meta name="twitter:card" content="summary">\n` : ""}
<style>
:root{--primary:${primary};--accent:${accent};--bg:#eef0f6;--card:#fff;--text:#0f172a;--muted:#64748b;--line:rgba(15,23,42,.08);--row:#f6f7fb;--row-h:#fff;--ease:cubic-bezier(.22,1,.36,1);--back:cubic-bezier(.34,1.56,.64,1);color-scheme:light}
[data-theme=dark]{--bg:#0b0d14;--card:#151823;--text:#f1f5f9;--muted:#94a3b8;--line:rgba(255,255,255,.08);--row:#1c2030;--row-h:#232839;color-scheme:dark}
*{box-sizing:border-box}
body{margin:0;min-height:100vh;display:flex;justify-content:center;align-items:flex-start;padding:16px;font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;color:var(--text);background:radial-gradient(60vmax 60vmax at 0 0,color-mix(in srgb,var(--primary) 16%,transparent),transparent 60%),radial-gradient(50vmax 50vmax at 100% 100%,color-mix(in srgb,var(--accent) 14%,transparent),transparent 60%),var(--bg);-webkit-font-smoothing:antialiased}
@media(min-width:520px){body{align-items:center;padding:40px 16px}}
a{color:inherit;text-decoration:none}
.card{width:100%;max-width:420px;background:var(--card);border-radius:28px;overflow:hidden;box-shadow:0 40px 80px -30px rgba(15,23,42,.35),0 12px 24px -12px rgba(15,23,42,.12)}
.banner{position:relative;height:210px;overflow:hidden;background:linear-gradient(135deg,var(--primary),color-mix(in srgb,var(--primary) 45%,var(--accent)) 60%,var(--accent));animation:fade .9s var(--ease) both}
.blob{position:absolute;border-radius:50%;filter:blur(28px);opacity:.7}
.b1{width:240px;height:240px;left:-70px;top:-90px;background:radial-gradient(circle,color-mix(in srgb,var(--accent) 70%,#fff),transparent 68%);animation:d1 16s ease-in-out infinite alternate}
.b2{width:220px;height:220px;right:-80px;top:-10px;background:radial-gradient(circle,color-mix(in srgb,var(--primary) 50%,#fff),transparent 66%);animation:d2 19s ease-in-out infinite alternate}
.b3{width:280px;height:280px;left:40px;bottom:-180px;background:radial-gradient(circle,color-mix(in srgb,var(--primary) 60%,#000),transparent 65%);animation:d3 22s ease-in-out infinite alternate}
.shape{position:absolute;border:1.5px solid rgba(255,255,255,.3)}
.ring{width:110px;height:110px;border-radius:50%;right:16%;top:20%;animation:spinf 24s linear infinite}
.sq{width:42px;height:42px;border-radius:12px;left:14%;top:40%;animation:spinf 30s linear infinite reverse}
canvas{position:absolute;inset:0;width:100%;height:100%}
.chip{position:absolute;top:14px;left:14px;z-index:2;display:inline-flex;align-items:center;gap:8px;max-width:65%;padding:6px 12px;border-radius:999px;color:#fff;font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.3);backdrop-filter:blur(10px)}
.toggle{position:absolute;top:12px;right:12px;z-index:2;width:38px;height:38px;display:grid;place-items:center;border-radius:50%;color:#fff;background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.3);cursor:pointer;transition:transform .25s var(--back)}
.toggle:hover{transform:rotate(-12deg)}.toggle svg{width:18px;height:18px}.toggle .moon,[data-theme=dark] .toggle .sun{display:none}[data-theme=dark] .toggle .moon{display:block}
.avatar{position:relative;z-index:3;width:120px;height:120px;margin:-60px auto 0;padding:5px;border-radius:50%;background:var(--card);animation:pop-in .9s var(--ease) both;animation-delay:450ms}
.avatar::before{content:"";position:absolute;inset:-3px;border-radius:50%;z-index:-1;background:conic-gradient(var(--primary),var(--accent),var(--primary));animation:spin 9s linear infinite}
.avatar>div{width:100%;height:100%;border-radius:50%;overflow:hidden;display:grid;place-items:center;color:#fff;font-size:36px;font-weight:700;background:linear-gradient(135deg,var(--primary),var(--accent))}
.avatar img{width:100%;height:100%;object-fit:cover;display:block}
.banner.hero canvas{opacity:.45}
figure{margin:0}
.avatar.logo>div{background:#fff;padding:14px}
.avatar.logo img{object-fit:contain}
.id.flush{padding-top:22px}
${frameCss}
.id{text-align:center;padding:14px 24px 0}
h1{margin:0;font-size:26px;line-height:1.2;letter-spacing:-.015em}
.role{margin:6px 0 0;font-size:14.5px;color:var(--muted);font-weight:500}
.role strong{color:var(--primary);font-weight:700}
.tag{margin:10px auto 0;max-width:32ch;font-size:13.5px;line-height:1.55;color:var(--muted)}
.actions{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:20px 20px 4px}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:48px;border:0;border-radius:14px;font:inherit;font-size:14.5px;font-weight:600;cursor:pointer;white-space:nowrap;transition:transform .25s var(--ease),box-shadow .3s ease}
.btn svg{width:18px;height:18px}
.btn.p{color:#fff;background:linear-gradient(135deg,var(--primary),color-mix(in srgb,var(--primary) 55%,var(--accent)));box-shadow:0 10px 22px -10px color-mix(in srgb,var(--primary) 60%,transparent)}
.btn.g{color:var(--text);background:var(--row);box-shadow:inset 0 0 0 1px var(--line)}
.btn:hover{transform:translateY(-3px)}.btn:active{transform:scale(.97)}
ul{list-style:none;margin:0;padding:14px 20px 4px;display:grid;gap:10px}
.row{display:flex;align-items:center;gap:14px;padding:12px;border-radius:16px;background:var(--row);box-shadow:inset 0 0 0 1px var(--line);transition:transform .3s var(--ease),background-color .3s}
.row:hover{transform:translateY(-2px);background:var(--row-h)}
.ic{width:42px;height:42px;flex:none;display:grid;place-items:center;border-radius:12px;color:var(--c);background:color-mix(in srgb,var(--c) 14%,transparent);transition:transform .35s var(--back)}
.ic svg{width:20px;height:20px}.row:hover .ic{transform:rotate(-8deg) scale(1.08)}
.tx{min-width:0;display:flex;flex-direction:column}
.tx small{font-size:11px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}
.tx span{font-size:14.5px;font-weight:500;overflow-wrap:anywhere}
.qr{margin:16px 20px 0;padding:14px;display:flex;align-items:center;gap:14px;border-radius:18px;background:var(--row);box-shadow:inset 0 0 0 1px var(--line)}
.qr-code{width:104px;height:104px;flex:none;padding:6px;border-radius:12px;background:#fff}
.qr-code svg{width:100%;height:100%;display:block}
.qr p{margin:0;font-size:13.5px;font-weight:600}
.socials{display:flex;flex-wrap:wrap;justify-content:center;gap:10px;padding:20px 20px 0}
.socials a{width:44px;height:44px;display:grid;place-items:center;border-radius:14px;background:var(--row);box-shadow:inset 0 0 0 1px var(--line);transition:transform .3s var(--back),background-color .3s,color .3s}
.socials a:hover{transform:translateY(-4px);color:#fff;background:var(--c)}
.socials svg{width:19px;height:19px}
.foot{text-align:center;font-size:11.5px;color:var(--muted);padding:18px 20px 22px}
.toast{position:fixed;left:50%;bottom:24px;transform:translate(-50%,20px);padding:10px 16px;border-radius:999px;background:#0f172a;color:#fff;font-size:13.5px;opacity:0;pointer-events:none;transition:opacity .3s,transform .35s var(--ease)}
.toast.show{opacity:1;transform:translate(-50%,0)}
.rise{animation:rise .7s var(--ease) both;animation-delay:var(--d,0ms)}
.rise-x{animation:rise-x .7s var(--ease) both;animation-delay:var(--d,0ms)}
.rise-x .ic{animation:ic .8s var(--back) backwards;animation-delay:calc(var(--d,0ms) + 180ms)}
.pop{animation:pop .6s var(--back) backwards;animation-delay:var(--d,0ms)}
.no-entrance .banner,.no-entrance .avatar,.no-entrance .rise,.no-entrance .rise-x,.no-entrance .rise-x .ic,.no-entrance .pop{animation:none}
@keyframes fade{from{opacity:0;transform:scale(1.05)}}
@keyframes pop-in{0%{opacity:0;transform:scale(.4) translateY(16px)}55%{opacity:1;transform:scale(1.08)}75%{transform:scale(.97)}}
@keyframes rise{from{opacity:0;transform:translateY(16px)}}
@keyframes rise-x{from{opacity:0;transform:translateX(-26px)}}
@keyframes ic{0%{transform:scale(.5) rotate(-35deg)}60%{transform:scale(1.15) rotate(8deg)}}
@keyframes pop{from{opacity:0;transform:translateY(10px) scale(.5)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes spinf{50%{transform:translateY(-12px) rotate(180deg)}to{transform:rotate(360deg)}}
@keyframes d1{to{transform:translate(90px,60px) scale(1.15)}}
@keyframes d2{to{transform:translate(-80px,50px) scale(.9)}}
@keyframes d3{to{transform:translate(90px,-40px) scale(1.1)}}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important}}
@media(max-width:360px){.actions{grid-template-columns:1fr}}
</style>
</head>
<body>
<main class="card">
<header class="banner${photo ? " hero" : ""}">
${heroHtml}
<canvas aria-hidden="true"></canvas>
${company && !photo ? `<span class="chip">${esc(company)}</span>` : ""}
<button class="toggle" type="button" aria-label="Toggle light and dark mode"><span class="sun">${icon("sun")}</span><span class="moon">${icon("moon")}</span></button>
</header>
${avatar}
<section class="id${avatar ? "" : " flush"}">
<h1 class="rise" style="--d:750ms">${esc(name)}</h1>
${role ? `<p class="role rise" style="--d:880ms">${role}</p>` : ""}
${tagline ? `<p class="tag rise" style="--d:1010ms">${esc(tagline)}</p>` : ""}
</section>
<div class="actions rise" style="--d:1140ms">
<a class="btn p" href="${vcfHref}" download="${esc(cardFilename(name, "vcf"))}">${icon("download")}<span>Save Contact</span></a>
<button class="btn g" type="button" data-share>${icon("share")}<span>Share</span></button>
</div>
${rowHtml ? `<ul aria-label="Contact details">${rowHtml}</ul>` : ""}
${qrHtml}
${socialHtml}
<footer class="foot">${esc(company || name)}</footer>
</main>
<div class="toast" role="status" aria-live="polite"></div>
<script>
(function(){
var root=document.documentElement,toast=document.querySelector(".toast"),timer;
function say(m){toast.textContent=m;toast.classList.add("show");clearTimeout(timer);timer=setTimeout(function(){toast.classList.remove("show")},2200)}
document.querySelector(".toggle").addEventListener("click",function(){root.dataset.theme=root.dataset.theme==="dark"?"light":"dark"});
document.querySelector("[data-share]").addEventListener("click",function(){
var url=${opts.shareUrl ? JSON.stringify(opts.shareUrl).replace(/</g, "\\u003c") : 'location.href.split("#")[0]'},data={title:document.title,url:url};
if(navigator.share){navigator.share(data).catch(function(){});return}
if(navigator.clipboard){navigator.clipboard.writeText(url).then(function(){say("Link copied")},function(){say(url)})}else{say(url)}
});
var c=document.querySelector("canvas"),x=c.getContext("2d");
if(!x)return;
var still=window.matchMedia("(prefers-reduced-motion: reduce)").matches,w,h,dots=[];
function size(){var r=c.getBoundingClientRect(),p=Math.min(window.devicePixelRatio||1,2);w=r.width;h=r.height;c.width=w*p;c.height=h*p;x.setTransform(p,0,0,p,0,0);dots=[];for(var i=0;i<Math.max(16,Math.min(40,Math.round(w*h/2800)));i++)dots.push({x:Math.random()*w,y:Math.random()*h,vx:(Math.random()-.5)*.28,vy:(Math.random()-.5)*.22,r:.8+Math.random()*1.8,a:.35+Math.random()*.5})}
function draw(move){x.clearRect(0,0,w,h);var i,j,a,b,d;for(i=0;i<dots.length;i++){a=dots[i];if(move){a.x+=a.vx;a.y+=a.vy;if(a.x<-10)a.x=w+10;else if(a.x>w+10)a.x=-10;if(a.y<-10)a.y=h+10;else if(a.y>h+10)a.y=-10}}
x.lineWidth=.8;for(i=0;i<dots.length;i++)for(j=i+1;j<dots.length;j++){a=dots[i];b=dots[j];d=Math.hypot(a.x-b.x,a.y-b.y);if(d<76){x.strokeStyle="rgba(255,255,255,"+(1-d/76)*.22+")";x.beginPath();x.moveTo(a.x,a.y);x.lineTo(b.x,b.y);x.stroke()}}
for(i=0;i<dots.length;i++){a=dots[i];x.fillStyle="rgba(255,255,255,"+a.a+")";x.beginPath();x.arc(a.x,a.y,a.r,0,6.2832);x.fill()}}
var running=false;
function loop(){if(document.hidden){running=false;return}draw(true);requestAnimationFrame(loop)}
function start(){if(!running){running=true;requestAnimationFrame(loop)}}
size();window.addEventListener("resize",size);
if(still)draw(false);else{start();document.addEventListener("visibilitychange",function(){if(!document.hidden)start()})}
})();
</script>
</body>
</html>
`;
}
