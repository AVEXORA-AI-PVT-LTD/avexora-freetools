import { describe, it, expect, vi, beforeEach } from "vitest";
import { getEffectiveContent } from "../src/server/content";
import { prisma } from "../src/server/db";

vi.mock("../src/server/db", () => ({
  prisma: {
    contentBlock: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

describe("Content Resolver", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns static default when missing", async () => {
    (prisma.contentBlock.findUnique as any).mockResolvedValue(null);
    const result = await getEffectiveContent("homepage.hero.title");
    expect(result).toBe("Avexora Tools");
  });

  it("returns override when status is true", async () => {
    (prisma.contentBlock.findUnique as any).mockResolvedValue({
      key: "homepage.hero.title",
      value: "New Title",
      status: true,
    });
    const result = await getEffectiveContent("homepage.hero.title");
    expect(result).toBe("New Title");
  });

  it("returns static default when status is false", async () => {
    (prisma.contentBlock.findUnique as any).mockResolvedValue({
      key: "homepage.hero.title",
      value: "New Title",
      status: false,
    });
    const result = await getEffectiveContent("homepage.hero.title");
    expect(result).toBe("Avexora Tools");
  });

  it("rejects unknown keys gracefully", async () => {
    const result = await getEffectiveContent("unknown.key" as any);
    expect(result).toBe("");
  });
});
