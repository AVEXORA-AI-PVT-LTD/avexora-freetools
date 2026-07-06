import type { GenerateFn } from "@/tools/types";
import { toNumber } from "../format";

const HEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export const generateGradient: GenerateFn = (values) => {
  const from = typeof values.from === "string" ? values.from.trim() : "";
  const to = typeof values.to === "string" ? values.to.trim() : "";
  const type = values.type === "radial" ? "radial" : "linear";

  if (!HEX.test(from)) return { error: "Enter a valid start colour as hex, e.g. #4f46e5." };
  if (!HEX.test(to)) return { error: "Enter a valid end colour as hex, e.g. #9333ea." };

  let gradient: string;
  if (type === "radial") {
    gradient = `radial-gradient(circle, ${from} 0%, ${to} 100%)`;
  } else {
    const angle = toNumber(values.angle) ?? 135;
    if (angle < 0 || angle > 360) return { error: "Angle must be between 0 and 360 degrees." };
    gradient = `linear-gradient(${angle}deg, ${from} 0%, ${to} 100%)`;
  }

  return {
    text: [
      `background: ${gradient};`,
      "",
      "/* With a solid fallback for very old browsers */",
      `background: ${from};`,
      `background: ${gradient};`,
    ].join("\n"),
    filename: "gradient.css",
  };
};
