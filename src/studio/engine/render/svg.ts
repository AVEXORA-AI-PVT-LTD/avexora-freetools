import {
  type DocSpec,
  type Element,
  type Paint,
  type TextElement,
  bleedBox,
} from "../doc-spec";
import { escapeXml } from "../marks";
import { lineHeightFor, measureBlock } from "./text-layout";

/**
 * DocSpec → SVG (spec 22 §3.2).
 *
 * Powers the browser preview and the SVG download. Coordinates are emitted in
 * the document's own units with a matching `viewBox`, so an mm-authored
 * letterhead and a px-authored social post both render correctly without the
 * layout knowing which it is.
 */

const round = (v: number) => Math.round(v * 1000) / 1000;

function paintId(index: number) {
  return `g${index}`;
}

function collectGradients(spec: DocSpec): {
  defs: string;
  refs: Map<Paint, string>;
} {
  const refs = new Map<Paint, string>();
  const defs: string[] = [];
  let i = 0;

  const consider = (paint?: Paint) => {
    if (!paint || paint.type !== "linear" || refs.has(paint)) return;
    const id = paintId(i++);
    refs.set(paint, id);
    const angle = ((paint.angle ?? 0) * Math.PI) / 180;
    const x2 = round(Math.cos(angle) * 100);
    const y2 = round(Math.sin(angle) * 100);
    defs.push(
      `<linearGradient id="${id}" x1="0%" y1="0%" x2="${x2}%" y2="${y2}%">` +
        `<stop offset="0%" stop-color="${paint.from}"/>` +
        `<stop offset="100%" stop-color="${paint.to}"/>` +
        `</linearGradient>`,
    );
  };

  consider(spec.background);
  for (const el of spec.elements) {
    if (el.kind === "rect" || el.kind === "ellipse") consider(el.fill);
  }

  return {
    defs: defs.length ? `<defs>${defs.join("")}</defs>` : "",
    refs,
  };
}

function fillAttr(paint: Paint | undefined, refs: Map<Paint, string>): string {
  if (!paint) return 'fill="none"';
  if (paint.type === "linear") return `fill="url(#${refs.get(paint)})"`;
  const opacity =
    paint.opacity !== undefined && paint.opacity !== 1
      ? ` fill-opacity="${paint.opacity}"`
      : "";
  return `fill="${paint.color}"${opacity}`;
}

