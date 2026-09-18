/**
 * Test-only barcode DECODERS — deliberately independent of both `jsbarcode`
 * (the renderer under test) and `bwip-js` (the reference encoder). They parse
 * the rendered module pattern directly from SVG geometry and decode it against
 * the published EAN-13/UPC-A and Code 128 code tables, verifying guards,
 * parities and check digits. This proves the *actual generated pattern* (not
 * the library's internal data) is a valid symbology that a scanner would read.
 */

export interface BarRun {
  x: number;
  width: number;
}

/** Extract sorted bar runs (x, width) from a jsbarcode SVG string (rects only). */
export function jsbarcodeRuns(svgMarkup: string): BarRun[] {
  const holder = globalThis.document.createElement("div");
  holder.innerHTML = svgMarkup;
  const vb = holder.getElementsByTagName("svg")[0];
  const vbW = parseInt(vb.getAttribute("width") ?? "", 10);
  const runs: BarRun[] = [];
  for (const g of Array.from(holder.getElementsByTagName("g"))) {
    const t = g.getAttribute("transform") ?? "";
    const m = /translate\(\s*(-?[\d.]+)[,\s]+(-?[\d.]+)/.exec(t);
    if (!m) continue;
    const gx = parseFloat(m[1]);
    for (const r of Array.from(g.getElementsByTagName("rect"))) {
      const w = parseFloat(r.getAttribute("width") ?? "");
      if (w === vbW) continue; // full-background rect
      runs.push({ x: gx + parseFloat(r.getAttribute("x") ?? "0"), width: w });
    }
  }
  return runs.sort((a, b) => a.x - b.x);
}

/** Extract sorted bar runs from a bwip-js SVG string (stroke paths). */
export function bwipRuns(svgMarkup: string): BarRun[] {
  const bars: BarRun[] = [];
  for (const pm of svgMarkup.matchAll(/<path[^>]*stroke-width="([\d.]+)"[^>]*d="([^"]+)"/g)) {
    const sw = parseFloat(pm[1]);
    for (const seg of pm[2].matchAll(/M([\d.]+) /g)) {
      bars.push({ x: parseFloat(seg[1]) - sw / 2, width: sw });
    }
  }
  return bars.sort((a, b) => a.x - b.x);
}

/**
 * Convert sorted bar runs into an alternating bit-string of bar modules
 * (`1` = bar, `0` = space). `modulePx` is the width of one module in pixels.
 * Left and right quiet zones become leading/trailing zeros.
 */
export function runsToModules(runs: BarRun[], modulePx: number): string {
  let bits = "";
  let prev = 0;
  for (const r of runs) {
    const s = Math.round(r.x / modulePx);
    const e = Math.round((r.x + r.width) / modulePx);
    for (let mv = prev; mv < s; mv++) bits += "0";
    for (let mv = s; mv < e; mv++) bits += "1";
    prev = e;
  }
  return bits;
}

/** Module width for a set of runs: the narrowest bar is one module. */
export function modulePxOfRuns(runs: BarRun[]): number {
  if (runs.length === 0) return 1;
  return Math.min(...runs.map((r) => r.width));
}

/** Strip leading/trailing quiet-zone zeros from a module bit-string. */
export function trimQuiet(bits: string): string {
  let s = 0;
  while (s < bits.length && bits[s] === "0") s++;
  let e = bits.length;
  while (e > s && bits[e - 1] === "0") e--;
  return bits.slice(s, e);
}

// ---------------------------------------------------------------------------
// EAN-13 / UPC-A
// ---------------------------------------------------------------------------

/** EAN-13 (L), (G) and (R) 7-module digit patterns from the GS1 spec. */
export const EAN_L: Record<string, string> = {
  "0": "0001101", "1": "0011001", "2": "0010011", "3": "0111101", "4": "0100011",
  "5": "0110001", "6": "0101111", "7": "0111011", "8": "0110111", "9": "0001011",
};
export const EAN_G: Record<string, string> = {
  "0": "0100111", "1": "0110011", "2": "0011011", "3": "0100001", "4": "0011101",
  "5": "0111001", "6": "0000101", "7": "0010001", "8": "0001001", "9": "0010111",
};
export const EAN_R: Record<string, string> = {
  "0": "1110010", "1": "1100110", "2": "1101100", "3": "1000010", "4": "1011100",
  "5": "1001110", "6": "1010000", "7": "1000100", "8": "1001000", "9": "1110100",
};

/** Left-digit parity set for each EAN-13 first digit (G = "G"). */
export const EAN_FIRST: Record<string, string> = {
  "0": "LLLLLL", "1": "LLGLGG", "2": "LLGGLG", "3": "LLGGGL",
  "4": "LGLLGG", "5": "LGGLLG", "6": "LGGGLL", "7": "LGLGLG",
  "8": "LGLGGL", "9": "LGGLGL",
};

