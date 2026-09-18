/**
 * Pure coordinate math for the image cropper.
 *
 * One coordinate system end to end: client (viewport) pixels → displayed-image
 * pixels → natural-pixel source rectangle. The crop overlay is positioned
 * relative to its container by adding the measured offset of the rendered image
 * inside that container, so pointer, selection box and output all agree even
 * when the container has padding or the image doesn't fill it.
 */

export interface CropBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface CropRect {
  sx: number;
  sy: number;
  outW: number;
  outH: number;
}

/** Minimal structural rectangle (a DOMRect satisfies this). */
export interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

/**
 * Convert viewport/client pointer coordinates into displayed-image-relative
 * coordinates, clamped to the rendered image bounds.
 */
export function clientToImagePoint(clientX: number, clientY: number, rect: Rect): { x: number; y: number } {
  return {
    x: clamp(clientX - rect.left, 0, rect.width),
    y: clamp(clientY - rect.top, 0, rect.height),
  };
}

/** Normalize two image-relative points into an axis-aligned selection box. */
export function cropBoxFromPoints(a: { x: number; y: number }, b: { x: number; y: number }): CropBox {
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    w: Math.abs(b.x - a.x),
    h: Math.abs(b.y - a.y),
  };
}

/** Where the rendered image starts inside its container (e.g. its padding). */
export function imageOffsetInContainer(imageRect: Rect, containerRect: Rect): { x: number; y: number } {
  return { x: imageRect.left - containerRect.left, y: imageRect.top - containerRect.top };
}

/**
 * Position of a crop box (image-relative) inside its container so the overlay
 * lines up exactly with the rendered image the box was drawn on.
 */
export function cropOverlayBox(
  box: CropBox,
  imageRect: Rect,
  containerRect: Rect,
): { left: number; top: number; width: number; height: number } {
  const offset = imageOffsetInContainer(imageRect, containerRect);
  return { left: box.x + offset.x, top: box.y + offset.y, width: box.w, height: box.h };
}

/**
 * Convert a display-space crop selection to a valid natural-image-space crop
 * rectangle, safe to pass to `drawImage`.
 *
 * The selection box is expressed in displayed/rendered image coordinates and
 * `imageRect` is the displayed image bounds. This converts to the source
 * image's natural pixel space (independent X/Y scale factors) and then CLAMPS
 * the source rectangle to the natural image bounds, so the source rectangle
 * never extends past the image edge (which would make `drawImage` clip the
 * source and leave a blank/transparent strip at the boundary).
 *
 * Returns `null` when the crop would have non-positive width/height so callers
 * can show a validation message instead of generating a blank canvas.
 */
export function computeCropRect(
  box: CropBox,
  imageRect: { width: number; height: number },
  naturalWidth: number,
  naturalHeight: number,
): CropRect | null {
  if (naturalWidth <= 0 || naturalHeight <= 0 || imageRect.width <= 0 || imageRect.height <= 0) return null;

  const scaleX = naturalWidth / imageRect.width;
  const scaleY = naturalHeight / imageRect.height;

  const sx = Math.max(0, Math.floor(box.x * scaleX));
  const sy = Math.max(0, Math.floor(box.y * scaleY));

  const sw = Math.min(box.w * scaleX, naturalWidth - sx);
  const sh = Math.min(box.h * scaleY, naturalHeight - sy);

  if (sw <= 0 || sh <= 0) return null;

  const outW = Math.max(1, Math.floor(sw));
  const outH = Math.max(1, Math.floor(sh));

  return { sx, sy, outW, outH };
}