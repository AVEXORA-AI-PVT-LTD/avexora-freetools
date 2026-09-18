export interface SignFontMeta {
  readonly family: string;
  readonly file: string;
}

export const SIGN_FONTS: readonly SignFontMeta[] = [
  { family: "AvexCaveat", file: "/fonts/caveat.ttf" },
  { family: "AvexDancingScript", file: "/fonts/dancing-script.ttf" },
  { family: "AvexGreatVibes", file: "/fonts/great-vibes.ttf" },
  { family: "AvexPacifico", file: "/fonts/pacifico.ttf" },
];

export interface SignatureStyle {
  readonly id: string;
  readonly label: string;
  readonly fontFamily: string;
  readonly fontSize: number;
  readonly tiltDeg: number;
  readonly slantDeg: number;
  readonly waveAmp: number;
  readonly waveLen: number;
  readonly letterSpacing: number;
  readonly underline: boolean;
  readonly ink: string;
  readonly inkAlpha: number;
}

export const SIGNATURE_STYLES: readonly SignatureStyle[] = [
  {
    id: "style-1",
    label: "Classic Script",
    fontFamily: "AvexDancingScript",
    fontSize: 200,
    tiltDeg: -4,
    slantDeg: 0,
    waveAmp: 6,
    waveLen: 240,
    letterSpacing: 2,
    underline: false,
    ink: "#1d4ed8",
    inkAlpha: 1,
  },
  {
    id: "style-2",
    label: "Pen & Ink",
    fontFamily: "AvexCaveat",
    fontSize: 230,
    tiltDeg: -6,
    slantDeg: 0,
    waveAmp: 10,
    waveLen: 190,
    letterSpacing: 1,
    underline: true,
    ink: "#111827",
    inkAlpha: 0.95,
  },
  {
    id: "style-3",
    label: "Elegant Flourish",
    fontFamily: "AvexGreatVibes",
    fontSize: 210,
    tiltDeg: -3,
    slantDeg: 0,
    waveAmp: 5,
    waveLen: 300,
    letterSpacing: 3,
    underline: true,
    ink: "#1e3a8a",
    inkAlpha: 1,
  },
  {
    id: "style-4",
    label: "Maker Style",
    fontFamily: "AvexPacifico",
    fontSize: 210,
    tiltDeg: 5,
    slantDeg: 4,
    waveAmp: 8,
    waveLen: 220,
    letterSpacing: 0,
    underline: false,
    ink: "#0f172a",
    inkAlpha: 0.9,
  },
];

export const SIGNATURE_NAME_MAX_LEN = 40;

export function signatureNameError(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return "Enter your name first.";
  if (trimmed.length > SIGNATURE_NAME_MAX_LEN) {
    return `Please keep the name under ${SIGNATURE_NAME_MAX_LEN} characters.`;
  }
  return null;
}

let fontsPromise: Promise<boolean> | null = null;

export async function ensureSignFonts(): Promise<boolean> {
  if (typeof document === "undefined") return false;
  fontsPromise ??= (async () => {
    try {
      await Promise.all(
        SIGN_FONTS.map(async (font) => {
          const existing = Array.from(document.fonts).find(
            (f) => f.family === font.family,
          );
          if (existing) return;
          const res = await fetch(font.file);
          if (!res.ok) return;
          const buf = await res.arrayBuffer();
          const face = new FontFace(font.family, buf);
          document.fonts.add(face);
          await face.load();
        }),
      );
      return true;
    } catch {
      return false;
    }
  })();
  return fontsPromise;
}

export interface RasterizedSignature {
  readonly dataUrl: string;
  readonly bytes: Uint8Array;
  readonly width: number;
  readonly height: number;
}

const ZOOM = 3;

const UNDERLINE_GAP_EM = 0.42;
const UNDERLINE_BOTTOM_MARGIN_EM = 0.6;

