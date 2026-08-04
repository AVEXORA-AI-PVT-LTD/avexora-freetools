import type { BrandTokens } from "../tokens";
import { type ComplianceInput, statutoryLines } from "../../compliance/india";
import { type DocSpec, type Element, line, rect, solid, text } from "../doc-spec";
import { PAGE_SIZES, placeLogo, statutoryBlock, styles } from "./common";

/**
 * A4 letterhead (spec 22 §3.4).
 *
 * This is the document Companies Act s.12(3)(c) is actually about, so the
 * statutory footer is not optional decoration — it is the reason the layout
 * reserves a fixed band at the page foot before anything else is placed.
 */

export interface LetterheadContent {
  /** Optional body copy, for the preview and for "letter" exports. */
  body?: string;
  /** Show a ruled area suggesting where the letter text goes. */
  showBodyPlaceholder?: boolean;
  variant?: "classic" | "band" | "sidebar";
}

const MARGIN = 18;

export function letterheadSpec(
  tokens: BrandTokens,
  brand: ComplianceInput,
  content: LetterheadContent = {},
): DocSpec {
  const variant = content.variant ?? "classic";
  const { palette, ramp } = tokens;
  const st = styles(tokens, "mm");
  const { w, h } = PAGE_SIZES.a4;
  const elements: Element[] = [];

  const lines = statutoryLines(brand);
  // Reserve the footer first — everything else flows into what's left.
  const footerStyle = { ...st.micro, wrap: false as const };
  const footerLineHeight =
    footerStyle.fontSize * (footerStyle.lineHeight ?? 1.5);
  const footerHeight = lines.length * footerLineHeight;
  const footerTop = h - MARGIN - footerHeight;

  let contentLeft = MARGIN;
  const contentRight = w - MARGIN;
  let headerBottom: number;

  if (variant === "band") {
    const bandHeight = 34;
    elements.push(
      rect({ x: 0, y: 0, w, h: bandHeight, fill: solid(palette.primary) }),
    );
    // mono-light, not reversed: the reversed variant paints its own primary
    // background, which would double up on the band.
    const logoWidth = 46;
    const probe = placeLogo(tokens, {
      x: MARGIN,
      y: 0,
      width: logoWidth,
      variant: "mono-light",
      layout: "horizontal",
    });
    const logo = placeLogo(tokens, {
      x: MARGIN,
      y: (bandHeight - probe.height) / 2,
      width: logoWidth,
      variant: "mono-light",
      layout: "horizontal",
    });
    elements.push(logo.element);
    headerBottom = bandHeight + 16;
  } else if (variant === "sidebar") {
    const sidebarWidth = 46;
    elements.push(
      rect({
        x: 0,
        y: 0,
        w: sidebarWidth,
        h,
        fill: solid(ramp.primarySoft),
      }),
    );
    const logo = placeLogo(tokens, {
      x: 10,
      y: MARGIN,
      width: sidebarWidth - 20,
      layout: "stacked",
    });
    elements.push(logo.element);
    contentLeft = sidebarWidth + 16;
    headerBottom = MARGIN;
  } else {
    const logo = placeLogo(tokens, {
      x: MARGIN,
      y: MARGIN,
      width: 52,
      layout: tokens.logoLayout === "icon" ? "horizontal" : tokens.logoLayout,
    });
    elements.push(logo.element);

    // Contact column, right-aligned opposite the logo.
    const contact = [
      brand.phone?.trim(),
      brand.email?.trim(),
      brand.registeredAddress?.trim()?.split("\n")[0],
    ].filter(Boolean) as string[];

    contact.forEach((value, i) => {
      elements.push(
        text({
          x: w / 2,
          y: MARGIN + 2 + i * (st.small.fontSize * 1.5),
          w: w / 2 - MARGIN,
          text: value,
          style: { ...st.small, align: "right", wrap: false },
        }),
      );
    });

    headerBottom = MARGIN + Math.max(logo.height, contact.length * 5) + 10;
    elements.push(
      line({
        x: MARGIN,
        y: headerBottom,
        x2: w - MARGIN,
        y2: headerBottom,
        color: ramp.hairline,
        width: 0.4,
      }),
    );
    headerBottom += 12;
  }

  // --- body ---------------------------------------------------------------
  if (content.body) {
    elements.push(
      text({
        x: contentLeft,
        y: headerBottom,
        w: contentRight - contentLeft,
        h: footerTop - headerBottom - 10,
        text: content.body,
        style: { ...st.body, wrap: true },
      }),
    );
  } else if (content.showBodyPlaceholder !== false) {
    // Ruled guides so the preview reads as a letterhead rather than an empty
    // page. Never exported — callers pass showBodyPlaceholder: false.
    const guideTop = headerBottom + 6;
    const guideBottom = footerTop - 14;
    const gap = 8;
    for (let y = guideTop; y < guideBottom; y += gap) {
      elements.push(
        line({
          x: contentLeft,
          y,
          x2: contentRight - (y + gap >= guideBottom ? 60 : 0),
          y2: y,
          color: ramp.hairline,
          width: 0.25,
          opacity: 0.7,
        }),
      );
    }
  }

  // --- statutory footer ---------------------------------------------------
  if (lines.length > 0) {
    elements.push(
      line({
        x: contentLeft,
        y: footerTop - 6,
        x2: contentRight,
        y2: footerTop - 6,
        color: palette.accent,
        width: 0.8,
      }),
    );
    const footer = statutoryBlock(lines, {
      x: contentLeft,
      y: footerTop,
      width: contentRight - contentLeft,
      style: footerStyle,
    });
    elements.push(...footer.elements);
  }

  return {
    size: { w, h, unit: "mm" },
    background: solid(palette.surface),
    elements,
    fonts: [tokens.fonts.heading.family, tokens.fonts.body.family],
    meta: {
      title: `${brand.legalName ?? brand.name} — Letterhead`,
      filename: "letterhead",
    },
  };
}

export const LETTERHEAD_VARIANTS: NonNullable<LetterheadContent["variant"]>[] = [
  "classic",
  "band",
  "sidebar",
];
