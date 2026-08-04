/**
 * A parser for the *subset* of SVG this engine emits.
 *
 * The PDF renderer cannot consume SVG markup, but the logo and mark composers
 * naturally produce it. Rather than rasterising the logo — which would throw
 * away the vector output that is the entire point of the print pipeline — we
 * parse the handful of element types `marks.ts` and `logo.ts` actually
 * generate and replay them as pdf-lib draw calls.
 *
 * This is deliberately NOT a general SVG parser. It handles exactly what we
 * generate: rect, circle, ellipse, line, polygon, path, text, and `g` with
 * translate/scale transforms. Anything else is skipped rather than guessed at.
 */

export interface Transform {
  tx: number;
  ty: number;
  sx: number;
  sy: number;
}

export const IDENTITY: Transform = { tx: 0, ty: 0, sx: 1, sy: 1 };

export function compose(outer: Transform, inner: Transform): Transform {
  return {
    tx: outer.tx + inner.tx * outer.sx,
    ty: outer.ty + inner.ty * outer.sy,
    sx: outer.sx * inner.sx,
    sy: outer.sy * inner.sy,
  };
}

export function parseTransform(value: string | undefined): Transform {
  if (!value) return { ...IDENTITY };
  let tx = 0;
  let ty = 0;
  let sx = 1;
  let sy = 1;

  const translate = /translate\(\s*(-?[\d.]+)\s*(?:[, ]\s*(-?[\d.]+))?\s*\)/.exec(value);
  if (translate) {
    tx = parseFloat(translate[1]);
    ty = translate[2] !== undefined ? parseFloat(translate[2]) : 0;
  }

  const scale = /scale\(\s*(-?[\d.]+)\s*(?:[, ]\s*(-?[\d.]+))?\s*\)/.exec(value);
  if (scale) {
    sx = parseFloat(scale[1]);
    sy = scale[2] !== undefined ? parseFloat(scale[2]) : sx;
  }

  return { tx, ty, sx, sy };
}

export type SvgNode =
  | { kind: "rect"; x: number; y: number; w: number; h: number; rx: number; fill?: string; stroke?: string; strokeWidth: number; opacity: number; transform: Transform }
  | { kind: "circle"; cx: number; cy: number; r: number; fill?: string; stroke?: string; strokeWidth: number; opacity: number; transform: Transform }
  | { kind: "ellipse"; cx: number; cy: number; rx: number; ry: number; fill?: string; stroke?: string; strokeWidth: number; opacity: number; transform: Transform }
  | { kind: "line"; x1: number; y1: number; x2: number; y2: number; stroke: string; strokeWidth: number; opacity: number; transform: Transform }
  | { kind: "path"; d: string; fill?: string; stroke?: string; strokeWidth: number; opacity: number; transform: Transform }
  | {
      kind: "text";
      x: number;
      y: number;
      text: string;
      fontSize: number;
      fontWeight: number;
      fill: string;
      anchor: "start" | "middle" | "end";
      /** `central`/`middle` centre the glyphs on `y` instead of sitting on it. */
      baseline: "alphabetic" | "central";
      letterSpacing: number;
      fontFamily?: string;
      opacity: number;
      transform: Transform;
    };

const ATTR_RE = /([\w:-]+)\s*=\s*"([^"]*)"/g;

function attrs(tag: string): Record<string, string> {
  const out: Record<string, string> = {};
  ATTR_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = ATTR_RE.exec(tag)) !== null) out[m[1]] = m[2];
  return out;
}

