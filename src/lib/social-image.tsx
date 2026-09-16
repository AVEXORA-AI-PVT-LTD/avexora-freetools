import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { DISPLAYED_TOOL_COUNT } from "@/tools/registry";

export const alt = `Avexora Tools — ${DISPLAYED_TOOL_COUNT}+ free business tools`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const logoUrl = readFile(join(process.cwd(), "public", "logo.png")).then(
  (buf) => `data:image/png;base64,${buf.toString("base64")}`,
);

const MAX_TITLE_LENGTH = 48;
const MAX_SUBTITLE_LENGTH = 96;

function fontSize(title: string): number {
  if (title.length <= 26) return 54;
  if (title.length <= 38) return 46;
  return 38;
}

export async function renderSocialImage(title?: string, subtitle?: string) {
  const logo = await logoUrl;
  const heading =
    title && title.trim()
      ? title.trim().slice(0, MAX_TITLE_LENGTH)
      : "Avex tools that run your business faster";
  const sub =
    subtitle && subtitle.trim()
      ? subtitle.trim().slice(0, MAX_SUBTITLE_LENGTH)
      : "Calculators · Generators · PDF · Image utilities · AI writers";
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, #0f172a 0%, #1e293b 55%, #431407 100%)",
          fontFamily: "sans-serif",
          color: "#ffffff",
          padding: "0 60px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#ffffff",
            borderRadius: 24,
            padding: "28px 56px",
          }}
        >
          <img
            src={logo}
            alt=""
            width={560}
            height={280}
            style={{ objectFit: "contain" }}
          />
        </div>
        <div
          style={{
            display: "flex",
            fontSize: fontSize(heading),
            fontWeight: 700,
            marginTop: 36,
            letterSpacing: -1,
            textAlign: "center",
          }}
        >
          {heading}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 26,
            color: "#fdba74",
            marginTop: 18,
          }}
        >
          {sub}
        </div>
      </div>
    ),
    { ...size },
  );
}