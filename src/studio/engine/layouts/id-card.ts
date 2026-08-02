import type { BrandTokens } from "../tokens";
import type { ComplianceInput } from "../../compliance/india";
import {
  type DocSpec,
  type Element,
  image,
  line,
  rect,
  solid,
  svg,
  text,
} from "../doc-spec";
import { qrSvg, vCard } from "../qr";
import { PAGE_SIZES, PRINT_BLEED, PRINT_SAFE, placeLogo, styles } from "./common";

/**
 * Employee ID card, CR80 (85.6 × 54 mm) — ISO/IEC 7810 ID-1, the size every
 * badge printer and lanyard holder expects.
 *
 * This closes the gap identified in the research (21 §3, gap 3): Indian HR
 * platforms track "issue ID card" as an onboarding task but none of them
 * produce the card, and design tools have the templates but none of the
 * employee data. Here the batch comes straight off the employee list.
 */

export interface IdCardEmployee {
  name: string;
  designation?: string | null;
  empCode?: string | null;
  department?: string | null;
  bloodGroup?: string | null;
  phone?: string | null;
  email?: string | null;
  /** data: URI. Photos never leave the browser. */
  photoUrl?: string | null;
  validUntil?: string | null;
}

export interface IdCardContent {
  employee: IdCardEmployee;
  orientation?: "landscape" | "portrait";
  side?: "front" | "back";
  /** Emergency/return instructions printed on the reverse. */
  returnPolicy?: string;
}

