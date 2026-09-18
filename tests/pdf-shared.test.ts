import { describe, expect, it } from "vitest";
import {
  PDF_UPLOAD_MAX_BYTES,
  formatBytes,
  parsePageRanges,
  pdfUploadLimitError,
} from "@/tools/ui/pdf/pdf-shared";

describe("formatBytes", () => {
  it("formats MB, KB and bytes", () => {
    expect(formatBytes(500)).toBe("500 B");
    expect(formatBytes(2048)).toBe("2 KB");
    expect(formatBytes(52 * 1024 * 1024)).toBe("52.0 MB");
  });
});

describe("pdfUploadLimitError — shared 50 MB cap", () => {
  it("returns null for files within the limit", () => {
    expect(pdfUploadLimitError({ name: "a.pdf", size: PDF_UPLOAD_MAX_BYTES })).toBeNull();
    expect(pdfUploadLimitError({ name: "a.pdf", size: 1024 })).toBeNull();
  });

  it("returns a friendly error naming the file when over the limit", () => {
    const err = pdfUploadLimitError({ name: "huge.pdf", size: 80 * 1024 * 1024 });
    expect(err).toContain("huge.pdf");
    expect(err).toContain("80.0 MB");
    expect(err).toContain("50 MB");
  });
});

describe("parsePageRanges — page-range parser used by split/extract/reorder", () => {
  it("parses single pages, ranges and mixed comma lists", () => {
    expect(parsePageRanges("2", 6)).toEqual([1]);
    expect(parsePageRanges("1-3", 6)).toEqual([0, 1, 2]);
    expect(parsePageRanges("3, 1-2", 6)).toEqual([0, 1, 2]);
  });

  it("clamps out-of-range pages to the page count", () => {
    expect(parsePageRanges("1-10", 3)).toEqual([0, 1, 2]);
    expect(parsePageRanges("99", 3)).toBeNull();
  });

  it("rejects invalid, reversed or zero-based syntax", () => {
    expect(parsePageRanges("3-1", 6)).toBeNull();
    expect(parsePageRanges("0", 6)).toBeNull();
    expect(parsePageRanges("abc", 6)).toBeNull();
    expect(parsePageRanges("", 6)).toBeNull();
  });

  it("dedupes overlapping ranges", () => {
    expect(parsePageRanges("1-3, 2-4", 6)).toEqual([0, 1, 2, 3]);
  });
});