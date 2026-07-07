import { describe, expect, it } from "vitest";
import { computeWordCount } from "@/tools/compute/text/word-counter";

function resultMap(text: string) {
  const outcome = computeWordCount({ text });
  if ("error" in outcome) throw new Error(outcome.error);
  return new Map(outcome.results.map((r) => [r.label, r.value]));
}

describe("computeWordCount", () => {
  it("counts words, characters, sentences and paragraphs", () => {
    const r = resultMap("Hello world. This is a test!\n\nNew paragraph here.");
    expect(r.get("Words")).toBe("9");
    expect(r.get("Sentences")).toBe("3");
    expect(r.get("Paragraphs")).toBe("2");
    expect(r.get("Characters")).toBe("49");
  });

  it("returns zeros for empty text", () => {
    const r = resultMap("");
    expect(r.get("Words")).toBe("0");
    expect(r.get("Characters")).toBe("0");
    expect(r.get("Reading time")).toBe("0 min");
  });

  it("treats consecutive whitespace as one separator", () => {
    const r = resultMap("one   two\t\tthree\n four");
    expect(r.get("Words")).toBe("4");
  });

  it("estimates reading time from 225 wpm", () => {
    const words = Array(450).fill("word").join(" ");
    const r = resultMap(words);
    expect(r.get("Reading time")).toBe("2 min");
  });

  it("shows under a minute for short text", () => {
    const r = resultMap("just a few words here");
    expect(r.get("Reading time")).toBe("< 1 min");
  });
});
