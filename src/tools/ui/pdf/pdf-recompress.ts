/**
 * Image re-encoding for the PDF compressor.
 *
 * The structural pass (re-saving with object streams, dropping metadata) only
 * ever reclaims a few kilobytes, because in almost every real PDF the bytes are
 * in the embedded images. This pass re-encodes those images.
 *
 * Scope is deliberately narrow: only `/DCTDecode` (JPEG) XObjects are touched.
 * That is where the weight is in scans and photo-heavy documents, and it is the
 * one case a browser can decode and re-encode without having to interpret PDF
 * colour spaces itself. Anything else — Flate bitmaps, CCITT fax, JPX, stencil
 * masks, and any image that fails to decode — is left exactly as it was.
 *
 * Every replacement is also checked to be smaller than what it replaces, so a
 * pass can only ever shrink the file or leave it alone.
 */

export interface RecompressOptions {
  /** JPEG quality, 0–1. */
  quality: number;
  /** Cap on the longest edge in pixels. `Infinity` keeps the original size. */
  maxEdge: number;
}

export interface RecompressResult {
  /** JPEG images found. */
  scanned: number;
  /** Images actually replaced with a smaller re-encode. */
  replaced: number;
  /** Bytes reclaimed across those replacements. */
  bytesSaved: number;
}

/**
 * Target dimensions for an image, honouring `maxEdge` while preserving aspect
 * ratio. Never upscales, and never returns a zero dimension.
 */
export function targetSize(
  width: number,
  height: number,
  maxEdge: number,
): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (!Number.isFinite(maxEdge) || longest <= maxEdge || longest === 0) {
    return { width, height };
  }
  const scale = maxEdge / longest;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

/**
 * Whether a re-encoded candidate is worth keeping. Requires a real improvement
 * rather than any improvement: swapping a stream to save a handful of bytes
 * costs a generation of quality for nothing.
 */
export function worthReplacing(originalBytes: number, candidateBytes: number): boolean {
  if (candidateBytes <= 0 || originalBytes <= 0) return false;
  return candidateBytes < originalBytes * 0.95;
}

/**
 * Format a compression outcome as a sentence, honestly.
 *
 * A saving that rounds to 0% is not a compression success, so it is not
 * reported as one — that is the whole reason this is a named, tested function
 * rather than a template literal at the call site.
 */
export function describeOutcome(
  originalBytes: number,
  finalBytes: number,
  result: RecompressResult | null,
): string {
  const pct = originalBytes > 0 ? ((originalBytes - finalBytes) / originalBytes) * 100 : 0;
  const from = formatSize(originalBytes);
  const to = formatSize(finalBytes);

  if (pct >= 1) {
    const images =
      result && result.replaced > 0
        ? ` ${result.replaced} of ${result.scanned} image${result.scanned === 1 ? "" : "s"} re-encoded.`
        : "";
    return `Compressed from ${from} to ${to} — ${Math.round(pct)}% smaller.${images}`;
  }

  if (result === null) {
    return `No meaningful saving: ${from} → ${to}. The structural pass only reclaims internal overhead, and this file has little. If it is image-heavy, try re-encoding images.`;
  }
  if (result.scanned === 0) {
    return `No meaningful saving: ${from} → ${to}. This PDF has no JPEG images to re-encode — its size is in vector content, fonts, or an image format this tool leaves alone.`;
  }
  return `No meaningful saving: ${from} → ${to}. Its ${result.scanned} image${result.scanned === 1 ? " was" : "s were"} already compressed at least as tightly as this setting would. Try a stronger setting.`;
}

export function formatSize(bytes: number): string {
  return bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(2)} MB`
    : `${Math.round(bytes / 1024)} KB`;
}

/** Decode, resize and re-encode one JPEG. Returns null if it cannot be improved. */
async function reencodeJpeg(
  bytes: Uint8Array,
  opts: RecompressOptions,
): Promise<{ bytes: Uint8Array; width: number; height: number } | null> {
  const blob = new Blob([bytes as BlobPart], { type: "image/jpeg" });
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(blob);
  } catch {
    // CMYK and other exotic JPEGs the browser will not decode. Leave them be.
    return null;
  }

  try {
    const { width, height } = targetSize(bitmap.width, bitmap.height, opts.maxEdge);
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(bitmap, 0, 0, width, height);
    const out = await canvas.convertToBlob({ type: "image/jpeg", quality: opts.quality });
    const encoded = new Uint8Array(await out.arrayBuffer());
    return worthReplacing(bytes.length, encoded.length) ? { bytes: encoded, width, height } : null;
  } finally {
    bitmap.close();
  }
}

/**
 * Re-encode every JPEG image in the document in place.
 *
 * Mutates `doc`'s context; the caller saves afterwards. Runs in the browser
 * only — it needs `createImageBitmap` and `OffscreenCanvas`.
 */
export async function recompressImages(
  // Typed loosely on purpose: pdf-lib is a dynamic import at the call site, and
  // pinning these to its internals here would drag the whole library into the
  // initial bundle for a tool the visitor may never open.
  doc: {
    context: {
      enumerateIndirectObjects(): [unknown, unknown][];
      assign(ref: unknown, object: unknown): void;
    };
  },
  opts: RecompressOptions,
): Promise<RecompressResult> {
  const { PDFName, PDFRawStream, PDFNumber } = await import("pdf-lib");
  const result: RecompressResult = { scanned: 0, replaced: 0, bytesSaved: 0 };

  for (const [ref, obj] of doc.context.enumerateIndirectObjects()) {
    if (!(obj instanceof PDFRawStream)) continue;
    const dict = obj.dict;
    if (dict.get(PDFName.of("Subtype")) !== PDFName.of("Image")) continue;
    // Only plain single-filter JPEG. A filter array means further encoding is
    // layered on top and the raw bytes are not a decodable JPEG.
    if (dict.get(PDFName.of("Filter")) !== PDFName.of("DCTDecode")) continue;

    result.scanned += 1;
    const original = obj.getContents();
    let encoded: Awaited<ReturnType<typeof reencodeJpeg>>;
    try {
      encoded = await reencodeJpeg(original, opts);
    } catch {
      continue; // One bad image must not fail the whole document.
    }
    if (!encoded) continue;

    const next = dict.clone();
    next.set(PDFName.of("Width"), PDFNumber.of(encoded.width));
    next.set(PDFName.of("Height"), PDFNumber.of(encoded.height));
    next.set(PDFName.of("Length"), PDFNumber.of(encoded.bytes.length));
    next.set(PDFName.of("Filter"), PDFName.of("DCTDecode"));
    // Canvas always hands back 8-bit RGB, whatever the original space was.
    next.set(PDFName.of("ColorSpace"), PDFName.of("DeviceRGB"));
    next.set(PDFName.of("BitsPerComponent"), PDFNumber.of(8));
    // Both describe the bytes we just replaced, so they no longer apply.
    next.delete(PDFName.of("DecodeParms"));
    next.delete(PDFName.of("Decode"));

    doc.context.assign(ref, PDFRawStream.of(next, encoded.bytes));
    result.replaced += 1;
    result.bytesSaved += original.length - encoded.bytes.length;
  }

  return result;
}
