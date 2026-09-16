import UPNG from "@pdf-lib/upng";

/* ---------------------------------------------------------------------------
 * Image Background Remover — pure compute helpers.
 *
 * Segmentation runs client-side via an ONNX ISNet (General Use) model through
 * onnxruntime-web (see `bg-removal-engine.ts`). This file contains every pure,
 * deterministic piece of the pipeline so it can be unit-tested in Node:
 * format detection, validation, dimension guarding, bilinear resampling,
 * RGB→NCHW normalisation, mask→alpha compositing, and transparent PNG export
 * (UPNG.js, same library the compressor already uses).
 * ------------------------------------------------------------------------- */

/** Fixed inference resolution of the ISNet (General Use) ONNX export. */
export const BG_REMOVAL_SEG_EDGE = 1024;
/** ImageNet-style normalisation used by the model (imgly ISNet pipeline). */
export const BG_REMOVAL_MEAN = 128;
export const BG_REMOVAL_STD = 256;

/** Hard ceiling on output pixels (~4096×4096) before dims are reduced. */
export const BG_REMOVAL_MAX_PIXELS = 16_777_216;
/** Hard ceiling on any single edge (in px) before dims are reduced. */
export const BG_REMOVAL_MAX_EDGE = 8192;
/** Uploaded file size limit (bytes). */
export const BG_REMOVAL_MAX_FILE_BYTES = 30 * 1024 * 1024;

export type DetectedFormat =
  | "png"
  | "jpeg"
  | "webp"
  | "gif"
  | "bmp"
  | "avif"
  | "tiff"
  | "unknown";

/** Formats the browser's image decoder can decode for processing. */
export const BROWSER_DECODABLE_FORMATS: readonly DetectedFormat[] = [
  "png",
  "jpeg",
  "webp",
  "gif",
  "bmp",
  "avif",
] as const;

/**
 * Identify the image container from magic bytes. TIFF/HEIC/RAW are recognised
 * so they can be reported as unsupported instead of failing opaquely.
 */
