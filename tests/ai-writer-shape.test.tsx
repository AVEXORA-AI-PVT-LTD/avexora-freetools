import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AiWriterShape } from "@/components/tools/tool-shapes/ai-writer-shape";
import { tools as aiWriterTools } from "@/tools/configs/ai-writers";
import type { AiWriterTool } from "@/types/tools";

const jdTool = aiWriterTools.find((t) => t.slug === "job-description-generator") as AiWriterTool;
const SIDEBAR_TEXT = "This AI tool is not available right now";

describe("AiWriterShape (server-rendered initial state)", () => {
  it("Test 1 — renders the full form when AI is enabled", () => {
    const html = renderToString(<AiWriterShape tool={jdTool} aiEnabled />);
    expect(html).toContain("Job role / title");
    expect(html).toContain("Experience level");
    expect(html).toContain("Required skills");
    expect(html).toContain("Industry / field");
    expect(html).toContain("Company information");
    expect(html).toContain("Additional responsibilities / requirements");
    expect(html).toContain("Select experience level");
    expect(html).toContain("Executive");
    expect(html).toContain("Generate job description");
    expect(html).not.toContain(SIDEBAR_TEXT);
  });

  it("Test 2 — required fields render an asterisk marker", () => {
    const html = renderToString(<AiWriterShape tool={jdTool} aiEnabled />);
    expect((html.match(/\*/g) ?? []).length).toBe(3);
  });

  it("Test 3 — no error text and no output block in the pristine state", () => {
    const html = renderToString(<AiWriterShape tool={jdTool} aiEnabled />);
    expect(html).not.toContain("This field is required.");
    expect(html).not.toContain("<pre");
  });

  it("Test 4 — renders the unavailable notice when AI is disabled", () => {
    const html = renderToString(<AiWriterShape tool={jdTool} aiEnabled={false} />);
    expect(html).toContain(SIDEBAR_TEXT);
    expect(html).not.toContain("Generate job description");
  });
});