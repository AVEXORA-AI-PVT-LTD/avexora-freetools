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

export async function renderSocialImage() {
  const logo = await logoUrl;
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
            fontSize: 54,
            fontWeight: 700,
            marginTop: 36,
            letterSpacing: -1,
          }}
        >
          Avex tools that run your business faster
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 26,
            color: "#fdba74",
            marginTop: 18,
          }}
        >
          Calculators · Generators · PDF · Image utilities · AI writers
        </div>
      </div>
    ),
    { ...size },
  );
}