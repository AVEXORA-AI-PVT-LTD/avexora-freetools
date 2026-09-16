import { describe, expect, it, vi } from "vitest";

/**
 * pdf-lib 1.17.1 ships no document-encryption API (it can only read/write
 * encrypted files), so a real password-protected fixture cannot be produced in
 * this environment. To verify the tool's error classification (which is what
 * the UI message depends on), pdf-lib's PDFDocument.load is mocked to throw the
 * same kind of "encrypted" error the library raises for password-protected
 * files. The buildSignedPdf path under test is therefore the real one; only
 * the library's load call is substituted.
 */
vi.mock("pdf-lib", async (importOriginal) => {
  const actual = await importOriginal<typeof import("pdf-lib")>();
  return {
    ...actual,
    PDFDocument: {
      ...actual.PDFDocument,
      load: (bytes: Uint8Array, options: object) => {
        if (options && (options as { ignoreEncryption?: boolean }).ignoreEncryption === false) {
          const err = new Error("file is encrypted");
          err.name = "PasswordException";
          throw err;
        }
        return actual.PDFDocument.load(bytes, options);
      },
    },
  };
});

import {
  buildSignedPdf,
  displayFracToPdfRect,
  normalizeRotationDeg,
  PdfSignatureError,
} from "@/tools/compute/pdf/pdf-signature";
import { PDFDocument } from "pdf-lib";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";

const PNG = Uint8Array.from(
  Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
    "base64",
  ),
);

async function makePdf(): Promise<Uint8Array> {
  const src = await PDFDocument.create();
  src.addPage([400, 600]);
  return src.save();
}

async function metaFor(bytes: Uint8Array): Promise<{
  vw: number;
  vh: number;
  transform: readonly [number, number, number, number, number, number];
}> {
  const doc = await pdfjs.getDocument({ data: bytes.slice() }).promise;
  const page = await doc.getPage(1);
  const vp = page.getViewport({ scale: 1, dontFlip: false });
  return {
    vw: vp.width,
    vh: vp.height,
    transform: vp.transform as unknown as readonly [number, number, number, number, number, number],
  };
}

describe("pdf-signature — encrypted PDFs", () => {
  it("maps a password-protected (encrypted) PDF to a clear UI error", async () => {
    const fixture = await makePdf();
    const meta = await metaFor(fixture);
    const rect = displayFracToPdfRect(meta, { sx: 0.1, sy: 0.1, wFrac: 0.3, hFrac: 0.1 });
    try {
      await buildSignedPdf(fixture, [
        { pageNumber: 1, sigBytes: PNG, rect, rotateDeg: normalizeRotationDeg(0) },
      ]);
      expect.unreachable("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(PdfSignatureError);
      const e = err as Error & { code: string };
      expect(e.code).toBe("encrypted");
      expect(e.message).toMatch(/password-protected/);
    }
  });
});