const byLeftPattern = new Map<string, { digit: string; parity: "L" | "G" }>();
for (const [d, p] of Object.entries(EAN_L)) byLeftPattern.set(p, { digit: d, parity: "L" });
for (const [d, p] of Object.entries(EAN_G)) byLeftPattern.set(p, { digit: d, parity: "G" });
const byRightPattern = new Map<string, string>();
for (const [d, p] of Object.entries(EAN_R)) byRightPattern.set(p, d);

/**
 * Decode a full EAN-13 module bit-string (95 modules plus quiet zones) into
 * its 13-digit value. Throws on any structural mismatch. Also decodes UPC-A
 * renders (UPC-A is EAN-13 whose first digit is 0; jsbarcode "UPC" hides that
 * first zero, see decodeEanOrUpc for the caller-side strip).
 */
export function decodeEan13(bits: string): { value: string; firstDigit: string; leftParities: string } {
  const body = trimQuiet(bits);
  if (body.length !== 95) throw new Error(`EAN-13 body must be 95 modules (got ${body.length})`);
  if (body.slice(0, 3) !== "101") throw new Error("left guard pattern missing");
  if (body.slice(45, 50) !== "01010") throw new Error("centre guard pattern missing");
  if (body.slice(92) !== "101") throw new Error("right guard pattern missing");

  const left: string[] = [];
  const parities: string[] = [];
  for (let i = 0; i < 6; i++) {
    const pat = body.slice(3 + i * 7, 10 + i * 7);
    const hit = byLeftPattern.get(pat);
    if (!hit) throw new Error(`left digit ${i} pattern unrecognised: ${pat}`);
    left.push(hit.digit);
    parities.push(hit.parity);
  }
  const right: string[] = [];
  for (let i = 0; i < 6; i++) {
    const pat = body.slice(50 + i * 7, 57 + i * 7);
    const digit = byRightPattern.get(pat);
    if (digit === undefined) throw new Error(`right digit ${i} pattern unrecognised: ${pat}`);
    right.push(digit);
  }
  let firstDigit = "";
  for (const [d, set] of Object.entries(EAN_FIRST)) {
    if (set === parities.join("")) firstDigit = d;
  }
  if (!firstDigit) throw new Error(`left parity set unrecognised: ${parities.join("")}`);
  const value = firstDigit + left.join("") + right.join("");
  // Independent GS1 Modulo-10 check-digit verification of the decoded digits.
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += Number(value[i]) * (i % 2 === 0 ? 1 : 3);
  const expected = (10 - (sum % 10)) % 10;
  if (expected !== Number(value[12])) {
    throw new Error(`EAN-13 check digit mismatch in decoded pattern (got ${value[12]}, expected ${expected})`);
  }
  return { value, firstDigit, leftParities: parities.join("") };
}

/** Decode an EAN-13 or UPC-A value from a module bit-string. */
export function decodeEanOrUpc(bits: string): string {
  const { value, firstDigit } = decodeEan13(bits);
  if (firstDigit === "0") return value.slice(1); // UPC-A (12 digits)
  return value;
}

// ---------------------------------------------------------------------------
// Code 128
// ---------------------------------------------------------------------------

/** Value → 11-module pattern (index 106 = STOP, 13 modules). */
export const C128_PATTERNS: string[] = [
  "11011001100", "11001101100", "11001100110", "10010011000", "10010001100", "10001001100",
  "10011001000", "10011000100", "10001100100", "11001001000", "11001000100", "11000100100",
  "10110011100", "10011011100", "10011001110", "10111001100", "10011101100", "10011100110",
  "11001110010", "11001011100", "11001001110", "11011100100", "11001110100", "11101101110",
  "11101001100", "11100101100", "11100100110", "11101100100", "11100110100", "11100110010",
  "11011011000", "11011000110", "11000110110", "10100011000", "10001011000", "10001000110",
  "10110001000", "10001101000", "10001100010", "11010001000", "11000101000", "11000100010",
  "10110111000", "10110001110", "10001101110", "10111011000", "10111000110", "10001110110",
  "11101110110", "11010001110", "11000101110", "11011101000", "11011100010", "11011101110",
  "11101011000", "11101000110", "11100010110", "11101101000", "11101100010", "11100011010",
  "11101111010", "11001000010", "11110001010", "10100110000", "10100001100", "10010110000",
  "10010000110", "10000101100", "10000100110", "10110010000", "10110000100", "10011010000",
  "10011000010", "10000110100", "10000110010", "11000010010", "11001010000", "11110111010",
  "11000010100", "10001111010", "10100111100", "10010111100", "10010011110", "10111100100",
  "10011110100", "10011110010", "11110100100", "11110010100", "11110010010", "11011011110",
  "11011110110", "11110110110", "10101111000", "10100011110", "10001011110", "10111101000",
  "10111100010", "11110101000", "11110100010", "10111011110", "10111101110", "11101011110",
  "11110101110", "11010000100", "11010010000", "11010011100", "1100011101011",
];

