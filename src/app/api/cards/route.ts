import { prisma } from "@/server/db";
import { errorResponse, HttpError, readJson, requireUser } from "@/server/studio/route-helpers";
import { rateLimit } from "@/server/rate-limit";
import {
  assertCanSaveCards,
  cardToJson,
  MAX_CARDS_PER_USER,
  newCardSlug,
  parseCardPayload,
  toCardSummary,
} from "@/server/cards";

export const runtime = "nodejs";

/** The signed-in user's saved cards, newest first. */
export async function GET() {
  try {
    const userId = await requireUser();
    const rows = await prisma.digitalCard.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });
    return Response.json({ cards: rows.map(toCardSummary) });
  } catch (error) {
    return errorResponse(error);
  }
}

/** Save a new card and return its public link. Paid plans only. */
export async function POST(req: Request) {
  try {
    const userId = await requireUser();
    if (!rateLimit(`cards:${userId}`, 20)) throw new HttpError(429, "Too many saves — wait a minute and try again.");
    await assertCanSaveCards(userId);

    const parsed = parseCardPayload(await readJson(req));
    if (!parsed.ok) throw new HttpError(400, parsed.error);

    const count = await prisma.digitalCard.count({ where: { userId } });
    if (count >= MAX_CARDS_PER_USER) {
      throw new HttpError(409, `You can keep up to ${MAX_CARDS_PER_USER} cards. Delete one to save another.`);
    }

    const row = await prisma.digitalCard.create({
      data: {
        userId,
        slug: newCardSlug(parsed.value.card.name),
        data: cardToJson(parsed.value.card),
        qrTarget: parsed.value.qrTarget,
      },
    });
    return Response.json({ card: toCardSummary(row) }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
