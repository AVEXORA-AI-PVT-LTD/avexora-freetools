import type { GenerateFn } from "@/types/tools";

/** Line-based diff via a simple LCS table. Returns unified-style lines:
 *  "  " unchanged, "- " removed, "+ " added. */
export function diffLines(aText: string, bText: string): string[] {
  const a = aText.split("\n");
  const b = bText.split("\n");
  const n = a.length;
  const m = b.length;

  // lcs[i][j] = length of LCS of a[i..] and b[j..]
  const lcs: number[][] = Array.from({ length: n + 1 }, () =>
    new Array<number>(m + 1).fill(0),
  );
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      lcs[i][j] =
        a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }

  const out: string[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      out.push(`  ${a[i]}`);
      i++;
      j++;
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      out.push(`- ${a[i]}`);
      i++;
    } else {
      out.push(`+ ${b[j]}`);
      j++;
    }
  }
  while (i < n) out.push(`- ${a[i++]}`);
  while (j < m) out.push(`+ ${b[j++]}`);
  return out;
}

export const generateDiff: GenerateFn = (values) => {
  const original = typeof values.original === "string" ? values.original : "";
  const changed = typeof values.changed === "string" ? values.changed : "";

  if (original === "" && changed === "") {
    return { error: "Paste text into both boxes to compare them." };
  }
  if (original === changed) {
    return { text: "The two texts are identical — no differences found." };
  }

  return { text: diffLines(original, changed).join("\n"), filename: "diff.txt" };
};