export function detectImageFormat(bytes: Uint8Array): DetectedFormat {
  const b = bytes;
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpeg";
  if (b.length >= 4 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) {
    return "png";
  }
  if (
    b.length >= 6 &&
    b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 &&
    b[3] === 0x38 && (b[4] === 0x37 || b[4] === 0x39) && b[5] === 0x61
  ) {
    return "gif";
  }
  if (b.length >= 2 && b[0] === 0x42 && b[1] === 0x4d) return "bmp";
  if (
    b.length >= 4 &&
    ((b[0] === 0x49 && b[1] === 0x49 && b[2] === 0x2a && b[3] === 0x00) ||
      (b[0] === 0x4d && b[1] === 0x4d && b[2] === 0x00 && b[3] === 0x2a))
  ) {
    return "tiff";
  }
  if (b.length >= 12 && b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46) {
    if (b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return "webp";
    return "unknown";
  }
  // ISO BMFF (HEIC/AVIF): bytes 4..7 are "ftyp", brand shipped in bytes 8..11.
  if (b.length >= 12 && b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70) {
    const brand = String.fromCharCode(b[8], b[9], b[10], b[11]);
    if (brand === "avif" || brand === "avis") return "avif";
    return "unknown"; // HEIC / other ISO-BMFF
  }
  return "unknown";
}

/**
 * Human-readable name per detected format, for error messages.
 */
export function formatDisplayName(format: DetectedFormat): string {
  switch (format) {
    case "png":
      return "PNG";
    case "jpeg":
      return "JPEG/JPG";
    case "webp":
      return "WebP";
    case "gif":
      return "GIF";
    case "bmp":
      return "BMP";
    case "avif":
      return "AVIF";
    case "tiff":
      return "TIFF";
    default:
      return "this file type";
  }
}

/**
 * Validate an uploaded file for the background remover. Returns a user-facing
 * error message or `null` when the file can be processed.
 */
export function inputFormatError(
  fileName: string,
  mimeType: string,
  sizeBytes: number,
  magic: Uint8Array,
): string | null {
  if (!fileName) return "No file was selected.";
  if (sizeBytes === 0) return "The selected file is empty. Please choose a valid image.";
  if (sizeBytes > BG_REMOVAL_MAX_FILE_BYTES) {
    return "This image is larger than the 30 MB upload limit. Please try a smaller file.";
  }
  const format = detectImageFormat(magic);
  if (format === "unknown") {
    return "Unsupported file format. Please upload a PNG, JPG, JPEG, WebP, GIF, BMP or AVIF image.";
  }
  if (format === "tiff") {
    return "TIFF images can't be processed in the browser. Please convert it to PNG, JPG or WebP first.";
  }
  // Everything else the browser decodes natively.
  void mimeType;
  return null;
}

export interface SafeDims {
  width: number;
  height: number;
  /** True when the dimensions had to be reduced to prevent memory exhaustion. */
  scaled: boolean;
}

/**
 * Choose the processing dimensions: the original size when it is safe,
 * otherwise scaled down to fit both the pixel budget and the edge budget.
 * Never upscales.
 */
export function safeOutputDims(width: number, height: number): SafeDims {
  const pixels = width * height;
  if (
    width <= BG_REMOVAL_MAX_EDGE &&
    height <= BG_REMOVAL_MAX_EDGE &&
    pixels <= BG_REMOVAL_MAX_PIXELS
  ) {
    return { width, height, scaled: false };
  }
  const scale = Math.min(
    BG_REMOVAL_MAX_EDGE / width,
    BG_REMOVAL_MAX_EDGE / height,
    Math.sqrt(BG_REMOVAL_MAX_PIXELS / pixels),
  );
  const w = Math.max(1, Math.floor(width * scale));
  const h = Math.max(1, Math.floor(height * scale));
  return { width: w, height: h, scaled: true };
}

export interface RgbaImage {
  rgba: Uint8Array;
  width: number;
  height: number;
}

/**
 * Bilinear resize of an interleaved RGBA (HWC) buffer to `dw`×`dh`. This is a
 * faithful port of the resampling used by imgly's ISNet pipeline (and the
 * classic U²-Net preprocessor).
 */
export function resizeRgbaBilinear(
  rgba: Uint8Array,
  sw: number,
  sh: number,
  dw: number,
  dh: number,
): Uint8Array {
  if (dw === sw && dh === sh) return rgba;
  const out = new Uint8Array(dw * dh * 4);
  const scaleX = sw / dw;
  const scaleY = sh / dh;
  const channels = 4;
  for (let y = 0; y < dh; y++) {
    const srcY = y * scaleY;
    const y1 = Math.max(Math.floor(srcY), 0);
    const y2 = Math.min(Math.ceil(srcY), sh - 1);
    const dy = srcY - y1;
    for (let x = 0; x < dw; x++) {
      const srcX = x * scaleX;
      const x1 = Math.max(Math.floor(srcX), 0);
      const x2 = Math.min(Math.ceil(srcX), sw - 1);
      const dx = srcX - x1;
      for (let c = 0; c < channels; c++) {
        const p1 = rgba[y1 * sw * 4 + x1 * 4 + c];
        const p2 = rgba[y1 * sw * 4 + x2 * 4 + c];
        const p3 = rgba[y2 * sw * 4 + x1 * 4 + c];
        const p4 = rgba[y2 * sw * 4 + x2 * 4 + c];
        const v =
          (1 - dx) * (1 - dy) * p1 +
          dx * (1 - dy) * p2 +
          (1 - dx) * dy * p3 +
          dx * dy * p4;
        out[y * dw * 4 + x * 4 + c] = Math.round(v);
      }
    }
  }
  return out;
}

/** Bilinear resize of a single-channel mask (or any Uint8 plane). */
export function resizeMaskBilinear(
  mask: Uint8Array,
  mw: number,
  mh: number,
  dw: number,
  dh: number,
): Uint8Array {
  if (dw === mw && dh === mh) return mask;
  const out = new Uint8Array(dw * dh);
  const scaleX = mw / dw;
  const scaleY = mh / dh;
  for (let y = 0; y < dh; y++) {
    const srcY = y * scaleY;
    const y1 = Math.max(Math.floor(srcY), 0);
    const y2 = Math.min(Math.ceil(srcY), mh - 1);
    const dy = srcY - y1;
    for (let x = 0; x < dw; x++) {
      const srcX = x * scaleX;
      const x1 = Math.max(Math.floor(srcX), 0);
      const x2 = Math.min(Math.ceil(srcX), mw - 1);
      const dx = srcX - x1;
      const v =
        (1 - dx) * (1 - dy) * mask[y1 * mw + x1] +
        dx * (1 - dy) * mask[y1 * mw + x2] +
        (1 - dx) * dy * mask[y2 * mw + x1] +
        dx * dy * mask[y2 * mw + x2];
      out[y * dw + x] = Math.round(v);
    }
  }
  return out;
}

/**
 * Convert an interleaved RGBA buffer to a normalised [1, 3, H, W] float32
 * tensor using the model's `(value − mean) / std` rule (mean 128, std 256,
 * equivalent to `v/255 − 0.5`). Alpha is dropped — the segmentation model
 * operates on RGB only.
 */
export function rgbaHwcToBchw(rgba: Uint8Array, w: number, h: number): Float32Array {
  const stride = w * h;
  const out = new Float32Array(3 * stride);
  for (let i = 0, j = 0; i < rgba.length; i += 4, j += 1) {
    out[j] = (rgba[i] - BG_REMOVAL_MEAN) / BG_REMOVAL_STD;
    out[j + stride] = (rgba[i + 1] - BG_REMOVAL_MEAN) / BG_REMOVAL_STD;
    out[j + 2 * stride] = (rgba[i + 2] - BG_REMOVAL_MEAN) / BG_REMOVAL_STD;
  }
  return out;
}

/**
 * Convert raw float probabilities (sigmoid output in [0,1]) into a 0–255 mask,
 * clamping any out-of-range/invalid values so a bad inference can never poison
 * the alpha channel.
 */
export function probabilitiesToMask(probs: Float32Array, len: number): Uint8Array {
  const mask = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    const v = probs[i];
    if (Number.isNaN(v) || v <= 0) {
      mask[i] = 0;
    } else if (v >= 1) {
      mask[i] = 255;
    } else {
      mask[i] = Math.round(v * 255);
    }
  }
  return mask;
}

