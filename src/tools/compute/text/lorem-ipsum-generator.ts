import type { GenerateFn } from "@/tools/types";
import { toNumber } from "../format";

const SENTENCES = [
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
  "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
  "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
  "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium.",
  "Totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.",
  "Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.",
  "Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem.",
];

const SENTENCES_PER_PARAGRAPH = 4;

function sentenceAt(index: number): string {
  return SENTENCES[index % SENTENCES.length];
}

export const generateLoremIpsum: GenerateFn = (values) => {
  const count = toNumber(values.count);
  const unit = typeof values.unit === "string" ? values.unit : "paragraphs";

  if (count === null || !Number.isInteger(count) || count < 1 || count > 20) {
    return { error: "Enter an amount between 1 and 20." };
  }

  let text: string;
  if (unit === "words") {
    const words: string[] = [];
    let i = 0;
    while (words.length < count) {
      words.push(...sentenceAt(i).replace(/[.,]/g, "").split(" "));
      i++;
    }
    text = words.slice(0, count).join(" ");
  } else if (unit === "sentences") {
    text = Array.from({ length: count }, (_, i) => sentenceAt(i)).join(" ");
  } else {
    text = Array.from({ length: count }, (_, p) =>
      Array.from({ length: SENTENCES_PER_PARAGRAPH }, (_, s) =>
        sentenceAt(p * SENTENCES_PER_PARAGRAPH + s),
      ).join(" "),
    ).join("\n\n");
  }

  return { text, filename: "lorem-ipsum.txt" };
};
