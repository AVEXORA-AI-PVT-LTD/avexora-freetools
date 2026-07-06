import type { GenerateFn } from "@/tools/types";
import { toNumber } from "../format";

export const generateUuids: GenerateFn = (values) => {
  const count = toNumber(values.count);
  if (count === null || !Number.isInteger(count) || count < 1 || count > 100) {
    return { error: "Enter a count between 1 and 100." };
  }
  const uuids = Array.from({ length: count }, () => crypto.randomUUID());
  return { text: uuids.join("\n"), filename: "uuids.txt" };
};
