import { prisma } from "@/server/db";

export interface WebhookEventPayload {
  eventType: string;
  title: string;
  message: string;
  severity: string;
  targetType?: string;
  targetId?: string;
  actionUrl?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

/**
 * Dispatches notification event payload to all matching active webhook endpoints.
 */
export async function dispatchWebhooks(payload: WebhookEventPayload): Promise<void> {
  try {
    // Find active webhooks subscribed to this eventType or wildcard '*'
    const webhooks = await prisma.webhookConfig.findMany({
      where: {
        status: "ACTIVE",
        OR: [{ events: { has: payload.eventType } }, { events: { has: "*" } }],
      },
    });

    if (webhooks.length === 0) return;

    // Dispatch concurrently with timeout & delivery logging
    await Promise.all(
      webhooks.map(async (wh) => {
        let status = "FAILED";
        let responseCode: number | undefined;
        let errorMessage: string | undefined;

        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

          const res = await fetch(wh.url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "User-Agent": "AvexTools-Webhook/1.0",
              "X-Avex-Event": payload.eventType,
            },
            body: JSON.stringify(payload),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);
          responseCode = res.status;
          if (res.ok) {
            status = "SENT";
          } else {
            errorMessage = `Webhook returned HTTP ${res.status}`;
          }
        } catch (err: any) {
          errorMessage = err.message || "Network request failed";
        }

        // Log delivery status
        await prisma.webhookDeliveryLog.create({
          data: {
            webhookId: wh.id,
            eventType: payload.eventType,
            payload: JSON.parse(JSON.stringify(payload)),
            status,
            responseCode,
            errorMessage,
            attempts: 1,
          },
        });
      })
    );
  } catch (err) {
    console.error("[Webhook Dispatch Error]:", err);
  }
}
