import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

export interface StorageUploadResult {
  storageKey: string;
  storageProvider: "local" | "s3" | "vercel-blob";
  storageUrl: string;
  cdnUrl: string;
  filename: string;
  originalFilename: string;
  extension: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
}

const ALLOWED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/svg+xml",
  "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

/** Max file size limits in bytes */
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

export function sanitizeSvg(svgContent: string): string {
  // Strip <script> tags, inline javascript on* handlers, and iframe/embed
  let clean = svgContent.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
  clean = clean.replace(/on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  clean = clean.replace(/javascript\s*:/gi, "");
  return clean;
}

export async function saveFileToStorage(
  fileBuffer: Buffer,
  originalName: string,
  mimeType: string
): Promise<StorageUploadResult> {
  if (fileBuffer.length > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
  }

  const cleanMime = mimeType.toLowerCase().trim();
  if (!ALLOWED_MIME_TYPES.has(cleanMime)) {
    throw new Error(`Unsupported file format: ${cleanMime}`);
  }

  const ext = path.extname(originalName).replace(".", "").toLowerCase() || "bin";
  
  // Sanitize SVG content to prevent stored XSS
  let finalBuffer = fileBuffer;
  if (cleanMime === "image/svg+xml") {
    const rawSvg = fileBuffer.toString("utf-8");
    const safeSvg = sanitizeSvg(rawSvg);
    finalBuffer = Buffer.from(safeSvg, "utf-8");
  }

  const dateDir = new Date().toISOString().slice(0, 7).replace("-", "/"); // e.g., 2026/09
  const uniqueId = crypto.randomUUID();
  const safeBaseName = path.basename(originalName, path.extname(originalName)).replace(/[^a-zA-Z0-9_-]/g, "_");
  const fileName = `${safeBaseName}_${uniqueId.slice(0, 8)}.${ext}`;
  const relativeKey = `uploads/${dateDir}/${fileName}`;

  // Ensure target folder exists in public/
  const publicDir = path.join(process.cwd(), "public", "uploads", dateDir);
  await fs.mkdir(publicDir, { recursive: true });

  const filePath = path.join(process.cwd(), "public", relativeKey);
  await fs.writeFile(filePath, finalBuffer);

  const cdnUrl = `/${relativeKey}`;
  const storageUrl = cdnUrl;

  return {
    storageKey: relativeKey,
    storageProvider: "local",
    storageUrl,
    cdnUrl,
    filename: fileName,
    originalFilename: originalName,
    extension: ext,
    mimeType: cleanMime,
    size: finalBuffer.length,
  };
}

export async function deleteFileFromStorage(storageKey: string): Promise<boolean> {
  if (!storageKey || storageKey.includes("..")) return false;

  try {
    const filePath = path.join(process.cwd(), "public", storageKey);
    await fs.unlink(filePath);
    return true;
  } catch (err) {
    console.error("Storage delete warning:", err);
    return false;
  }
}