function num(value: string | undefined, fallback = 0): number {
  if (value === undefined) return fallback;
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function paint(value: string | undefined): string | undefined {
  if (!value || value === "none" || value === "transparent") return undefined;
  return value;
}

function unescapeXml(value: string): string {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

/** Convert a `points` list into path data so polygons reuse the path painter. */
export function polygonToPath(points: string): string {
  const pairs = points
    .trim()
    .split(/\s+/)
    .map((p) => p.split(","))
    .filter((p) => p.length === 2);
  if (pairs.length === 0) return "";
  const [first, ...rest] = pairs;
  return (
    `M ${first[0]} ${first[1]} ` +
    rest.map((p) => `L ${p[0]} ${p[1]}`).join(" ") +
    " Z"
  );
}

/**
 * Flatten SVG markup into a list of primitives with absolute transforms.
 * `content` is the inner markup of an SVG (no outer <svg> tag required).
 */
export function parseSvgSubset(
  content: string,
  base: Transform = IDENTITY,
): SvgNode[] {
  const nodes: SvgNode[] = [];
  const stack: Transform[] = [base];

  // One pass over tags. `g` pushes/pops the transform stack; self-closing and
  // paired leaf elements both emit a node.
  const tagRe = /<(\/?)([a-zA-Z]+)([^>]*?)(\/?)>([^<]*)/g;
  let m: RegExpExecArray | null;

  while ((m = tagRe.exec(content)) !== null) {
    const [, closing, name, rawAttrs, selfClosing, textContent] = m;
    const current = stack[stack.length - 1];

    if (closing) {
      if (name === "g" && stack.length > 1) stack.pop();
      continue;
    }

    const a = attrs(rawAttrs);
    const local = parseTransform(a.transform);
    const t = compose(current, local);
    const opacity = num(a.opacity, 1);
    const strokeWidth = num(a["stroke-width"], 0);

    switch (name) {
      case "g": {
        if (!selfClosing) stack.push(t);
        break;
      }
      case "rect":
        nodes.push({
          kind: "rect",
          x: num(a.x),
          y: num(a.y),
          w: num(a.width),
          h: num(a.height),
          rx: num(a.rx),
          fill: paint(a.fill),
          stroke: paint(a.stroke),
          strokeWidth,
          opacity,
          transform: t,
        });
        break;
      case "circle":
        nodes.push({
          kind: "circle",
          cx: num(a.cx),
          cy: num(a.cy),
          r: num(a.r),
          fill: paint(a.fill),
          stroke: paint(a.stroke),
          strokeWidth,
          opacity,
          transform: t,
        });
        break;
      case "ellipse":
        nodes.push({
          kind: "ellipse",
          cx: num(a.cx),
          cy: num(a.cy),
          rx: num(a.rx),
          ry: num(a.ry),
          fill: paint(a.fill),
          stroke: paint(a.stroke),
          strokeWidth,
          opacity,
          transform: t,
        });
        break;
      case "line":
        nodes.push({
          kind: "line",
          x1: num(a.x1),
          y1: num(a.y1),
          x2: num(a.x2),
          y2: num(a.y2),
          stroke: paint(a.stroke) ?? "#000000",
          strokeWidth,
          opacity,
          transform: t,
        });
        break;
      case "polygon":
      case "polyline": {
        const d = polygonToPath(a.points ?? "");
        if (d) {
          nodes.push({
            kind: "path",
            d,
            fill: paint(a.fill),
            stroke: paint(a.stroke),
            strokeWidth,
            opacity,
            transform: t,
          });
        }
        break;
      }
      case "path":
        if (a.d) {
          nodes.push({
            kind: "path",
            d: a.d,
            fill: paint(a.fill),
            stroke: paint(a.stroke),
            strokeWidth,
            opacity,
            transform: t,
          });
        }
        break;
      case "text": {
        const body = textContent ?? "";
        if (body.trim()) {
          nodes.push({
            kind: "text",
            x: num(a.x),
            y: num(a.y),
            text: unescapeXml(body),
            fontSize: num(a["font-size"], 12),
            fontWeight: num(a["font-weight"], 400),
            fill: paint(a.fill) ?? "#000000",
            anchor: (a["text-anchor"] as "start" | "middle" | "end") ?? "start",
            baseline:
              a["dominant-baseline"] === "central" ||
              a["dominant-baseline"] === "middle"
                ? "central"
                : "alphabetic",
            letterSpacing: num(a["letter-spacing"], 0),
            fontFamily: a["font-family"],
            opacity,
            transform: t,
          });
        }
        break;
      }
      default:
        // Unknown element — skipped rather than guessed at.
        break;
    }
  }

  return nodes;
}
