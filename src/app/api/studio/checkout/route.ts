import { z } from "zod";
import { prisma } from "@/server/db";
import { errorResponse, HttpError, readJson, requireUser } from "@/server/studio/route-helpers";
import { createSubscription, razorpayEnabled } from "@/server/billing/razorpay";
import { isPlanId } from "@/server/studio/plans";

export const runtime = "nodejs";

const schema = z.object({
  plan: z.string().refine(isPlanId, "Unknown plan"),
  cycle: z.enum(["monthly", "yearly"]),
});

export async function POST(req: Request) {
  try {
    const userId = await requireUser();

    if (!razorpayEnabled) {
      return Response.json(
        {
          error:
            "Payments aren't switched on yet. Add your Razorpay keys to enable checkout.",
        },
        { status: 503 },
      );
    }

    const parsed = schema.safeParse(await readJson(req));
    if (!parsed.success) throw new HttpError(400, "Invalid plan selection.");
    if (parsed.data.plan === "free") throw new HttpError(400, "The free plan needs no checkout.");

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.email) throw new HttpError(400, "Your account has no email address.");

    const subscription = await createSubscription({
      plan: parsed.data.plan,
      cycle: parsed.data.cycle,
      email: user.email,
      name: user.name,
      userId,
    });

    // The row is created as `pending`; the webhook flips it to active once
    // Razorpay confirms. Entitlements never trust this write on its own.
    await prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        plan: parsed.data.plan,
        cycle: parsed.data.cycle,
        status: "pending",
        razorpaySubscriptionId: subscription.subscriptionId,
      },
      update: {
        plan: parsed.data.plan,
        cycle: parsed.data.cycle,
        status: "pending",
        razorpaySubscriptionId: subscription.subscriptionId,
      },
    });

    return Response.json(subscription);
  } catch (error) {
    return errorResponse(error);
  }
}
