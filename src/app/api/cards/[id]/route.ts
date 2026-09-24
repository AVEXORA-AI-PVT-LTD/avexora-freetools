import { prisma } from "@/server/db";
import { errorResponse, HttpError, readJson, requireUser } from "@/server/studio/route-helpers";
import { rateLimit } from "@/server/rate-limit";
import { assertCanSaveCards, cardFromRow, cardToJson, parseCardPayload, toCardSummary } from "@/server/cards";

export const runtime = "nodejs";

const OBJECT_ID = /^[a-f0-9]{24}$/;

/** The caller's own card, or 404 — never reveal whether someone else's id exists. */
async function ownCard(userId: string, id: string) {
  if (!OBJECT_ID.test(id)) throw new HttpError(404, "Card not found.");
  const row = await prisma.digitalCard.findFirst({ where: { id, userId } });
  if (!row) throw new HttpError(404, "Card not found.");
  return row;
}

/** A saved card's full details, to load it back into the editor. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireUser();
    const row = await ownCard(userId, (await params).id);
    return Response.json({ card: toCardSummary(row), data: cardFromRow(row) });
  } catch (error) {
    return errorResponse(error);
  }
}

/** Update a saved card in place; its link stays the same. Paid plans only. */
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireUser();
    if (!rateLimit(`cards:${userId}`, 20)) throw new HttpError(429, "Too many saves — wait a minute and try again.");
    await assertCanSaveCards(userId);
    const row = await ownCard(userId, (await params).id);

    const parsed = parseCardPayload(await readJson(req));
    if (!parsed.ok) throw new HttpError(400, parsed.error);

    const updated = await prisma.digitalCard.update({
      where: { id: row.id },
      data: { data: cardToJson(parsed.value.card), qrTarget: parsed.value.qrTarget },
    });
    return Response.json({ card: toCardSummary(updated) });
  } catch (error) {
    return errorResponse(error);
  }
}

/** Delete a card; its public link stops working immediately. Allowed on any plan. */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireUser();
    const row = await ownCard(userId, (await params).id);
    await prisma.digitalCard.delete({ where: { id: row.id } });
    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
