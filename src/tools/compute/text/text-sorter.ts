import type { GenerateFn } from "@/types/tools";

export const sortText: GenerateFn = (values) => {
  const text = typeof values.text === "string" ? values.text : "";
  const mode = typeof values.mode === "string" ? values.mode : "az";
  const caseInsensitive = values.caseInsensitive === true;

  if (text === "") return { error: "Paste some lines to sort." };

  const lines = text.split("\n");
  const key = (line: string) => (caseInsensitive ? line.toLowerCase() : line);
  const compareText = (a: string, b: string) =>
    key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0;

  let sorted: string[];
  switch (mode) {
    case "az":
      sorted = [...lines].sort(compareText);
      break;
    case "za":
      sorted = [...lines].sort((a, b) => compareText(b, a));
      break;
    case "length-asc":
      sorted = [...lines].sort((a, b) => a.length - b.length);
      break;
    case "length-desc":
      sorted = [...lines].sort((a, b) => b.length - a.length);
      break;
    case "natural":
      sorted = [...lines].sort((a, b) =>
        key(a).localeCompare(key(b), "en", { numeric: true }),
      );
      break;
    default:
      return { error: "Unknown sort order." };
  }

  return { text: sorted.join("\n"), filename: "sorted.txt" };
};
