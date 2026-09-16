export type ViewportTransform = readonly [
  number,
  number,
  number,
  number,
  number,
  number,
];

export interface PageMeta {
  readonly width: number;
  readonly height: number;
  readonly rotation: number;
  readonly vw: number;
  readonly vh: number;
  readonly transform: ViewportTransform;
}

export interface DisplayRectFractions {
  readonly sx: number;
  readonly sy: number;
  readonly wFrac: number;
  readonly hFrac: number;
}

export interface PdfRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface PlacementSpec {
  readonly pageNumber: number;
  readonly sigBytes: Uint8Array;
  readonly rect: PdfRect;
  readonly rotateDeg: number;
}

export const PDF_SIGNATURE_MAX_BYTES = 50 * 1024 * 1024;
export const PDF_SIGNATURE_MAX_PAGES = 200;
export const SIGNATURE_IMAGE_MAX_BYTES = 10 * 1024 * 1024;
export const SIG_MIN_FRAC = 0.03;
export const SIG_MAX_FRAC = 0.9;
export const SIG_DEFAULT_W_FRAC = 0.38;

export const SIGNATURE_IMAGE_MIMES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
]);

export class PdfSignatureError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = "PdfSignatureError";
  }
}

export function normalizeRotationDeg(deg: number): number {
  const v = ((deg % 360) + 360) % 360;
  return Math.round(v * 1000) / 1000;
}

export function isPdfMagic(bytes: Uint8Array): boolean {
  if (bytes.length < 5) return false;
  return (
    bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46 && bytes[4] === 0x2d
  );
}

const WRONG_MIME =
  /^image\/|^video\/|^audio\/|^text\/plain$|^application\/zip$|^application\/vnd\./i;

export function inspectPdf(
  bytes: Uint8Array,
  name: string,
  mime: string,
): void {
  if (bytes.length > PDF_SIGNATURE_MAX_BYTES) {
    throw new PdfSignatureError(
      "too-large",
      `This PDF is larger than the ${Math.round(PDF_SIGNATURE_MAX_BYTES / 1024 / 1024)} MB limit. Please try a smaller file.`,
    );
  }
  if (!/\.pdf$/i.test(name)) {
    throw new PdfSignatureError("bad-type", "Please upload a valid PDF file.");
  }
  if (mime && WRONG_MIME.test(mime)) {
    throw new PdfSignatureError("bad-type", "Please upload a valid PDF file.");
  }
  if (!isPdfMagic(bytes)) {
    throw new PdfSignatureError(
      "bad-pdf",
      "This file does not look like a valid PDF. The file may be corrupted or not a PDF at all.",
    );
  }
  if (bytes.length < 64) {
    throw new PdfSignatureError(
      "bad-pdf",
      "This file appears to be an empty or truncated PDF. Please upload a complete file.",
    );
  }
}

export function sanitizeSignedFilename(name: string): string {
  const base = (name.replace(/\.pdf$/i, "") || "document")
    .replace(/[\\/]/g, "")
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  return `signed-${base || "document"}.pdf`;
}

export function signatureImageError(
  name: string,
  mime: string,
  size: number,
): string | null {
  if (size > SIGNATURE_IMAGE_MAX_BYTES) {
    return "This signature image is larger than the 10 MB limit. Please use a smaller image.";
  }
  const okExt = /\.(png|jpe?g|webp)$/i.test(name);
  const okMime = SIGNATURE_IMAGE_MIMES.has(mime.toLowerCase());
  if (!okExt || !okMime) {
    return "Please upload a valid signature image (PNG, JPG or WebP).";
  }
  return null;
}

function inverseViewportPoint(
  [a, b, c, d, e, f]: ViewportTransform,
  px: number,
  py: number,
): [number, number] {
  const det = a * d - b * c;
  if (det === 0) return [0, 0];
  const x = px - e;
  const y = py - f;
  return [(d * x - c * y) / det, (-b * x + a * y) / det];
}

export function displayFracToPdfRect(
  meta: Pick<PageMeta, "vw" | "vh" | "transform">,
  frac: DisplayRectFractions,
): PdfRect {
  const left = frac.sx * meta.vw;
  const top = frac.sy * meta.vh;
  const right = (frac.sx + frac.wFrac) * meta.vw;
  const bottom = (frac.sy + frac.hFrac) * meta.vh;
  const corners = [left, right].flatMap((x) =>
    [top, bottom].map((y) => inverseViewportPoint(meta.transform, x, y)),
  );
  const xs = corners.map(([x]) => x);
  const ys = corners.map(([, y]) => y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

export interface CenteredPlacement extends PdfRect {
  readonly rotateDeg: number;
}

export function centerRotatedPlacement(
  rect: PdfRect,
  editorAngleDeg: number,
): CenteredPlacement {
  const theta = normalizeRotationDeg(editorAngleDeg);
  const contentDeg = theta === 0 ? 0 : 360 - theta;
  const cx = rect.x + rect.width / 2;
  const cy = rect.y + rect.height / 2;
  const halfW = rect.width / 2;
  const halfH = rect.height / 2;
  const rad = (contentDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return {
    x: cx - (halfW * cos - halfH * sin),
    y: cy - (halfW * sin + halfH * cos),
    width: rect.width,
    height: rect.height,
    rotateDeg: contentDeg,
  };
}

function isEncryptedPdfError(err: unknown): boolean {
  const n = err instanceof Error ? err.name : String(err);
  const m = err instanceof Error ? err.message : String(err);
  return /encrypted/i.test(n) || /encrypted/i.test(m);
}

async function embedSignature(
  doc: import("pdf-lib").PDFDocument,
  bytes: Uint8Array,
): Promise<import("pdf-lib").PDFImage> {
  const isPng =
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47;
  if (isPng) return doc.embedPng(bytes);
  const isJpeg =
    bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (isJpeg) return doc.embedJpg(bytes);
  throw new PdfSignatureError(
    "bad-asset",
    "The signature image could not be read. Please upload a PNG, JPG or WebP image.",
  );
}

export async function buildSignedPdf(
  originalBytes: Uint8Array,
  placements: PlacementSpec[],
): Promise<Uint8Array> {
  const { PDFDocument, degrees } = await import("pdf-lib");
  let doc: import("pdf-lib").PDFDocument;
  try {
    doc = await PDFDocument.load(originalBytes, {
      updateMetadata: false,
      ignoreEncryption: false,
    });
  } catch (err) {
    if (isEncryptedPdfError(err)) {
      throw new PdfSignatureError(
        "encrypted",
        "This PDF is password-protected and cannot be edited without access.",
      );
    }
    throw new PdfSignatureError(
      "bad-pdf",
      "This PDF could not be read. It may be corrupted or unsupported.",
    );
  }
  for (const placement of placements) {
    if (
      placement.pageNumber < 1 ||
      placement.pageNumber > doc.getPageCount()
    ) {
      throw new PdfSignatureError(
        "bad-page",
        "A signature refers to a page that does not exist in this PDF.",
      );
    }
    const page = doc.getPage(placement.pageNumber - 1);
    const image = await embedSignature(doc, placement.sigBytes);
    const placed = centerRotatedPlacement(
      placement.rect,
      placement.rotateDeg,
    );
    page.drawImage(image, {
      x: placed.x,
      y: placed.y,
      width: placed.width,
      height: placed.height,
      rotate: degrees(placed.rotateDeg),
    });
  }
  const out = await doc.save({ updateFieldAppearances: false });
  return new Uint8Array(out);
}