export function idCardSpec(
  tokens: BrandTokens,
  brand: ComplianceInput,
  content: IdCardContent,
): DocSpec {
  const orientation = content.orientation ?? "portrait";
  const side = content.side ?? "front";
  const { palette } = tokens;
  const st = styles(tokens, "mm");

  const w = orientation === "portrait" ? PAGE_SIZES.cr80.h : PAGE_SIZES.cr80.w;
  const h = orientation === "portrait" ? PAGE_SIZES.cr80.w : PAGE_SIZES.cr80.h;

  const elements: Element[] =
    side === "front"
      ? frontElements(tokens, brand, content, w, h, orientation, st)
      : backElements(tokens, brand, content, w, h, st);

  const org = brand.legalName ?? brand.name;

  return {
    size: { w, h, unit: "mm" },
    bleed: PRINT_BLEED,
    cropMarks: true,
    background: solid(palette.surface),
    elements,
    fonts: [tokens.fonts.heading.family, tokens.fonts.body.family],
    meta: {
      title: `${content.employee.name} — ${org} ID card (${side})`,
      filename: `id-card-${slug(content.employee.name)}-${side}`,
    },
  };
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function frontElements(
  tokens: BrandTokens,
  brand: ComplianceInput,
  content: IdCardContent,
  w: number,
  h: number,
  orientation: "landscape" | "portrait",
  st: ReturnType<typeof styles>,
): Element[] {
  const { palette, ramp } = tokens;
  const { employee } = content;
  const elements: Element[] = [];
  const pad = PRINT_SAFE;

  // Header band carries the org identity so the card is recognisable at a
  // glance across a room.
  const headerH = orientation === "portrait" ? 13 : 11;
  elements.push(
    rect({
      x: -PRINT_BLEED,
      y: -PRINT_BLEED,
      w: w + PRINT_BLEED * 2,
      h: headerH + PRINT_BLEED,
      fill: solid(palette.primary),
    }),
  );

  const logoWidth = orientation === "portrait" ? w * 0.5 : w * 0.34;
  const probe = placeLogo(tokens, {
    x: 0,
    y: 0,
    width: logoWidth,
    variant: "mono-light",
    layout: "horizontal",
  });
  elements.push(
    placeLogo(tokens, {
      x: pad,
      y: Math.max(1, (headerH - probe.height) / 2),
      width: logoWidth,
      variant: "mono-light",
      layout: "horizontal",
    }).element,
  );

  // Photo
  const photoW = orientation === "portrait" ? 22 : 20;
  const photoH = photoW * 1.22;
  const photoX = orientation === "portrait" ? (w - photoW) / 2 : pad;
  const photoY = headerH + 4;

  if (employee.photoUrl) {
    elements.push(
      image({
        x: photoX,
        y: photoY,
        w: photoW,
        h: photoH,
        href: employee.photoUrl,
        radius: 1.5,
      }),
    );
  } else {
    elements.push(
      rect({
        x: photoX,
        y: photoY,
        w: photoW,
        h: photoH,
        fill: solid(ramp.primarySoft),
        radius: 1.5,
        stroke: { color: ramp.hairline, width: 0.3 },
      }),
    );
    elements.push(
      text({
        x: photoX,
        y: photoY + photoH / 2 - 2,
        w: photoW,
        text: "PHOTO",
        style: {
          ...st.micro,
          fontSize: 2.2,
          align: "center",
          wrap: false,
          color: ramp.subtleInk,
          letterSpacing: 0.2,
        },
      }),
    );
  }

  // Identity block
  const infoX = orientation === "portrait" ? pad : photoX + photoW + 4;
  const infoW = orientation === "portrait" ? w - pad * 2 : w - infoX - pad;
  const infoAlign = orientation === "portrait" ? ("center" as const) : ("left" as const);
  let y = orientation === "portrait" ? photoY + photoH + 3.5 : photoY + 1;

  elements.push(
    text({
      x: infoX,
      y,
      w: infoW,
      text: employee.name,
      style: {
        ...st.subheading,
        fontSize: 3.5,
        align: infoAlign,
        wrap: false,
        color: palette.ink,
      },
    }),
  );
  y += 4.4;

  if (employee.designation) {
    elements.push(
      text({
        x: infoX,
        y,
        w: infoW,
        text: employee.designation,
        style: {
          ...st.small,
          fontSize: 2.4,
          align: infoAlign,
          wrap: false,
          color: palette.primary,
        },
      }),
    );
    y += 3.4;
  }

  if (employee.department) {
    elements.push(
      text({
        x: infoX,
        y,
        w: infoW,
        text: employee.department,
        style: { ...st.micro, fontSize: 2.2, align: infoAlign, wrap: false },
      }),
    );
    y += 3.2;
  }

  // Employee code and blood group — the two fields that matter in an
  // emergency, so they get their own row.
  const facts = [
    employee.empCode && `ID ${employee.empCode}`,
    employee.bloodGroup && `Blood ${employee.bloodGroup}`,
  ].filter(Boolean) as string[];

  if (facts.length) {
    elements.push(
      text({
        x: infoX,
        y: y + 0.5,
        w: infoW,
        text: facts.join("   ·   "),
        style: {
          ...st.micro,
          fontSize: 2.2,
          align: infoAlign,
          wrap: false,
          fontWeight: 600,
          color: palette.ink,
        },
      }),
    );
  }

  // QR carrying a vCard, bottom-right, clear of the identity block.
  const qrSize = 13;
  const qr = qrSvg(
    vCard({
      name: employee.name,
      organisation: brand.legalName ?? brand.name,
      title: employee.designation ?? undefined,
      phone: employee.phone ?? undefined,
      email: employee.email ?? undefined,
    }),
    { color: palette.ink, margin: 2 },
  );
  elements.push(
    svg({
      x: w - pad - qrSize,
      y: h - pad - qrSize,
      w: qrSize,
      h: qrSize,
      viewBox: qr.viewBox,
      content: qr.content,
    }),
  );

  if (employee.validUntil) {
    elements.push(
      text({
        x: pad,
        y: h - pad - 3,
        w: w - pad * 2 - qrSize - 2,
        text: `Valid until ${employee.validUntil}`,
        style: { ...st.micro, fontSize: 2.1, wrap: false },
      }),
    );
  }

  return elements;
}

function backElements(
  tokens: BrandTokens,
  brand: ComplianceInput,
  content: IdCardContent,
  w: number,
  h: number,
  st: ReturnType<typeof styles>,
): Element[] {
  const { palette, ramp } = tokens;
  const elements: Element[] = [];
  const pad = PRINT_SAFE;

  elements.push(
    text({
      x: pad,
      y: pad,
      w: w - pad * 2,
      text: brand.legalName ?? brand.name,
      style: { ...st.small, fontWeight: 700, wrap: false, color: palette.ink },
    }),
  );

  const address = [
    brand.registeredAddress?.replace(/\n/g, ", "),
    [brand.city, brand.state].filter(Boolean).join(", "),
    brand.pincode,
  ]
    .filter(Boolean)
    .join(", ");

  let y = pad + 4;
  if (address) {
    elements.push(
      text({
        x: pad,
        y,
        w: w - pad * 2,
        text: address,
        style: { ...st.micro, fontSize: 2.1, wrap: true },
      }),
    );
    y += 6;
  }

  const contact = [brand.phone && `T ${brand.phone}`, brand.email && `E ${brand.email}`]
    .filter(Boolean)
    .join("   ·   ");
  if (contact) {
    elements.push(
      text({
        x: pad,
        y,
        w: w - pad * 2,
        text: contact,
        style: { ...st.micro, fontSize: 2.1, wrap: false },
      }),
    );
    y += 4;
  }

  elements.push(
    line({
      x: pad,
      y,
      x2: w - pad,
      y2: y,
      color: ramp.hairline,
      width: 0.3,
    }),
  );
  y += 3;

  elements.push(
    text({
      x: pad,
      y,
      w: w - pad * 2,
      text:
        content.returnPolicy ??
        "This card is the property of the company and is non-transferable. If found, please return it to the registered office address above.",
      style: { ...st.micro, fontSize: 2, wrap: true, lineHeight: 1.4 },
    }),
  );

  // Signature rule at the foot.
  elements.push(
    line({
      x: w - pad - 26,
      y: h - pad - 3.5,
      x2: w - pad,
      y2: h - pad - 3.5,
      color: ramp.hairline,
      width: 0.3,
    }),
  );
  elements.push(
    text({
      x: w - pad - 26,
      y: h - pad - 3,
      w: 26,
      text: "Authorised signatory",
      style: {
        ...st.micro,
        fontSize: 1.9,
        align: "center",
        wrap: false,
        color: ramp.subtleInk,
      },
    }),
  );

  return elements;
}

/** Build a print sheet: every employee's front and back, one card per page. */
export function idCardBatch(
  tokens: BrandTokens,
  brand: ComplianceInput,
  employees: IdCardEmployee[],
  options: {
    orientation?: "landscape" | "portrait";
    includeBack?: boolean;
    returnPolicy?: string;
  } = {},
): DocSpec[] {
  const specs: DocSpec[] = [];
  for (const employee of employees) {
    specs.push(
      idCardSpec(tokens, brand, {
        employee,
        orientation: options.orientation,
        side: "front",
      }),
    );
    if (options.includeBack !== false) {
      specs.push(
        idCardSpec(tokens, brand, {
          employee,
          orientation: options.orientation,
          side: "back",
          returnPolicy: options.returnPolicy,
        }),
      );
    }
  }
  return specs;
}
