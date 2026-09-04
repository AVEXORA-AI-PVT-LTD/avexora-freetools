import { z } from "zod";
import { prisma } from "@/server/db";
import { assertBrandLimit, consumeQuota } from "@/server/studio/entitlements";
import { errorResponse, readJson, requireUser } from "@/server/studio/route-helpers";
import { generateDirections } from "@/studio/ai/brand-brief";
import { seedFrom } from "@/studio/engine/marks";
import { ENTITY_TYPES } from "@/studio/compliance/india";

export const runtime = "nodejs";

const entityValues = ENTITY_TYPES.map((e) => e.value) as [string, ...string[]];

const createSchema = z.object({
  name: z.string().min(1).max(120),
  industry: z.string().min(1).max(80),
  entityType: z.enum(entityValues),
  description: z.string().max(600).optional(),
  tone: z.array(z.string().max(40)).max(6).default([]),
  audience: z.string().max(200).optional(),
  legalName: z.string().max(200).optional(),
  cin: z.string().max(30).optional(),
  llpin: z.string().max(20).optional(),
  gstin: z.string().max(20).optional(),
  pan: z.string().max(15).optional(),
  registeredAddress: z.string().max(400).optional(),
  city: z.string().max(80).optional(),
  state: z.string().max(80).optional(),
  pincode: z.string().max(10).optional(),
  phone: z.string().max(30).optional(),
  email: z.string().max(254).optional(),
  website: z.string().max(200).optional(),
});

export async function GET() {
  try {
    const userId = await requireUser();
    const brands = await prisma.brand.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: { kit: true },
    });
    return Response.json({ brands });
  } catch (error) {
    return errorResponse(error);
  }
}

/**
 * Create a brand and return three AI-curated directions to choose from.
 *
 * The brand row is written before curation so a failed or slow AI call never
 * loses the founder's typed particulars — the wizard can retry directions
 * against an existing brand.
 */
export async function POST(req: Request) {
  try {
    const userId = await requireUser();
    await assertBrandLimit(userId);

    const parsed = createSchema.safeParse(await readJson(req));
    if (!parsed.success) {
      return Response.json({ error: "Check the form and try again." }, { status: 400 });
    }
    const { tone, description, audience, ...brandFields } = parsed.data;

    const brand = await prisma.brand.create({
      data: { ...brandFields, userId },
    });

    // Metered separately from exports: curation is the expensive call.
    await consumeQuota(userId, "aiCurations");

    const { directions, source } = await generateDirections({
      name: brand.name,
      industry: brand.industry,
      description,
      tone,
      audience,
    });

    return Response.json({
      brand,
      directions,
      source,
      defaultSeed: seedFrom(brand.name),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
