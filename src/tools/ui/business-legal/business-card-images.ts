/**
 * On-device image preparation for the Digital Business Card: nothing is
 * uploaded, and what is stored (in the draft, the files or a saved card) is a
 * small data URL.
 */

/** Header photo: the card's top section is about 4:3. */
const PHOTO_W = 800;
const PHOTO_H = 600;
/** Logos keep their aspect ratio and transparency inside this box. */
const LOGO_MAX = 256;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("decode"));
    };
    img.src = url;
  });
}

function canvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("canvas");
  return [c, ctx];
}

export const ACCEPTED_IMAGE = /^image\/(png|jpeg|webp)$/;

/**
 * Crop to 4:3 and scale to 800×600 JPEG. Portrait photos are cropped nearer the
 * top than the centre, where faces usually are.
 */
export async function readPhoto(file: File): Promise<string> {
  const img = await loadImage(file);
  const target = PHOTO_W / PHOTO_H;
  let sw = img.naturalWidth;
  let sh = img.naturalHeight;
  if (sw / sh > target) sw = sh * target;
  else sh = sw / target;
  const sx = (img.naturalWidth - sw) / 2;
  const sy = (img.naturalHeight - sh) * 0.3;
  const w = Math.min(PHOTO_W, Math.round(sw));
  const h = Math.round(w / target);
  const [c, ctx] = canvas(w, h);
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
  return c.toDataURL("image/jpeg", 0.82);
}

/** Fit inside 256×256 as PNG so transparent logos stay transparent. */
export async function readLogo(file: File): Promise<string> {
  const img = await loadImage(file);
  const scale = Math.min(1, LOGO_MAX / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  const [c, ctx] = canvas(w, h);
  ctx.drawImage(img, 0, 0, w, h);
  return c.toDataURL("image/png");
}
