import { type DocSpec, bleedBox, mmToPx } from "../doc-spec";
import { renderSvg } from "./svg";

/**
 * DocSpec → PNG / JPEG, entirely in the browser (spec 22 §3.2).
 *
 * Consistent with the free-tools engine's rule that user files never leave the
 * device: social posts and ad creatives are rasterised client-side from the
 * SVG the same preview uses, so what the user sees is what downloads.
 *
 * Browser-only — importing this from a server component will fail on `Image`.
 */

export interface RasterOptions {
  /** Output scale multiplier. 2 gives a retina-quality PNG. */
  scale?: number;
  format?: "png" | "jpeg";
  quality?: number;
  /** JPEG has no alpha; this backs it with a solid colour. */
  background?: string;
  /** Render the bleed area. Off by default — screen assets have none. */
  includeBleed?: boolean;
}

function svgToDataUri(svg: string): string {
  // encodeURIComponent (not base64) keeps this correct for multi-byte glyphs
  // in brand names without needing a Buffer polyfill.
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** Pixel dimensions a spec rasterises to at `scale`. */
export function rasterSize(
  spec: DocSpec,
  scale = 1,
  includeBleed = false,
): { width: number; height: number } {
  const box = includeBleed ? bleedBox(spec) : spec.size;
  const toPx = (v: number) => (spec.size.unit === "mm" ? mmToPx(v, 300) : v);
  return {
    width: Math.round(toPx(box.w) * scale),
    height: Math.round(toPx(box.h) * scale),
  };
}

export async function renderRaster(
  spec: DocSpec,
  options: RasterOptions = {},
): Promise<Blob> {
  if (typeof window === "undefined") {
    throw new Error("renderRaster is browser-only");
  }

  const {
    scale = 2,
    format = "png",
    quality = 0.92,
    includeBleed = false,
  } = options;

  const svg = renderSvg(spec, { includeBleed });
  const { width, height } = rasterSize(spec, scale, includeBleed);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");

  if (format === "jpeg" || options.background) {
    ctx.fillStyle = options.background ?? "#ffffff";
    ctx.fillRect(0, 0, width, height);
  }

  const img = new Image();
  img.decoding = "sync";

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Failed to rasterise SVG"));
    img.src = svgToDataUri(svg);
  });

  ctx.drawImage(img, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, `image/${format}`, quality),
  );
  if (!blob) throw new Error("Canvas export failed");
  return blob;
}

/**
 * Overlay for free-plan exports. Applied at raster time rather than baked into
 * the DocSpec so the same layout code serves both tiers — the watermark is an
 * entitlement concern, not a design one.
 */
export async function watermarkBlob(
  blob: Blob,
  label = "Made with Avexora Brand Studio — upgrade to remove",
): Promise<Blob> {
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");

  ctx.drawImage(bitmap, 0, 0);

  const barHeight = Math.max(28, Math.round(bitmap.height * 0.05));
  const fontSize = Math.round(barHeight * 0.42);

  ctx.fillStyle = "rgba(15, 23, 42, 0.72)";
  ctx.fillRect(0, bitmap.height - barHeight, bitmap.width, barHeight);

  ctx.fillStyle = "#ffffff";
  ctx.font = `600 ${fontSize}px system-ui, -apple-system, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, bitmap.width / 2, bitmap.height - barHeight / 2);

  const out = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/png"),
  );
  if (!out) throw new Error("Watermark export failed");
  return out;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke on the next tick so Safari has finished reading the object URL.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadText(
  content: string,
  filename: string,
  type = "image/svg+xml",
) {
  downloadBlob(new Blob([content], { type }), filename);
}
