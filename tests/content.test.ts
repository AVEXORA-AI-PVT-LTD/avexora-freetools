import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ContentBlock } from "@prisma/client";
import { getEffectiveContent, type ContentBlockKey } from "../src/server/content";
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

const findUnique = vi.mocked(prisma.contentBlock.findUnique);

/** A complete ContentBlock row; only key/value/status matter to the resolver. */
function contentBlock(fields: Pick<ContentBlock, "key" | "value" | "status">): ContentBlock {
  return {
    id: "000000000000000000000001",
    type: "TEXT",
    createdAt: new Date(0),
    updatedAt: new Date(0),
    hitCount: 0,
    lastHitAt: null,
    ...fields,
  };
}

describe("Content Resolver", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns static default when missing", async () => {
    findUnique.mockResolvedValue(null);
    const result = await getEffectiveContent("homepage.hero.title");
    expect(result).toBe("Avexora Tools");
  });

  it("returns override when status is true", async () => {
    findUnique.mockResolvedValue(
      contentBlock({ key: "homepage.hero.title", value: "New Title", status: true }),
    );
    const result = await getEffectiveContent("homepage.hero.title");
    expect(result).toBe("New Title");
  });

  it("returns static default when status is false", async () => {
    findUnique.mockResolvedValue(
      contentBlock({ key: "homepage.hero.title", value: "New Title", status: false }),
    );
    const result = await getEffectiveContent("homepage.hero.title");
    expect(result).toBe("Avexora Tools");
  });

  it("rejects unknown keys gracefully", async () => {
    const result = await getEffectiveContent("unknown.key" as string as ContentBlockKey);
    expect(result).toBe("");
  });
});
