import crypto from "node:crypto";
import http from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Razorpay integration contract (spec 22 §7, runbook §3).
 *
 * The real `razorpay` SDK runs here — real HTTP, real auth header, real URL
 * building and response parsing — against a local stand-in for the API. Only
 * the SDK's hardcoded host is redirected.
 *
 * The invariant under test is the one a merchant account would not reveal until
 * a customer had already paid: **`notes` written at checkout are the only thing
 * that lets the webhook attribute a subscription to a user.** If the shapes
 * disagree, every payment succeeds, every webhook lands, and nobody is ever
 * upgraded. So the test follows the full loop — create a subscription, take the
 * notes off the captured request, feed them back through a signed webhook, and
 * assert the entitlement actually opened.
 */

interface Captured {
  method: string;
  path: string;
  auth: string | undefined;
  body: Record<string, unknown>;
}

let server: http.Server;
let baseUrl = "";
let captured: Captured[] = [];
let reply: { status: number; body: unknown } = { status: 200, body: {} };

// Point the SDK's hardcoded host at the stand-in, leaving every other line of
// the client untouched.
vi.mock("razorpay", async (importOriginal) => {
  const actual = (await importOriginal()) as { default: new (o: unknown) => unknown };
  const Real = actual.default;
  return {
    default: class extends (Real as new (o: unknown) => { api: { rq: { defaults: { baseURL: string } } } }) {
      constructor(options: unknown) {
        super(options);
        this.api.rq.defaults.baseURL = baseUrl;
      }
    },
  };
});

const WEBHOOK_SECRET = "whsec_billing_contract";

process.env.RAZORPAY_KEY_ID = "rzp_test_contract";
process.env.RAZORPAY_KEY_SECRET = "secret_contract";
process.env.RAZORPAY_WEBHOOK_SECRET = WEBHOOK_SECRET;
process.env.RAZORPAY_PLAN_LAUNCH_MONTHLY = "plan_launch_m";
process.env.RAZORPAY_PLAN_LAUNCH_YEARLY = "plan_launch_y";
process.env.RAZORPAY_PLAN_GROWTH_MONTHLY = "plan_growth_m";

// --- in-memory subscription store, so the webhook has somewhere to land ------
const subscriptions = new Map<string, Record<string, unknown>>();
vi.mock("@/server/db", () => ({
  prisma: {
    subscription: {
      findUnique: async ({ where }: { where: { userId: string } }) =>
        subscriptions.get(where.userId) ?? null,
      upsert: async ({
        where,
        create,
        update,
      }: {
        where: { userId: string };
        create: Record<string, unknown>;
        update: Record<string, unknown>;
      }) => {
        const existing = subscriptions.get(where.userId);
        const row = existing ? { ...existing, ...update } : { ...create };
        subscriptions.set(where.userId, row);
        return row;
      },
    },
  },
}));

const { createSubscription, cancelSubscription, priceFor, razorpayPlanId, razorpayEnabled } =
  await import("@/server/billing/razorpay");
const { POST: webhookRoute } = await import("@/app/api/studio/webhooks/razorpay/route");
const { resolvePlan } = await import("@/server/studio/entitlements");
const { PLANS } = await import("@/server/studio/plans");

beforeAll(async () => {
  server = http.createServer((req, res) => {
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", () => {
      captured.push({
        method: req.method ?? "",
        path: req.url ?? "",
        auth: req.headers.authorization,
        body: raw ? JSON.parse(raw) : {},
      });
      res.writeHead(reply.status, { "content-type": "application/json" });
      res.end(JSON.stringify(reply.body));
    });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

beforeEach(() => {
  captured = [];
  subscriptions.clear();
});

function subscriptionResponse(over: Record<string, unknown> = {}) {
  return {
    id: "sub_contract_001",
    entity: "subscription",
    plan_id: "plan_launch_m",
    status: "created",
    current_start: null,
    current_end: null,
    customer_id: "cust_contract_001",
    total_count: 120,
    paid_count: 0,
    short_url: "https://rzp.io/i/testlink",
    notes: {},
    ...over,
  };
}

function signedWebhook(payload: unknown) {
  const raw = JSON.stringify(payload);
  return new Request("http://localhost/api/studio/webhooks/razorpay", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-razorpay-signature": crypto.createHmac("sha256", WEBHOOK_SECRET).update(raw).digest("hex"),
    },
    body: raw,
  });
}

describe("configuration", () => {
  it("reports itself enabled once keys are present", () => {
    expect(razorpayEnabled).toBe(true);
  });

  it("resolves one plan id per plan and cycle from env", () => {
    expect(razorpayPlanId("launch", "monthly")).toBe("plan_launch_m");
    expect(razorpayPlanId("launch", "yearly")).toBe("plan_launch_y");
    expect(razorpayPlanId("agency", "monthly")).toBeUndefined();
  });

  it("refuses a plan whose Razorpay id has not been created", async () => {
    await expect(
      createSubscription({ plan: "agency", cycle: "monthly", email: "a@b.test", userId: "u1" }),
    ).rejects.toThrow(/RAZORPAY_PLAN_NOT_CONFIGURED/);
    expect(captured).toHaveLength(0); // no call was made
  });

  it("refuses to sell the free plan", async () => {
    await expect(
      createSubscription({ plan: "free", cycle: "monthly", email: "a@b.test", userId: "u1" }),
    ).rejects.toThrow(/PLAN_NOT_PURCHASABLE/);
  });
});