/**
 * Merge the segmentation mask into the source RGBA, producing the final
 * transparent image. Existing transparency is preserved (never re-added): the
 * new alpha is `sourceAlpha × mask`, so already-transparent pixels stay fully
 * transparent and semi-transparent edges keep relative feathering.
 */
export function applyMaskAlpha(
  rgba: Uint8Array,
  mask: Uint8Array,
  maskW: number,
  maskH: number,
  outW: number,
  outH: number,
): Uint8Array {
  if (maskW !== outW || maskH !== outH) {
    mask = resizeMaskBilinear(mask, maskW, maskH, outW, outH);
  }
  const out = new Uint8Array(outW * outH * 4);
  for (let i = 0; i < outW * outH; i++) {
    out[i * 4] = rgba[i * 4];
    out[i * 4 + 1] = rgba[i * 4 + 1];
    out[i * 4 + 2] = rgba[i * 4 + 2];
    out[i * 4 + 3] = Math.round((rgba[i * 4 + 3] * mask[i]) / 255);
  }
  return out;
}

/** Fraction (0..1) of pixels that are already transparent (alpha < 250). */
export function existingTransparencyRatio(rgba: Uint8Array, w: number, h: number): number {
  const total = w * h;
  if (total === 0) return 0;
  let transparent = 0;
  for (let i = 0; i < total; i++) {
    if (rgba[i * 4 + 3] < 250) transparent++;
  }
  return transparent / total;
}

/**
 * UPNG's published typings predate the `forbidPlte` option (7th argument),
 * which disables palette quantisation so colour type 6 (RGBA, 8‑bit alpha) is
 * always emitted. Apply the option through a loose signature.
 */
