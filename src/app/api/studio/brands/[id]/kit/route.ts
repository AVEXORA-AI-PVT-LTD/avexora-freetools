import { z } from "zod";
import { prisma } from "@/server/db";
import { errorResponse, HttpError, readJson, requireUser } from "@/server/studio/route-helpers";
import { MARK_STYLES, type MarkStyle, seedFrom } from "@/studio/engine/marks";
import { PALETTE_IDS } from "@/studio/engine/palettes";
import { FONT_PAIR_IDS } from "@/studio/engine/fonts";
import { LOGO_LAYOUTS } from "@/studio/engine/logo";
import {
  type KitSelection,
  type LogoLayout,
  resolveTokens,
} from "@/studio/engine/tokens";

export const runtime = "nodejs";

const kitSchema = z.object({
  paletteId: z.enum(PALETTE_IDS as [string, ...string[]]),
  fontPairId: z.enum(FONT_PAIR_IDS as [string, ...string[]]),
  markStyle: z.enum(MARK_STYLES as [string, ...string[]]),
  markSeed: z.number().int().optional(),
  logoLayout: z.enum(LOGO_LAYOUTS as unknown as [string, ...string[]]).optional(),
  tagline: z.string().max(120).optional(),
});

/**
 * Save the chosen brand direction as the brand's kit.
 *
 * The resolved tokens are snapshotted into `tokens` alongside the selection
 * ids. The ids are what we re-render from; the snapshot is there so an older
 * kit stays inspectable if a registry entry is ever retired.
 */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await requireUser();
    const { id } = await params;

    const brand = await prisma.brand.findFirst({ where: { id, userId } });
    if (!brand) throw new HttpError(404, "Brand not found.");

    const parsed = kitSchema.safeParse(await readJson(req));
    if (!parsed.success) {
      return Response.json({ error: "Invalid brand kit." }, { status: 400 });
    }

    const markSeed = parsed.data.markSeed ?? seedFrom(brand.name);
    const logoLayout = (parsed.data.logoLayout as LogoLayout | undefined) ?? "horizontal";

    const selection: KitSelection = {
      ...parsed.data,
      markStyle: parsed.data.markStyle as MarkStyle,
      logoLayout,
      markSeed,
    };

    const tokens = resolveTokens(
      {
        name: brand.name,
        legalName: brand.legalName ?? undefined,
        tagline: selection.tagline,
      },
      selection,
    );

    const data = {
      paletteId: selection.paletteId,
      fontPairId: selection.fontPairId,
      markStyle: selection.markStyle,
      markSeed,
      logoLayout,
      tagline: selection.tagline ?? null,
      tokens: JSON.parse(JSON.stringify(tokens)),
    };

    const kit = await prisma.brandKit.upsert({
      where: { brandId: brand.id },
      create: { brandId: brand.id, ...data },
      update: { ...data, version: { increment: 1 } },
    });

    await prisma.brand.update({
      where: { id: brand.id },
      data: { updatedAt: new Date() },
    });

    return Response.json({ kit });
  } catch (error) {
    return errorResponse(error);
  }
}
