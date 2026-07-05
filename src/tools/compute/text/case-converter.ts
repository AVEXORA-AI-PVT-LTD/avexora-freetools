import type { GenerateFn } from "@/tools/types";

/** Split text into words on whitespace, punctuation and camelCase boundaries. */
function splitWords(text: string): string[] {
  return text
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .split(/[^A-Za-z0-9]+/)
    .filter((w) => w !== "");
}

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

function toTitleCase(text: string): string {
  return text.replace(/\S+/g, (word) =>
    word.replace(/[A-Za-z]/, (c) => c.toUpperCase()),
  );
}

function toSentenceCase(text: string): string {
  const lower = text.toLowerCase();
  // Capitalize the first letter of the text and of each sentence.
  return lower.replace(/(^\s*|[.!?]\s+)([a-z])/g, (_m, prefix: string, letter: string) => prefix + letter.toUpperCase());
}

export const convertCase: GenerateFn = (values) => {
  const text = typeof values.text === "string" ? values.text : "";
  const mode = typeof values.mode === "string" ? values.mode : "upper";
  if (text === "") return { error: "Enter some text to convert." };

  const words = splitWords(text);

  switch (mode) {
    case "upper":
      return { text: text.toUpperCase() };
    case "lower":
      return { text: text.toLowerCase() };
    case "title":
      return { text: toTitleCase(text) };
    case "sentence":
      return { text: toSentenceCase(text) };
    case "camel":
      return {
        text: words.map((w, i) => (i === 0 ? w.toLowerCase() : capitalize(w))).join(""),
      };
    case "pascal":
      return { text: words.map(capitalize).join("") };
    case "snake":
      return { text: words.map((w) => w.toLowerCase()).join("_") };
    case "kebab":
      return { text: words.map((w) => w.toLowerCase()).join("-") };
    default:
      return { error: "Unknown conversion mode." };
  }
};
