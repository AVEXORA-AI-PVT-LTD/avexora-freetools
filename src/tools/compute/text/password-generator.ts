import type { GenerateFn } from "@/tools/types";
import { toNumber } from "../format";

const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWER = "abcdefghijklmnopqrstuvwxyz";
const NUMBERS = "0123456789";
const SYMBOLS = "!@#$%^&*()-_=+[]{};:,.<>?";

/** Unbiased random index in [0, max) using rejection sampling over
 *  crypto.getRandomValues (available in browsers and Node 18+). */
function randomIndex(max: number): number {
  const limit = Math.floor(0x100000000 / max) * max;
  const buf = new Uint32Array(1);
  let value: number;
  do {
    crypto.getRandomValues(buf);
    value = buf[0];
  } while (value >= limit);
  return value % max;
}

export const generatePassword: GenerateFn = (values) => {
  const length = toNumber(values.length);
  if (length === null || !Number.isInteger(length) || length < 4 || length > 128) {
    return { error: "Password length must be a whole number between 4 and 128." };
  }

  const pools: string[] = [];
  if (values.uppercase !== false) pools.push(UPPER);
  if (values.lowercase !== false) pools.push(LOWER);
  if (values.numbers !== false) pools.push(NUMBERS);
  if (values.symbols === true) pools.push(SYMBOLS);

  if (pools.length === 0) {
    return { error: "Select at least one character type (uppercase, lowercase, numbers or symbols)." };
  }

  const charset = pools.join("");
  const chars: string[] = [];

  // Guarantee at least one character from every selected pool, then fill the
  // rest from the combined charset and shuffle.
  for (const pool of pools) chars.push(pool[randomIndex(pool.length)]);
  while (chars.length < length) chars.push(charset[randomIndex(charset.length)]);
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomIndex(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return { text: chars.join("") };
};
