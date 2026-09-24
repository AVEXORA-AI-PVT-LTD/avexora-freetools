import { isDatabaseConfigured, prisma } from "@/server/db";
import { hasPaidPlan, isCardSlug, renderSavedCard } from "@/server/cards";

export const runtime = "nodejs";

function notFound(message: string, status = 404): Response {
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Card not available</title></head><body style="font-family:system-ui,sans-serif;display:grid;place-items:center;min-height:100vh;margin:0;color:#334155;text-align:center;padding:16px"><div><h1 style="font-size:20px">${message}</h1><p><a href="/business-legal/digital-business-card-generator" style="color:#c2410c">Create your own digital business card</a></p></div></body></html>`;
  return new Response(html, { status, headers: { "Content-Type": "text/html; charset=utf-8", "X-Robots-Tag": "noindex" } });
}

/**
 * A saved Digital Business Card, served as its own complete page.
 *
 * Only cards whose owner is on a paid plan are served; a lapsed plan pauses the
 * link rather than deleting the card, so renewing brings it straight back.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isDatabaseConfigured() || !isCardSlug(slug)) return notFound("This card doesn't exist.");

  const row = await prisma.digitalCard.findUnique({ where: { slug } });
  if (!row) return notFound("This card doesn't exist.");
  if (!(await hasPaidPlan(row.userId))) return notFound("This card is currently unavailable.", 410);

  const rendered = await renderSavedCard(row);
  if (!rendered) return notFound("This card couldn't be displayed.", 500);

  // Best-effort view counter; a failed increment never blocks the page.
  void prisma.digitalCard.update({ where: { id: row.id }, data: { views: { increment: 1 } } }).catch(() => {});

  return new Response(rendered.html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Security-Policy": rendered.csp,
      "X-Robots-Tag": "noindex",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=300",
    },
  });
}