describe("the create request", () => {
  it("sends the plan id, cycle-appropriate count, and authenticates", async () => {
    reply = { status: 200, body: subscriptionResponse() };

    const created = await createSubscription({
      plan: "launch",
      cycle: "monthly",
      email: "founder@northwind.in",
      userId: "user-abc",
    });

    expect(captured).toHaveLength(1);
    const call = captured[0];
    expect(call.method).toBe("POST");
    expect(call.path).toBe("/v1/subscriptions");

    const [scheme, encoded] = String(call.auth).split(" ");
    expect(scheme).toBe("Basic");
    expect(Buffer.from(encoded, "base64").toString()).toBe("rzp_test_contract:secret_contract");

    expect(call.body.plan_id).toBe("plan_launch_m");
    expect(call.body.total_count).toBe(120);
    expect(call.body.customer_notify).toBe(1);

    expect(created.subscriptionId).toBe("sub_contract_001");
    expect(created.keyId).toBe("rzp_test_contract");
    expect(created.amountPaise).toBe(PLANS.launch.monthlyPaise);
  });

  it("bills a yearly subscription five times, not a hundred and twenty", async () => {
    reply = { status: 200, body: subscriptionResponse({ plan_id: "plan_launch_y" }) };
    const created = await createSubscription({
      plan: "launch",
      cycle: "yearly",
      email: "founder@northwind.in",
      userId: "user-abc",
    });

    expect(captured[0].body.plan_id).toBe("plan_launch_y");
    expect(captured[0].body.total_count).toBe(5);
    // Checkout must quote the yearly price, not twelve monthlies.
    expect(created.amountPaise).toBe(PLANS.launch.yearlyPaise);
    expect(created.amountPaise).toBe(priceFor(PLANS.launch, "yearly"));
  });

  it("surfaces an API rejection instead of pretending it worked", async () => {
    reply = {
      status: 400,
      body: { error: { code: "BAD_REQUEST_ERROR", description: "plan_id is invalid" } },
    };
    await expect(
      createSubscription({ plan: "launch", cycle: "monthly", email: "a@b.test", userId: "u1" }),
    ).rejects.toBeTruthy();
  });

  it("passes the cancellation intent through to the API", async () => {
    reply = { status: 200, body: subscriptionResponse({ status: "cancelled" }) };
    await cancelSubscription("sub_contract_001", true);

    expect(captured).toHaveLength(1);
    expect(captured[0].path).toBe("/v1/subscriptions/sub_contract_001/cancel");
    expect(captured[0].body.cancel_at_cycle_end).toBe(1);
  });
});

describe("checkout → webhook → entitlement", () => {
  it("carries enough in notes for the webhook to attribute the payment", async () => {
    reply = { status: 200, body: subscriptionResponse() };

    await createSubscription({
      plan: "growth",
      cycle: "monthly",
      email: "founder@northwind.in",
      userId: "user-abc",
    });

    // Exactly the notes Razorpay will echo back on every webhook for this
    // subscription. Nothing else identifies the payer.
    const notes = captured[0].body.notes as Record<string, string>;
    expect(notes).toMatchObject({ userId: "user-abc", plan: "growth", cycle: "monthly" });

    expect((await resolvePlan("user-abc")).id).toBe("free");

    const res = await webhookRoute(
      signedWebhook({
        event: "subscription.activated",
        payload: {
          subscription: {
            entity: {
              id: "sub_contract_001",
              status: "active",
              current_end: Math.floor(Date.now() / 1000) + 30 * 24 * 3600,
              customer_id: "cust_contract_001",
              notes, // echoed verbatim, as Razorpay does
            },
          },
        },
      }),
    );

    expect(res.status).toBe(200);
    expect((await resolvePlan("user-abc")).id).toBe("growth");
  });

  it("leaves the user on free when notes are stripped in transit", async () => {
    reply = { status: 200, body: subscriptionResponse() };
    await createSubscription({
      plan: "growth",
      cycle: "monthly",
      email: "founder@northwind.in",
      userId: "user-abc",
    });

    const res = await webhookRoute(
      signedWebhook({
        event: "subscription.activated",
        payload: {
          subscription: { entity: { id: "sub_contract_001", status: "active", notes: {} } },
        },
      }),
    );

    expect(await res.json()).toMatchObject({ ignored: "unattributable" });
    expect((await resolvePlan("user-abc")).id).toBe("free");
  });
});
