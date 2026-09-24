/**
 * On-device image preparation for the Digital Business Card: nothing is
 * uploaded, and what is stored (in the draft, the files or a saved card) is a
 * small data URL.
 */

/** Header photo: kept whole (never cropped), scaled to fit this box. */
const PHOTO_MAX_W = 900;
const PHOTO_MAX_H = 1100;
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
 * Scale the photo down to fit 900×1100 as JPEG, keeping all of it: the card's
 * header takes the photo's own proportions, so nothing (least of all the
 * head) is cropped. Returns the width ÷ height ratio alongside.
 */
export async function readPhoto(file: File): Promise<{ dataUrl: string; ratio: number }> {
  const img = await loadImage(file);
  const scale = Math.min(1, PHOTO_MAX_W / img.naturalWidth, PHOTO_MAX_H / img.naturalHeight);
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  const [c, ctx] = canvas(w, h);
  ctx.drawImage(img, 0, 0, w, h);
  return { dataUrl: c.toDataURL("image/jpeg", 0.82), ratio: w / h };
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
