import type { BrandTokens } from "../tokens";
import type { ComplianceInput } from "../../compliance/india";
import {
  type DocSpec,
  type Element,
  type Paint,
  ellipse,
  rect,
  solid,
  text,
} from "../doc-spec";
import { measureBlock } from "../render/text-layout";
import { readableOn } from "../color";
import { SCREEN_SIZES, placeLogo, styles } from "./common";

/**
 * Social posts and ad creatives (spec 22 §3.4).
 *
 * Authored in pixels rather than millimetres — these are screen assets and
 * never go to a press, so there is no bleed and the raster renderer is the
 * primary output path.
 */

export type SocialFormat =
  | "square"
  | "portrait"
  | "story"
  | "og"
  | "metaFeed"
  | "displayMedRect"
  | "displayLeaderboard"
  | "displaySkyscraper";

export const SOCIAL_FORMATS: {
  value: SocialFormat;
  label: string;
  note: string;
}[] = [
  { value: "square", label: "Square 1080 × 1080", note: "Instagram, LinkedIn, Facebook feed" },
  { value: "portrait", label: "Portrait 1080 × 1350", note: "Instagram feed (max height)" },
  { value: "story", label: "Story 1080 × 1920", note: "Instagram / WhatsApp status" },
  { value: "og", label: "Open Graph 1200 × 630", note: "Link preview cards" },
  { value: "metaFeed", label: "Meta ad 1200 × 628", note: "Facebook / Instagram ads" },
  { value: "displayMedRect", label: "Medium rectangle 300 × 250", note: "Google Display" },
  { value: "displayLeaderboard", label: "Leaderboard 728 × 90", note: "Google Display" },
  { value: "displaySkyscraper", label: "Skyscraper 160 × 600", note: "Google Display" },
];

export type SocialTheme = "solid" | "light" | "split" | "gradient";

export interface SocialContent {
  headline: string;
  subhead?: string;
  /** Call to action — rendered as a pill button. */
  cta?: string;
  format?: SocialFormat;
  theme?: SocialTheme;
  /** Show the website/handle in the footer. */
  handle?: string;
}