type LooseUpngEncode = (
  imgs: ArrayBuffer[],
  w: number,
  h: number,
  cnum: number,
  dels?: unknown,
  tabs?: unknown,
  forbidPlte?: boolean,
) => ArrayBuffer;

function upngEncodeRgba(rgba: ArrayBuffer, w: number, h: number): ArrayBuffer {
  return (UPNG.encode as unknown as LooseUpngEncode)([rgba], w, h, 0, undefined, undefined, true);
}

/**
 * Encode an RGBA buffer as a genuine lossless PNG (UPNG.js, the same encoder
 * the image compressor uses). Colour type 6 (RGBA, 8‑bit alpha) is forced so
 * the alpha channel is always real — palette quantisation would otherwise
 * band the semi-transparent hair/fur edges the segmentation model produces.
 */
export function encodeTransparentPng(rgba: Uint8Array, w: number, h: number): Uint8Array {
  const copy = new Uint8Array(rgba.length);
  copy.set(rgba);
  return new Uint8Array(upngEncodeRgba(copy.buffer as ArrayBuffer, w, h));
}

const PNG_SIGNATURE = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** True when `bytes` starts with the PNG signature. */
export function isPngBytes(bytes: Uint8Array): boolean {
  if (bytes.length < 8) return false;
  for (let i = 0; i < 8; i++) if (bytes[i] !== PNG_SIGNATURE[i]) return false;
  return true;
}

/**
 * Structural PNG transparency check. Returns `true` when the PNG can represent
 * alpha: colour type 4/6 (gray+alpha / RGBA) or a palette PNG carrying a tRNS
 * chunk. Used to refuse an opaque download before it ever reaches the user.
 */
export function pngHasAlphaChannel(bytes: Uint8Array): boolean {
  if (!isPngBytes(bytes) || bytes.length < 33) return false;
  // IHDR: 8-byte signature + 4-byte length + "IHDR"; colour type is the byte
  // right after width/height/bit-depth.
  const colorType = bytes[25];
  if (colorType === 4 || colorType === 6) return true;
  if (colorType === 2 || colorType === 0) return false;
  if (colorType === 3) {
    // Palette image: walk chunks looking for a tRNS chunk.
    let offset = 8;
    while (offset + 8 <= bytes.length) {
      const len =
        ((bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3]) >>>
        0;
      const type = String.fromCharCode(bytes[offset + 4], bytes[offset + 5], bytes[offset + 6], bytes[offset + 7]);
      if (type === "IEND") break;
      if (type === "tRNS") return true;
      offset += 12 + len;
    }
    return false;
  }
  return false;
}

/**
 * Structural WebP alpha check (RIFF/WebP container). Returns `true` for a
 * VP8X frame with the alpha bit set, a VP8L (lossless) frame, or any ALPH
 * chunk; `false` for a plain lossy VP8 frame with no alpha.
 */
export function webpHasAlphaChannel(bytes: Uint8Array): boolean {
  if (bytes.length < 20) return false;
  const riff = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);
  const webp = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
  if (riff !== "RIFF" || webp !== "WEBP") return false;
  let offset = 12;
  while (offset + 8 <= bytes.length) {
    const frameType = String.fromCharCode(bytes[offset], bytes[offset + 1], bytes[offset + 2], bytes[offset + 3]);
    const size =
      ((bytes[offset + 4] << 8) | (bytes[offset + 5] << 16) | (bytes[offset + 6] << 24) | bytes[offset + 7]) >>>
      0;
    if (frameType === "ALPH") return true;
    if (frameType === "VP8X") {
      // VP8X flags reside in the first payload byte; bit 4 (0x10) = alpha present.
      if (offset + 9 <= bytes.length && (bytes[offset + 8] & 0x10) !== 0) return true;
    }
    if (frameType === "VP8L") return true; // lossless WebP always stores alpha
    offset += 8 + size;
    if (offset % 2 === 1) offset += 1; // chunks are 2-byte aligned
  }
  return false;
}