import QRCode from "qrcode";

/**
 * Synchronous QR generation for the layout engine.
 *
 * `qrcode`'s convenience helpers are async, which would force every layout
 * that embeds a QR to become async and break their purity. `QRCode.create` is
 * synchronous, so we build the path data ourselves and keep layouts pure and
 * unit-testable.
 *
 * Output is a single path in a viewBox sized to the module count, which the
 * PDF renderer draws as vector — a QR that stays scannable at any print size.
 */

export interface QrGraphic {
  viewBox: string;
  content: string;
  /** Module count per side, including the quiet zone. */
  modules: number;
}

export function qrSvg(
  data: string,
  options: {
    color?: string;
    background?: string;
    /** Quiet zone in modules. The spec's minimum is 4. */
    margin?: number;
    errorCorrectionLevel?: "L" | "M" | "Q" | "H";
  } = {},
): QrGraphic {
  const margin = options.margin ?? 4;
  const color = options.color ?? "#000000";

  const qr = QRCode.create(data, {
    errorCorrectionLevel: options.errorCorrectionLevel ?? "M",
  });

  const size = qr.modules.size;
  const bits = qr.modules.data;
  const total = size + margin * 2;

  // One path with a subpath per dark module. Adjacent modules share edges
  // cleanly at integer coordinates, so no seams appear when scaled.
  const parts: string[] = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (bits[y * size + x]) {
        parts.push(`M${x + margin} ${y + margin}h1v1h-1z`);
      }
    }
  }

  const bg = options.background
    ? `<rect x="0" y="0" width="${total}" height="${total}" fill="${options.background}"/>`
    : "";

  return {
    viewBox: `0 0 ${total} ${total}`,
    content: `${bg}<path d="${parts.join("")}" fill="${color}"/>`,
    modules: total,
  };
}

/** A vCard payload, so scanning an employee badge adds the contact. */
export function vCard(fields: {
  name: string;
  organisation?: string;
  title?: string;
  phone?: string;
  email?: string;
  url?: string;
}): string {
  const escape = (v: string) => v.replace(/([,;\\])/g, "\\$1");
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${escape(fields.name)}`,
    fields.organisation && `ORG:${escape(fields.organisation)}`,
    fields.title && `TITLE:${escape(fields.title)}`,
    fields.phone && `TEL;TYPE=WORK,VOICE:${escape(fields.phone)}`,
    fields.email && `EMAIL;TYPE=WORK:${escape(fields.email)}`,
    fields.url && `URL:${escape(fields.url)}`,
    "END:VCARD",
  ].filter(Boolean);
  return lines.join("\n");
}
