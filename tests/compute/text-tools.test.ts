import { describe, expect, it } from "vitest";
import type { FieldValues, GenerateFn } from "@/types/tools";
import { computeCharacterCount } from "@/tools/compute/text/character-counter";
import { convertCase } from "@/tools/compute/text/case-converter";
import { formatJson } from "@/tools/compute/text/json-formatter";
import { csvToJson } from "@/tools/compute/text/csv-to-json";
import { jsonToCsv } from "@/tools/compute/text/json-to-csv";
import { generateDiff } from "@/tools/compute/text/text-diff-checker";
import { generateLoremIpsum } from "@/tools/compute/text/lorem-ipsum-generator";
import { generatePassword } from "@/tools/compute/text/password-generator";
import { removeDuplicateLines } from "@/tools/compute/text/remove-duplicate-lines";
import { sortText } from "@/tools/compute/text/text-sorter";
import { findAndReplace } from "@/tools/compute/text/find-and-replace";

function textOf(fn: GenerateFn, values: FieldValues): string {
  const out = fn(values);
  if ("error" in out) throw new Error(out.error);
  return out.text;
}

describe("computeCharacterCount", () => {
  it("counts characters with and without spaces", () => {
    const out = computeCharacterCount({ text: "ab cd" });
    if ("error" in out) throw new Error(out.error);
    const map = new Map(out.results.map((r) => [r.label, r.value]));
    expect(map.get("Characters")).toBe("5");
    expect(map.get("Characters (no spaces)")).toBe("4");
    expect(map.get("Words")).toBe("2");
  });
});

describe("convertCase", () => {
  it("converts to the writing cases", () => {
    expect(textOf(convertCase, { text: "hello world", mode: "upper" })).toBe("HELLO WORLD");
    expect(textOf(convertCase, { text: "HELLO World", mode: "lower" })).toBe("hello world");
    expect(textOf(convertCase, { text: "hello world", mode: "title" })).toBe("Hello World");
    expect(textOf(convertCase, { text: "first line. second line.", mode: "sentence" })).toBe(
      "First line. Second line.",
    );
  });
  it("converts to the programmer cases with camel-hump detection", () => {
    expect(textOf(convertCase, { text: "user email address", mode: "camel" })).toBe("userEmailAddress");
    expect(textOf(convertCase, { text: "userEmailAddress", mode: "snake" })).toBe("user_email_address");
    expect(textOf(convertCase, { text: "user email", mode: "pascal" })).toBe("UserEmail");
    expect(textOf(convertCase, { text: "User Email", mode: "kebab" })).toBe("user-email");
  });
  it("rejects empty input", () => {
    expect(convertCase({ text: "", mode: "upper" })).toHaveProperty("error");
  });
});

describe("formatJson", () => {
  it("pretty-prints with 2 spaces", () => {
    expect(textOf(formatJson, { json: '{"a":1}', mode: "pretty2" })).toBe('{\n  "a": 1\n}');
  });
  it("minifies", () => {
    expect(textOf(formatJson, { json: '{ "a" : 1 }', mode: "minify" })).toBe('{"a":1}');
  });
  it("reports invalid JSON", () => {
    expect(formatJson({ json: "{a:1}", mode: "pretty2" })).toHaveProperty("error");
  });
});

describe("csvToJson", () => {
  it("converts with a header row", () => {
    const out = textOf(csvToJson, { csv: "name,city\nAsha,Pune", delimiter: "comma", header: true });
    expect(JSON.parse(out)).toEqual([{ name: "Asha", city: "Pune" }]);
  });
  it("honours quoted fields with embedded commas", () => {
    const out = textOf(csvToJson, {
      csv: 'name,address\nAsha,"12, MG Road, Pune"',
      delimiter: "comma",
      header: true,
    });
    expect(JSON.parse(out)[0].address).toBe("12, MG Road, Pune");
  });
  it("generates column names without a header", () => {
    const out = textOf(csvToJson, { csv: "1,2\n3,4", delimiter: "comma", header: false });
    expect(JSON.parse(out)).toEqual([
      { column1: "1", column2: "2" },
      { column1: "3", column2: "4" },
    ]);
  });
});

describe("jsonToCsv", () => {
  it("builds a header from the union of keys", () => {
    const out = textOf(jsonToCsv, { json: '[{"a":1},{"a":2,"b":"x"}]' });
    const [header, r1, r2] = out.split("\n");
    expect(header).toBe("a,b");
    expect(r1).toBe("1,");
    expect(r2).toBe("2,x");
  });
  it("quotes values containing commas", () => {
    const out = textOf(jsonToCsv, { json: '[{"addr":"12, MG Road"}]' });
    expect(out.split("\n")[1]).toBe('"12, MG Road"');
  });
  it("rejects non-array input", () => {
    expect(jsonToCsv({ json: '{"a":1}' })).toHaveProperty("error");
  });
});

