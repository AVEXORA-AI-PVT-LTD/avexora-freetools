import type { GenerateFn } from "@/types/tools";

export const generateSlugs: GenerateFn = (values) => {
  const text = typeof values.text === "string" ? values.text : "";
  const sep = values.separator === "underscore" ? "_" : "-";

  const slugs = text
    .split("\n")
    .map((line) =>
      line
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, sep)
        .replace(new RegExp(`^\\${sep}+|\\${sep}+$`, "g"), ""),
    )
    .filter((slug) => slug.length > 0);

  if (slugs.length === 0) {
    return { error: "Enter at least one title to convert into a slug." };
  }

  return { text: slugs.join("\n") };
};
