import type { BrandTokens } from "../tokens";
import { type ComplianceInput, statutoryLines } from "../../compliance/india";
import { type DocSpec, type Element, line, rect, solid, text } from "../doc-spec";
import {
  PAGE_SIZES,
  PRINT_BLEED,
  placeLogo,
  statutoryBlock,
  styles,
} from "./common";

/**
 * Business envelopes (spec 22 §3.4).
 *
 * DL is the default — it takes an A4 letterhead folded in thirds, which is how
 * Indian business correspondence is actually sent.
 */

export type EnvelopeSize = "dl" | "c5" | "c4";

export const ENVELOPE_SIZES: {
  value: EnvelopeSize;
  label: string;
  note: string;
}[] = [
  { value: "dl", label: "DL — 220 × 110 mm", note: "A4 folded in thirds" },
  { value: "c5", label: "C5 — 229 × 162 mm", note: "A4 folded in half" },
  { value: "c4", label: "C4 — 324 × 229 mm", note: "Unfolded A4" },
];

const DIMENSIONS: Record<EnvelopeSize, { w: number; h: number }> = {
  dl: PAGE_SIZES.envelopeDl,
  c5: PAGE_SIZES.envelopeC5,
  c4: PAGE_SIZES.envelopeC4,
};

export interface EnvelopeContent {
  size?: EnvelopeSize;
  /** Draw the recipient address guide block. */
  showRecipientGuide?: boolean;
  variant?: "classic" | "band";
}

export function envelopeSpec(
  tokens: BrandTokens,
  brand: ComplianceInput,
  content: EnvelopeContent = {},
): DocSpec {
  const size = content.size ?? "dl";
  const variant = content.variant ?? "classic";
  const { w, h } = DIMENSIONS[size];
  const { palette, ramp } = tokens;
  const st = styles(tokens, "mm");
  const elements: Element[] = [];

  const margin = size === "c4" ? 16 : 11;

  if (variant === "band") {
    const bandHeight = Math.max(18, h * 0.16);
    elements.push(
      rect({ x: 0, y: 0, w, h: bandHeight, fill: solid(palette.primary) }),
    );
  }

  // --- sender block (top-left) --------------------------------------------
  const logoWidth = size === "c4" ? 46 : 34;
  const logo = placeLogo(tokens, {
    x: margin,
    y: variant === "band" ? Math.max(18, h * 0.16) + 8 : margin,
    width: logoWidth,
    layout: "horizontal",
    variant: "full",
  });
  elements.push(logo.element);

  const senderLines = statutoryLines(brand);
  const senderTop = logo.element.y + logo.height + 4;
  const sender = statutoryBlock(senderLines, {
    x: margin,
    y: senderTop,
    width: w * 0.55,
    style: { ...st.micro, wrap: false },
  });
  elements.push(...sender.elements);

  // --- recipient guide (lower right) --------------------------------------
  if (content.showRecipientGuide !== false) {
    const boxW = w * 0.46;
    const boxH = h * 0.34;
    const boxX = w - margin - boxW;
    const boxY = h - margin - boxH;

    elements.push(
      text({
        x: boxX,
        y: boxY - 6,
        w: boxW,
        text: "To",
        style: { ...st.label, wrap: false },
      }),
    );

    const rule = 7;
    for (let i = 0; i * rule < boxH; i++) {
      elements.push(
        line({
          x: boxX,
          y: boxY + i * rule,
          x2: boxX + boxW - (i === 0 ? 0 : boxW * 0.12 * (i % 3)),
          y2: boxY + i * rule,
          color: ramp.hairline,
          width: 0.3,
        }),
      );
    }
  }

  // Postal indicia zone — Indian postal sorting reads the lower-right corner,
  // so nothing but the address may sit there.
  return {
    size: { w, h, unit: "mm" },
    bleed: PRINT_BLEED,
    cropMarks: true,
    background: solid(palette.surface),
    elements,
    fonts: [tokens.fonts.heading.family, tokens.fonts.body.family],
    meta: {
      title: `${brand.legalName ?? brand.name} — ${size.toUpperCase()} envelope`,
      filename: `envelope-${size}`,
    },
  };
}
