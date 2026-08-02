import type { BrandTokens } from "../tokens";
import { type ComplianceInput, statutoryLines } from "../../compliance/india";
import { composeLogo } from "../logo";
import { escapeXml } from "../marks";

/**
 * HTML email signature.
 *
 * The one asset that is not a DocSpec: email clients render HTML, not vectors,
 * so this produces an inline-styled table — the only layout primitive Outlook
 * renders reliably. The logo is embedded as a base64 SVG data URI, which every
 * modern client and Apple Mail handle; Outlook desktop falls back to the
 * wordmark text, which is why the name is also present as real text.
 *
 * Statutory particulars are included because an external business email is
 * correspondence, and s.12(3)(c) covers business letters.
 */

export interface SignatureHolder {
  name: string;
  designation?: string;
  phone?: string;
  email?: string;
}

export interface SignatureOptions {
  includeStatutory?: boolean;
  logoWidth?: number;
}

export function emailSignatureHtml(
  tokens: BrandTokens,
  brand: ComplianceInput,
  holder: SignatureHolder,
  options: SignatureOptions = {},
): string {
  const { palette, ramp, fonts } = tokens;
  const logoWidth = options.logoWidth ?? 132;
  const logo = composeLogo(tokens, { variant: "full", layout: "horizontal" });
  const logoHeight = Math.round((logo.height / logo.width) * logoWidth);

  // encodeURIComponent rather than base64: keeps multi-byte brand names intact
  // and avoids a Buffer dependency in the browser.
  const logoSrc = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(logo.svg)}`;

  const bodyFont = fonts.body.stack.replace(/"/g, "'");
  const headingFont = fonts.heading.stack.replace(/"/g, "'");

  const cell = (content: string, style = "") =>
    `<td style="${style}">${content}</td>`;

  const contactRows = [
    holder.phone &&
      `<a href="tel:${escapeAttr(holder.phone)}" style="color:${palette.ink};text-decoration:none;">${escapeXml(holder.phone)}</a>`,
    holder.email &&
      `<a href="mailto:${escapeAttr(holder.email)}" style="color:${palette.primary};text-decoration:none;">${escapeXml(holder.email)}</a>`,
  ].filter(Boolean) as string[];

  const statutory =
    options.includeStatutory === false
      ? ""
      : statutoryLines(brand)
          .map(
            (lineText) =>
              `<div style="color:${ramp.subtleInk};font-size:10px;line-height:1.5;">${escapeXml(lineText)}</div>`,
          )
          .join("");

  return `<table cellpadding="0" cellspacing="0" border="0" style="font-family:${bodyFont};color:${palette.ink};font-size:13px;line-height:1.45;">
  <tr>
    ${cell(
      `<img src="${logoSrc}" width="${logoWidth}" height="${logoHeight}" alt="${escapeAttr(brand.name)}" style="display:block;border:0;" />`,
      `padding:0 16px 0 0;vertical-align:top;`,
    )}
    ${cell(
      `<div style="font-family:${headingFont};font-size:15px;font-weight:700;color:${palette.ink};">${escapeXml(holder.name)}</div>` +
        (holder.designation
          ? `<div style="color:${palette.primary};font-size:12px;font-weight:600;">${escapeXml(holder.designation)}</div>`
          : "") +
        (contactRows.length
          ? `<div style="margin-top:6px;font-size:12px;">${contactRows.join(' <span style="color:' + ramp.hairline + '">|</span> ')}</div>`
          : ""),
      `border-left:3px solid ${palette.accent};padding:0 0 0 16px;vertical-align:top;`,
    )}
  </tr>
  ${
    statutory
      ? `<tr><td colspan="2" style="padding:12px 0 0 0;">` +
        `<div style="border-top:1px solid ${ramp.hairline};padding-top:8px;">${statutory}</div>` +
        `</td></tr>`
      : ""
  }
</table>`;
}

function escapeAttr(value: string): string {
  return value.replace(/"/g, "&quot;").replace(/</g, "&lt;");
}