export function socialPostSpec(
  tokens: BrandTokens,
  brand: ComplianceInput,
  content: SocialContent,
): DocSpec {
  const format = content.format ?? "square";
  const theme = content.theme ?? "solid";
  const { w, h } = SCREEN_SIZES[format];
  const { palette, ramp } = tokens;
  const elements: Element[] = [];

  // Small display units cannot carry a subhead and a CTA without becoming
  // unreadable, so the layout degrades rather than overflowing.
  const compact = w < 400 || h < 200;
  const pad = compact ? Math.min(w, h) * 0.08 : Math.min(w, h) * 0.085;

  const dark = theme === "solid" || theme === "gradient";
  const background: Paint =
    theme === "gradient"
      ? { type: "linear", from: palette.primary, to: ramp.primaryDeep, angle: 35 }
      : theme === "light"
        ? solid(palette.surface)
        : solid(palette.primary);

  const onBg = dark ? readableOn(palette.primary) : palette.ink;
  const accentOn = dark ? palette.accent : palette.primary;

  if (theme === "split") {
    elements.push(
      rect({ x: 0, y: 0, w, h: h * 0.42, fill: solid(palette.primary) }),
    );
  }

  // Decorative mark — a translucent disc echoing the brand accent. Kept out of
  // the safe area so it never sits behind the headline.
  if (!compact) {
    elements.push(
      ellipse({
        x: w * 1.02,
        y: h * 0.08,
        rx: Math.min(w, h) * 0.3,
        ry: Math.min(w, h) * 0.3,
        fill: solid(palette.accent, dark ? 0.18 : 0.12),
      }),
    );
  }

  const st = styles(tokens, "px");
  const contentW = w - pad * 2;

  // --- logo ---------------------------------------------------------------
  const logoWidth = compact ? contentW * 0.42 : contentW * 0.34;
  const logo = placeLogo(tokens, {
    x: pad,
    y: pad,
    width: logoWidth,
    variant: theme === "split" ? "mono-light" : dark ? "mono-light" : "full",
    layout: "horizontal",
  });
  elements.push(logo.element);

  // --- headline -----------------------------------------------------------
  // Size the headline to the space available rather than a fixed scale, then
  // shrink it until it fits. This is what keeps a 20-word headline from
  // running off a 300×250 banner.
  const headlineTop = pad + logo.height + (compact ? pad * 0.5 : pad * 0.9);
  const ctaHeight = content.cta && !compact ? h * 0.09 : 0;
  const footerHeight = content.handle && !compact ? h * 0.05 : 0;
  const available = h - headlineTop - pad - ctaHeight - footerHeight;

  let headlineSize = Math.min(w, h) * (compact ? 0.11 : 0.085);
  const headlineStyle = () => ({
    ...st.heading,
    fontSize: headlineSize,
    color: theme === "split" ? palette.ink : onBg,
    lineHeight: 1.14,
    letterSpacing: headlineSize * tokens.fonts.headingTracking,
    wrap: true,
  });

  const subheadSize = () => headlineSize * 0.42;
  const subheadHeight = content.subhead
    ? measureBlock(
        content.subhead,
        { ...st.body, fontSize: subheadSize(), wrap: true },
        contentW,
      ).height + headlineSize * 0.4
    : 0;

  let block = measureBlock(content.headline, headlineStyle(), contentW);
  let guard = 0;
  while (block.height + subheadHeight > available && guard++ < 40) {
    headlineSize *= 0.93;
    block = measureBlock(content.headline, headlineStyle(), contentW);
  }

  const headlineY =
    theme === "split" ? Math.max(headlineTop, h * 0.46) : headlineTop;

  elements.push(
    text({
      x: pad,
      y: headlineY,
      w: contentW,
      text: content.headline,
      style: headlineStyle(),
    }),
  );

  let cursor = headlineY + block.height;

  if (content.subhead && !compact) {
    cursor += headlineSize * 0.35;
    elements.push(
      text({
        x: pad,
        y: cursor,
        w: contentW,
        text: content.subhead,
        style: {
          ...st.body,
          fontSize: subheadSize(),
          color: theme === "split" ? ramp.subtleInk : onBg,
          opacity: dark ? 0.88 : 1,
          lineHeight: 1.4,
          wrap: true,
        },
      }),
    );
  }

  // --- CTA pill -----------------------------------------------------------
  if (content.cta && !compact) {
    const ctaFont = headlineSize * 0.3;
    const ctaW = Math.min(
      contentW,
      measureBlock(content.cta, { ...st.body, fontSize: ctaFont, wrap: false })
        .width +
        ctaFont * 3,
    );
    const ctaH = ctaFont * 2.6;
    const ctaY = h - pad - ctaH - footerHeight;

    elements.push(
      rect({
        x: pad,
        y: ctaY,
        w: ctaW,
        h: ctaH,
        radius: ctaH / 2,
        fill: solid(accentOn),
      }),
    );
    elements.push(
      text({
        x: pad,
        y: ctaY,
        w: ctaW,
        h: ctaH,
        text: content.cta,
        verticalAlign: "middle",
        style: {
          ...st.body,
          fontSize: ctaFont,
          fontWeight: 700,
          align: "center",
          color: readableOn(accentOn),
          wrap: false,
        },
      }),
    );
  }

  // --- handle -------------------------------------------------------------
  if (content.handle && !compact) {
    elements.push(
      text({
        x: pad,
        y: h - pad - footerHeight * 0.6,
        w: contentW,
        text: content.handle,
        style: {
          ...st.small,
          fontSize: headlineSize * 0.26,
          color: theme === "split" ? ramp.subtleInk : onBg,
          opacity: 0.8,
          align: "right",
          wrap: false,
        },
      }),
    );
  }

  return {
    size: { w, h, unit: "px" },
    background,
    elements,
    fonts: [tokens.fonts.heading.family, tokens.fonts.body.family],
    meta: {
      title: `${brand.name} — ${format}`,
      filename: `${format}-post`,
    },
  };
}
