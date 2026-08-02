import { z } from "zod";
import { prisma } from "@/server/db";
import { assertCapability, consumeQuota } from "@/studio/entitlements";
import { errorResponse, HttpError, readJson, requireUser } from "@/studio/route-helpers";
import { generateCopy } from "@/studio/ai/copy";
import { clientIp, rateLimit } from "@/server/rate-limit";

export const runtime = "nodejs";

const schema = z.object({
  brandId: z.string().min(1),
  kind: z.enum(["social-post", "ad-headline", "tagline", "announcement"]),
  topic: z.string().min(1).max(300),
  tone: z.string().max(60).optional(),
});

export async function POST(req: Request) {
  try {
    const userId = await requireUser();

    if (!rateLimit(`studio-copy:${clientIp(req)}`, 20)) {
      return Response.json({ error: "Too many requests." }, { status: 429 });
    }

    const parsed = schema.safeParse(await readJson(req));
    if (!parsed.success) throw new HttpError(400, "Invalid copy request.");

    const brand = await prisma.brand.findFirst({
      where: { id: parsed.data.brandId, userId },
    });
    if (!brand) throw new HttpError(404, "Brand not found.");

    await assertCapability(userId, "aiCopy");
    await consumeQuota(userId, "aiCurations");

    const result = await generateCopy({
      kind: parsed.data.kind,
      brandName: brand.name,
      industry: brand.industry,
      topic: parsed.data.topic,
      tone: parsed.data.tone,
    });

    return Response.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