function renderText(el: TextElement): string {
  const { style } = el;
  const { lines } = measureBlock(el.text, style, el.w);
  const lh = lineHeightFor(style);

  // SVG has no vertical-align, so the first baseline is computed here. Text is
  // positioned from its top edge by default, matching how layouts think.
  let firstBaseline = el.y + style.fontSize * 0.82;
  if (el.verticalAlign === "middle" && el.h) {
    firstBaseline =
      el.y + (el.h - lines.length * lh) / 2 + style.fontSize * 0.82;
  } else if (el.verticalAlign === "bottom" && el.h) {
    firstBaseline = el.y + el.h - lines.length * lh + style.fontSize * 0.82;
  }

  const align = style.align ?? "left";
  const anchor =
    align === "center" ? "middle" : align === "right" ? "end" : "start";
  const x =
    align === "center"
      ? el.x + (el.w ?? 0) / 2
      : align === "right"
        ? el.x + (el.w ?? 0)
        : el.x;

  const attrs = [
    `font-family="${escapeXml(style.fontFamily)}"`,
    `font-size="${round(style.fontSize)}"`,
    `font-weight="${style.fontWeight ?? 400}"`,
    `fill="${style.color}"`,
    `text-anchor="${anchor}"`,
    style.letterSpacing ? `letter-spacing="${round(style.letterSpacing)}"` : "",
    style.italic ? 'font-style="italic"' : "",
    style.opacity !== undefined ? `opacity="${style.opacity}"` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const tspans = lines
    .map(
      (lineText, i) =>
        `<tspan x="${round(x)}" y="${round(firstBaseline + i * lh)}">${escapeXml(lineText)}</tspan>`,
    )
    .join("");

  return `<text ${attrs}>${tspans}</text>`;
}

function renderElement(el: Element, refs: Map<Paint, string>): string {
  const op =
    el.opacity !== undefined && el.opacity !== 1
      ? ` opacity="${el.opacity}"`
      : "";

  switch (el.kind) {
    case "text":
      return renderText(el);

    case "rect": {
      const stroke = el.stroke
        ? ` stroke="${el.stroke.color}" stroke-width="${round(el.stroke.width)}"`
        : "";
      const rx = el.radius ? ` rx="${round(el.radius)}"` : "";
      return `<rect x="${round(el.x)}" y="${round(el.y)}" width="${round(el.w)}" height="${round(el.h)}"${rx} ${fillAttr(el.fill, refs)}${stroke}${op}/>`;
    }

    case "line": {
      const dash = el.dash ? ` stroke-dasharray="${el.dash.join(" ")}"` : "";
      return `<line x1="${round(el.x)}" y1="${round(el.y)}" x2="${round(el.x2)}" y2="${round(el.y2)}" stroke="${el.color}" stroke-width="${round(el.width)}"${dash}${op}/>`;
    }

    case "ellipse": {
      const stroke = el.stroke
        ? ` stroke="${el.stroke.color}" stroke-width="${round(el.stroke.width)}"`
        : "";
      return `<ellipse cx="${round(el.x)}" cy="${round(el.y)}" rx="${round(el.rx)}" ry="${round(el.ry)}" ${fillAttr(el.fill, refs)}${stroke}${op}/>`;
    }

    case "svg": {
      // Nested <svg> gives us clipping and aspect-ratio handling for free.
      const par = el.fit === false ? "none" : "xMidYMid meet";
      return `<svg x="${round(el.x)}" y="${round(el.y)}" width="${round(el.w)}" height="${round(el.h)}" viewBox="${el.viewBox}" preserveAspectRatio="${par}"${op}>${el.content}</svg>`;
    }

    case "image": {
      const clip = el.radius
        ? ` clip-path="inset(0 round ${round(el.radius)})"`
        : "";
      return `<image x="${round(el.x)}" y="${round(el.y)}" width="${round(el.w)}" height="${round(el.h)}" href="${escapeXml(el.href)}" preserveAspectRatio="xMidYMid slice"${clip}${op}/>`;
    }
  }
}

/** Crop marks sit in the bleed margin and mark the trim box corners. */
function cropMarks(spec: DocSpec): string {
  const b = spec.bleed ?? 0;
  if (!b || !spec.cropMarks) return "";
  const len = Math.min(b * 0.8, 4);
  const w = spec.size.w;
  const h = spec.size.h;
  const stroke = `stroke="#000000" stroke-width="${round(b * 0.06)}"`;
  const marks: string[] = [];
  const corners = [
    [b, b, -1, -1],
    [b + w, b, 1, -1],
    [b, b + h, -1, 1],
    [b + w, b + h, 1, 1],
  ];
  for (const [x, y, dx, dy] of corners) {
    marks.push(
      `<line x1="${round(x + dx * (b - len))}" y1="${round(y)}" x2="${round(x + dx * b)}" y2="${round(y)}" ${stroke}/>`,
    );
    marks.push(
      `<line x1="${round(x)}" y1="${round(y + dy * (b - len))}" x2="${round(x)}" y2="${round(y + dy * b)}" ${stroke}/>`,
    );
  }
  return marks.join("");
}

export function renderSvg(
  spec: DocSpec,
  options: { includeBleed?: boolean } = {},
): string {
  const includeBleed = options.includeBleed ?? Boolean(spec.bleed);
  const b = includeBleed ? (spec.bleed ?? 0) : 0;
  const box = includeBleed ? bleedBox(spec) : spec.size;
  const { defs, refs } = collectGradients(spec);

  const bg = spec.background
    ? `<rect x="0" y="0" width="${round(box.w)}" height="${round(box.h)}" ${fillAttr(spec.background, refs)}/>`
    : "";

  const body = spec.elements.map((el) => renderElement(el, refs)).join("");

  // Everything the layout produced is positioned relative to the trim box, so
  // a single translate applies the bleed offset rather than every layout
  // having to know about it.
  const content = b
    ? `${bg}<g transform="translate(${round(b)}, ${round(b)})">${body}</g>${cropMarks(spec)}`
    : `${bg}${body}`;

  const unitSuffix = spec.size.unit === "mm" ? "mm" : "";

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" ` +
    `width="${round(box.w)}${unitSuffix}" height="${round(box.h)}${unitSuffix}" ` +
    `viewBox="0 0 ${round(box.w)} ${round(box.h)}">${defs}${content}</svg>`
  );
}
