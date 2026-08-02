import type { BrandTokens } from "../tokens";
import type { ComplianceInput } from "../../compliance/india";
import { type DocSpec, type Element, line, rect, solid, text } from "../doc-spec";
import {
  PAGE_SIZES,
  PRINT_BLEED,
  PRINT_SAFE,
  placeLogo,
  styles,
} from "./common";

/**
 * Visiting card, 89 × 54 mm — the Indian standard size, which differs from the
 * US 3.5 × 2in card most design tools default to. Printed with 3 mm bleed and
 * crop marks so it can go straight to a press.
 */

export interface CardHolder {
  name: string;
  designation?: string;
  phone?: string;
  email?: string;
  website?: string;
}

export interface BusinessCardContent {
  holder: CardHolder;
  side?: "front" | "back";
  variant?: "classic" | "band" | "centered";
}

export function businessCardSpec(
  tokens: BrandTokens,
  brand: ComplianceInput,
  content: BusinessCardContent,
): DocSpec {
  const { w, h } = PAGE_SIZES.businessCard;
  const side = content.side ?? "front";
  const variant = content.variant ?? "classic";
  const { palette, ramp } = tokens;
  const st = styles(tokens, "mm");
  const elements: Element[] = [];
  const margin = PRINT_SAFE + 2;

  if (side === "back") {
    // The reverse is the brand side: full-bleed primary with the reversed
    // logo centred. Nothing statutory goes here.
    elements.push(
      rect({
        x: -PRINT_BLEED,
        y: -PRINT_BLEED,
        w: w + PRINT_BLEED * 2,
        h: h + PRINT_BLEED * 2,
        fill: solid(palette.primary),
      }),
    );
    const logoWidth = w * 0.52;
    const probe = placeLogo(tokens, {
      x: 0,
      y: 0,
      width: logoWidth,
      variant: "mono-light",
      layout: "stacked",
    });
    const logo = placeLogo(tokens, {
      x: (w - logoWidth) / 2,
      y: (h - probe.height) / 2,
      width: logoWidth,
      variant: "mono-light",
      layout: "stacked",
    });
    elements.push(logo.element);

    return {
      size: { w, h, unit: "mm" },
      bleed: PRINT_BLEED,
      cropMarks: true,
      background: solid(palette.primary),
      elements,
      fonts: [tokens.fonts.heading.family, tokens.fonts.body.family],
      meta: {
        title: `${content.holder.name} — visiting card (back)`,
        filename: "business-card-back",
      },
    };
  }

  // --- front --------------------------------------------------------------
  const centered = variant === "centered";

  if (variant === "band") {
    elements.push(
      rect({ x: -PRINT_BLEED, y: -PRINT_BLEED, w: w + PRINT_BLEED * 2, h: 4 + PRINT_BLEED, fill: solid(palette.primary) }),
    );
  }

  const logoWidth = centered ? w * 0.42 : w * 0.38;
  const logo = placeLogo(tokens, {
    x: centered ? (w - logoWidth) / 2 : margin,
    y: variant === "band" ? margin + 3 : margin,
    width: logoWidth,
    layout: centered ? "stacked" : "horizontal",
  });
  elements.push(logo.element);

  const align = centered ? ("center" as const) : ("left" as const);
  const colX = centered ? margin : margin;
  const colW = w - margin * 2;

  // Holder block sits below the logo, above the contact lines.
  const holderTop = centered
    ? logo.element.y + logo.height + 3
    : h - margin - 18;

  elements.push(
    text({
      x: colX,
      y: holderTop,
      w: colW,
      text: content.holder.name,
      style: {
        ...st.subheading,
        fontSize: 3.6,
        align,
        wrap: false,
        color: palette.ink,
      },
    }),
  );

  if (content.holder.designation) {
    elements.push(
      text({
        x: colX,
        y: holderTop + 4.6,
        w: colW,
        text: content.holder.designation,
        style: {
          ...st.small,
          fontSize: 2.5,
          align,
          wrap: false,
          color: palette.primary,
          letterSpacing: 0.12,
          transform: "uppercase",
        },
      }),
    );
  }

  const contactLines = [
    content.holder.phone,
    content.holder.email,
    content.holder.website ?? brand.registeredAddress?.split("\n")[0],
  ].filter(Boolean) as string[];

  const contactTop = holderTop + 9;
  if (!centered) {
    elements.push(
      line({
        x: colX,
        y: contactTop - 2.4,
        x2: colX + colW * 0.28,
        y2: contactTop - 2.4,
        color: palette.accent,
        width: 0.5,
      }),
    );
  }

  contactLines.forEach((value, i) => {
    elements.push(
      text({
        x: colX,
        y: contactTop + i * 3.4,
        w: colW,
        text: value,
        style: { ...st.micro, fontSize: 2.4, align, wrap: false },
      }),
    );
  });

  return {
    size: { w, h, unit: "mm" },
    bleed: PRINT_BLEED,
    cropMarks: true,
    background: solid(palette.surface),
    elements,
    fonts: [tokens.fonts.heading.family, tokens.fonts.body.family],
    meta: {
      title: `${content.holder.name} — visiting card`,
      filename: "business-card",
    },
  };
}