const byC128Pattern = new Map<string, number>();
C128_PATTERNS.forEach((p, i) => {
  if (!byC128Pattern.has(p)) byC128Pattern.set(p, i);
});

/**
 * Set A characters for values 0–94: values 0–63 cover ASCII 32–95, values
 * 64–94 cover ASCII 0–30 (control characters).
 */
export function c128SetAChar(v: number): string {
  if (v < 64) return String.fromCharCode(v + 32);
  return String.fromCharCode(v - 64);
}

/** Set B characters for values 0–94 (printable ASCII 32–126). */
export function c128SetBChar(v: number): string {
  return String.fromCharCode(v + 32);
}

export interface Code128Decode {
  text: string;
  checksumVerified: boolean;
  symbols: number[];
}

/**
 * Static 11-module window reader: reads consecutive 11-module symbols, each
 * starting from the current offset, without consuming the final stop code
 * (which is 13 modules and cannot be chunked at 11).
 */
function readSymbols11(body: string): number[] {
  const runs: Array<{ on: boolean; m: number }> = [];
  if (!body) return [];
  let cur = body[0] === "1";
  let count = 0;
  for (const ch of body) {
    const on = ch === "1";
    if (on === cur) count++;
    else {
      runs.push({ on: cur, m: count });
      cur = on;
      count = 1;
    }
  }
  runs.push({ on: cur, m: count });
  const symbols: number[] = [];
  let pos = 0;
  while (pos < runs.length) {
    let rem = 11;
    let pat = "";
    while (rem > 0 && pos < runs.length) {
      const r = runs[pos];
      pos++;
      const n = Math.min(r.m, rem);
      pat += (r.on ? "1" : "0").repeat(n);
      rem -= n;
    }
    if (rem !== 0) return symbols; // incomplete trailing symbol
    const v = byC128Pattern.get(pat);
    if (v === undefined) return symbols;
    symbols.push(v);
  }
  return symbols;
}

/** The 13-module Code 128 stop pattern (including the termination bar). */
const C128_STOP = "1100011101011";

/**
 * Decode a Code 128 module bit-string into its text, applying code-set
 * latches (A/B/C), verifying the checksum, and terminating on the stop code.
 * Returns `null` if the pattern is structurally unrecognisable.
 *
 * Handles the standard latch values (95 CODE A / 96 CODE C / 97 CODE B) as
 * well as the values used by jsbarcode (99 → C / 100 → B / 101 → A) and the
 * one-symbol SHIFT (98) so that both commercial renderers round-trip.
 */
export function decodeCode128(bits: string): Code128Decode | null {
  const body = trimQuiet(bits);
  const stopStart = body.length - C128_STOP.length;
  if (stopStart < 11) return null;
  if (body.slice(stopStart) !== C128_STOP) return null;
  const symbols = readSymbols11(body.slice(0, stopStart));
  const start = symbols[0];
  if (start !== 103 && start !== 104 && start !== 105) return null;
  const values = symbols.slice(1);
  if (values.length < 2) return null; // need at least one data + checksum

  const dataVals = values.slice(0, -1);
  const checkSym = values[values.length - 1];
  let checksum = start;
  dataVals.forEach((v, i) => {
    checksum = (checksum + (i + 1) * v) % 103;
  });
  const checksumVerified = checkSym === checksum % 103;

  let set: "A" | "B" | "C" = start === 103 ? "A" : start === 104 ? "B" : "C";
  let shifted = false;
  const text: string[] = [];
  for (const v of dataVals) {
    if (v === 98) { shifted = true; continue; } // SHIFT (one symbol) / FNC1
    if (v === 95 || v === 101) { set = "A"; continue; } // CODE A (standard / jsbarcode)
    if (v === 96 || v === 99) { set = "C"; continue; } // CODE C (standard / jsbarcode)
    if (v === 97 || v === 100) { set = "B"; continue; } // CODE B (standard / jsbarcode)
    if (v === 102) { continue; } // EAN-128 code marker
    if (v <= 94) {
      let eff = set;
      if (shifted) {
        eff = set === "A" ? "B" : set === "B" ? "A" : set;
        shifted = false;
      }
      if (eff === "C") text.push(String(v).padStart(2, "0"));
      else if (eff === "A") text.push(c128SetAChar(v));
      else text.push(c128SetBChar(v));
    }
  }
  return { text: text.join(""), checksumVerified, symbols: [start, ...dataVals, checkSym, 106] };
}