export async function rasterizeSignature(
  name: string,
  style: SignatureStyle,
): Promise<RasterizedSignature> {
  const trimmed = name.trim();
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas unavailable");

  const size = style.fontSize;
  const fontDef = `${Math.round(size)}px "${style.fontFamily}"`;
  ctx.font = fontDef;

  const chars = Array.from(trimmed);
  const advance = new Map<string, number>();
  for (const ch of chars) {
    if (!advance.has(ch)) advance.set(ch, ctx.measureText(ch).width);
  }
  const total =
    chars.reduce((sum, ch) => sum + (advance.get(ch) ?? 0), 0) +
    Math.max(0, chars.length - 1) * style.letterSpacing;

  const pad = size * 0.6;
  const widthPx = Math.ceil(total + pad * 2);
  const baseline = pad + size * 1.05;
  const heightPx = style.underline
    ? Math.ceil(baseline + size * UNDERLINE_GAP_EM + size * UNDERLINE_BOTTOM_MARGIN_EM)
    : Math.ceil(size * 1.5 + pad * 2 + style.waveAmp * 4);
  canvas.width = Math.max(4, Math.ceil(widthPx * ZOOM));
  canvas.height = Math.max(4, Math.ceil(heightPx * ZOOM));
  ctx.setTransform(ZOOM, 0, 0, ZOOM, 0, 0);
  ctx.clearRect(0, 0, widthPx, heightPx);
  ctx.font = fontDef;
  ctx.textBaseline = "alphabetic";

  const cx = widthPx / 2;
  const cy = heightPx / 2;
  ctx.translate(cx, cy);
  ctx.rotate((style.tiltDeg * Math.PI) / 180);
  ctx.translate(-cx, -cy);

  const inkColor = style.ink.replace(/^#/, "");
  const rgba = (a: number) =>
    `rgba(${parseInt(inkColor.slice(0, 2), 16)}, ${parseInt(inkColor.slice(2, 4), 16)}, ${parseInt(inkColor.slice(4, 6), 16)}, ${a})`;

  const sx = Math.tan((style.slantDeg * Math.PI) / 180);

  let x = pad;
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    const chW = advance.get(ch) ?? 0;
    const wave = style.waveAmp * Math.sin((x + i * 30) / (style.waveLen || 1));
    ctx.save();
    ctx.transform(1, 0, sx, 1, 0, 0);
    ctx.fillStyle = rgba(style.inkAlpha);
    ctx.fillText(ch, x, baseline + wave);
    ctx.restore();
    x += chW + style.letterSpacing;
  }

  if (style.underline) {
    const y = baseline + size * UNDERLINE_GAP_EM;
    const amp = 10;
    const half = total / 2 + pad * 0.4;
    ctx.save();
    ctx.strokeStyle = rgba(style.inkAlpha * 0.4);
    ctx.lineWidth = size * 0.035;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(cx - half, y);
    for (let kx = 0; kx <= 64; kx++) {
      const px = cx - half + (kx / 64) * (half * 2);
      const py = y + amp * Math.sin((kx / 64) * Math.PI * 2);
      if (kx === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.fillStyle = rgba(style.inkAlpha * 0.55);
    ctx.beginPath();
    ctx.arc(cx + half - size * 0.05, y + amp * 0.8, size * 0.05, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  const dataUrl = canvas.toDataURL("image/png");
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
      "image/png",
    );
  });
  const bytes = new Uint8Array(await blob.arrayBuffer());
  return { dataUrl, bytes, width: widthPx, height: heightPx };
}

export async function rasterizeUploadedSignature(
  file: Blob,
): Promise<RasterizedSignature> {
  const img = await createImageBitmap(file);
  if (!Number.isInteger(img.width) || !Number.isInteger(img.height)) {
    void img.close();
    throw new Error("invalid image");
  }
  const maxDim = 1600;
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    img.close();
    throw new Error("canvas unavailable");
  }
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  img.close();
  const dataUrl = canvas.toDataURL("image/png");
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
      "image/png",
    );
  });
  const bytes = new Uint8Array(await blob.arrayBuffer());
  return { dataUrl, bytes, width: w, height: h };
}