describe("generateDiff", () => {
  it("marks additions and removals", () => {
    const out = textOf(generateDiff, { original: "a\nb\nc", changed: "a\nx\nc" });
    expect(out.split("\n")).toEqual(["  a", "- b", "+ x", "  c"]);
  });
  it("recognises a pure insertion", () => {
    const out = textOf(generateDiff, { original: "a\nc", changed: "a\nb\nc" });
    expect(out.split("\n")).toEqual(["  a", "+ b", "  c"]);
  });
});

describe("generateLoremIpsum", () => {
  it("starts with the classic phrase", () => {
    expect(textOf(generateLoremIpsum, { count: 1, unit: "sentences" })).toMatch(/^Lorem ipsum dolor sit amet/);
  });
  it("produces the requested number of paragraphs and words", () => {
    expect(textOf(generateLoremIpsum, { count: 3, unit: "paragraphs" }).split("\n\n")).toHaveLength(3);
    expect(textOf(generateLoremIpsum, { count: 15, unit: "words" }).split(" ")).toHaveLength(15);
  });
  it("rejects out-of-range counts", () => {
    expect(generateLoremIpsum({ count: 0, unit: "paragraphs" })).toHaveProperty("error");
    expect(generateLoremIpsum({ count: 21, unit: "paragraphs" })).toHaveProperty("error");
  });
});

describe("generatePassword", () => {
  it("respects length and includes each selected set", () => {
    const pw = textOf(generatePassword, {
      length: 32, uppercase: true, lowercase: true, numbers: true, symbols: true,
    });
    expect(pw).toHaveLength(32);
    expect(pw).toMatch(/[A-Z]/);
    expect(pw).toMatch(/[a-z]/);
    expect(pw).toMatch(/[0-9]/);
    expect(pw).toMatch(/[^A-Za-z0-9]/);
  });
  it("errors when no character set is selected", () => {
    expect(
      generatePassword({ length: 12, uppercase: false, lowercase: false, numbers: false, symbols: false }),
    ).toHaveProperty("error");
  });
  it("errors on out-of-range length", () => {
    expect(generatePassword({ length: 3, uppercase: true, lowercase: true, numbers: true, symbols: false })).toHaveProperty("error");
  });
});

describe("removeDuplicateLines", () => {
  it("keeps first occurrence and order", () => {
    expect(textOf(removeDuplicateLines, { text: "b\na\nb\nc\na" })).toBe("b\na\nc");
  });
  it("supports case-insensitive and trim modes", () => {
    expect(textOf(removeDuplicateLines, { text: "Apple\napple ", caseInsensitive: true, trim: true })).toBe("Apple");
  });
});

describe("sortText", () => {
  it("sorts A→Z case-insensitively", () => {
    expect(textOf(sortText, { text: "banana\nApple\ncherry", mode: "az", caseInsensitive: true })).toBe(
      "Apple\nbanana\ncherry",
    );
  });
  it("natural-sorts embedded numbers", () => {
    expect(textOf(sortText, { text: "item10\nitem2\nitem1", mode: "natural" })).toBe("item1\nitem2\nitem10");
  });
  it("sorts by length", () => {
    expect(textOf(sortText, { text: "ccc\na\nbb", mode: "length-asc" })).toBe("a\nbb\nccc");
  });
});

describe("findAndReplace", () => {
  it("replaces case-insensitively by default", () => {
    expect(textOf(findAndReplace, { text: "Cat cat CAT", find: "cat", replace: "dog" })).toBe("dog dog dog");
  });
  it("respects whole-word mode", () => {
    expect(
      textOf(findAndReplace, { text: "cat category", find: "cat", replace: "dog", wholeWord: true }),
    ).toBe("dog category");
  });
  it("supports regex capture groups", () => {
    expect(
      textOf(findAndReplace, {
        text: "05-07-2026", find: "(\\d{2})-(\\d{2})-(\\d{4})", replace: "$3/$2/$1", regexMode: true,
      }),
    ).toBe("2026/07/05");
  });
  it("treats replacement literally in plain mode", () => {
    expect(textOf(findAndReplace, { text: "price", find: "price", replace: "$&100" })).toBe("$&100");
  });
  it("errors on invalid regex", () => {
    expect(findAndReplace({ text: "abc", find: "(", replace: "", regexMode: true })).toHaveProperty("error");
  });
});
