import { isDatabaseConfigured, prisma } from "@/server/db";
import { cardFromRow, decodePhoto, hasPaidPlan, isCardSlug } from "@/server/cards";

export const runtime = "nodejs";

/** A saved card's photo as an image, for link previews (og:image) in WhatsApp and elsewhere. */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isDatabaseConfigured() || !isCardSlug(slug)) return new Response(null, { status: 404 });
  const row = await prisma.digitalCard.findUnique({ where: { slug } });
  if (!row || !(await hasPaidPlan(row.userId))) return new Response(null, { status: 404 });
  const photo = decodePhoto(cardFromRow(row)?.photo);
  if (!photo) return new Response(null, { status: 404 });
  return new Response(new Uint8Array(photo.bytes), {
    headers: {
      "Content-Type": photo.type,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "public, max-age=300, s-maxage=3600",
    },
  });
}
