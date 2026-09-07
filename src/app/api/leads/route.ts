import { z } from "zod";
import { isDatabaseConfigured, prisma } from "@/server/db";
import { clientIp, rateLimit } from "@/server/rate-limit";

export const runtime = "nodejs";

const leadSchema = z.object({
  event: z.enum(["email_gate", "newsletter", "cta_click"]),
  toolSlug: z.string().min(1).max(100),
  category: z.string().min(1).max(100),
  email: z.email().max(254).optional(),
  name: z.string().max(200).optional(),
  utmSource: z.string().max(200).optional(),
  utmMedium: z.string().max(200).optional(),
  utmCampaign: z.string().max(200).optional(),
  /** Honeypot — humans never fill this. */
  website: z.string().optional(),
});

export async function POST(req: Request) {
  if (!rateLimit(`leads:${clientIp(req)}`, 20)) {
    return Response.json({ error: "Too many requests." }, { status: 429 });
  }

  const parsed = leadSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }
  const { website, ...lead } = parsed.data;

  // Bots fill the honeypot; pretend success so they don't adapt.
  if (website) {
    return Response.json({ ok: true });
  }
  // Email is required for capture events; CTA clicks are anonymous.
  if (lead.event !== "cta_click" && !lead.email) {
    return Response.json({ error: "Email is required." }, { status: 400 });
  }

  if (!isDatabaseConfigured()) {
    console.error("[leads] database is not configured (DATABASE_URL placeholder or missing)");
    return Response.json(
      { error: "Unable to process lead request." },
      { status: 500 },
    );
  }

  try {
    await prisma.lead.create({ data: lead });
  } catch (err) {
    console.error("[leads] database error:", err);
    return Response.json(
      { error: "Unable to process lead request." },
      { status: 500 },
    );
  }
  return Response.json({ ok: true });
}
