import type { GenerateFn } from "@/tools/types";

const NAMED: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

function encodeEntities(text: string): string {
  return text.replace(/[&<>"']|[^\x20-\x7e\n\r\t]/g, (ch) => {
    switch (ch) {
      case "&": return "&amp;";
      case "<": return "&lt;";
      case ">": return "&gt;";
      case '"': return "&quot;";
      case "'": return "&#39;";
      default: return `&#${ch.codePointAt(0)};`;
    }
  });
}

function decodeEntities(text: string): string {
  return text.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (whole, body: string) => {
    if (body.startsWith("#x") || body.startsWith("#X")) {
      const code = parseInt(body.slice(2), 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : whole;
    }
    if (body.startsWith("#")) {
      const code = parseInt(body.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : whole;
    }
    return NAMED[body.toLowerCase()] ?? whole;
  });
}

export const generateHtmlEntities: GenerateFn = (values) => {
  const text = typeof values.text === "string" ? values.text : "";
  const mode = values.mode === "decode" ? "decode" : "encode";
  if (text === "") return { error: `Enter some text to ${mode}.` };
  return { text: mode === "encode" ? encodeEntities(text) : decodeEntities(text) };
};
