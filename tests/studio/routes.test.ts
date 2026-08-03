import crypto from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Route-level integration tests (spec 22 §11).
 *
 * These drive the real route handlers — the same functions Next invokes — over
 * an in-memory Prisma double. What they prove is the part unit tests can't:
 * that gating actually happens on the request path, in the right order, and
 * that a rejected request leaves no state behind.
 *
 * Mongo itself is not under test here. `prisma db push` and a live round-trip
 * remain a pre-launch step (see BUILD_LOG "Launch checklist").
 */

// --- in-memory Prisma double -----------------------------------------------

interface SubscriptionRow {
  userId: string;
  plan: string;
  cycle: string;
  status: string;
  razorpaySubscriptionId?: string | null;
  razorpayCustomerId?: string | null;
  currentPeriodEnd?: Date | null;
  cancelAtPeriodEnd?: boolean;
}

interface CounterRow {
  userId: string;
  period: string;
  metric: string;
  count: number;
}

interface BrandRow {
  id: string;
  userId: string;
  name: string;
  legalName: string | null;
  entityType: string;
  cin: string | null;
  llpin: string | null;
  gstin: string | null;
  pan: string | null;
  registeredAddress: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  phone: string | null;
  email: string | null;
  kit: null;
}

const db = {
  subscriptions: new Map<string, SubscriptionRow>(),
  counters: new Map<string, CounterRow>(),
  brands: [] as BrandRow[],
  employees: [] as { id: string; brandId: string; name: string; empCode: string | null }[],
  assets: [] as { brandId: string; type: string; variant: string }[],
};

const counterKey = (w: { userId: string; period: string; metric: string }) =>
  `${w.userId}|${w.period}|${w.metric}`;

/** Apply Prisma's `{ increment }` / `{ decrement }` update operators. */
function applyUpdate(row: CounterRow, data: Record<string, unknown>) {
  const count = data.count as { increment?: number; decrement?: number } | number;
  if (typeof count === "number") row.count = count;
  else if (count?.increment !== undefined) row.count += count.increment;
  else if (count?.decrement !== undefined) row.count -= count.decrement;
  return row;
}

const prismaDouble = {
  subscription: {
    findUnique: async ({ where }: { where: { userId: string } }) =>
      db.subscriptions.get(where.userId) ?? null,
    upsert: async ({
      where,
      create,
      update,
    }: {
      where: { userId: string };
      create: SubscriptionRow;
      update: Partial<SubscriptionRow>;
    }) => {
      const existing = db.subscriptions.get(where.userId);
      const row = existing ? { ...existing, ...update } : { ...create };
      db.subscriptions.set(where.userId, row);
      return row;
    },
  },
  usageCounter: {
    findUnique: async ({
      where,
    }: {
      where: { userId_period_metric: CounterRow };
    }) => db.counters.get(counterKey(where.userId_period_metric)) ?? null,
    upsert: async ({
      where,
      create,
      update,
    }: {
      where: { userId_period_metric: Omit<CounterRow, "count"> };
      create: CounterRow;
      update: Record<string, unknown>;
    }) => {
      const key = counterKey(where.userId_period_metric);
      const existing = db.counters.get(key);
      if (!existing) {
        const row = { ...create };
        db.counters.set(key, row);
        return row;
      }
      return applyUpdate(existing, update);
    },
    update: async ({
      where,
      data,
    }: {
      where: { userId_period_metric: Omit<CounterRow, "count"> };
      data: Record<string, unknown>;
    }) => {
      const row = db.counters.get(counterKey(where.userId_period_metric));
      if (!row) throw new Error("not found");
      return applyUpdate(row, data);
    },
  },
  brand: {
    findFirst: async ({ where }: { where: { id: string; userId: string } }) =>
      db.brands.find((b) => b.id === where.id && b.userId === where.userId) ?? null,
    count: async ({ where }: { where: { userId: string } }) =>
      db.brands.filter((b) => b.userId === where.userId).length,
  },
  employee: {
    findMany: async ({ where }: { where: { brandId: string } }) =>
      db.employees.filter((e) => e.brandId === where.brandId),
  },
  asset: {
    create: async ({ data }: { data: { brandId: string; type: string; variant: string } }) => {
      db.assets.push(data);
      return data;
    },
  },
};

let signedInUser: string | null = "user-1";

vi.mock("@/server/db", () => ({ prisma: prismaDouble }));
vi.mock("@/server/auth", () => ({
  currentUserId: async () => signedInUser,
  auth: async () => (signedInUser ? { user: { id: signedInUser } } : null),
}));

const WEBHOOK_SECRET = "whsec_test_launch";
process.env.RAZORPAY_WEBHOOK_SECRET = WEBHOOK_SECRET;

// Imported after the mocks so the handlers pick up the double.
const { POST: exportRoute } = await import("@/app/api/studio/export/route");
const { POST: webhookRoute } = await import("@/app/api/studio/webhooks/razorpay/route");
const { resolvePlan, currentPeriod } = await import("@/studio/entitlements");

// --- fixtures ---------------------------------------------------------------

function seedBrand(overrides: Partial<BrandRow> = {}): BrandRow {
  const brand: BrandRow = {
    id: "brand-1",
    userId: "user-1",
    name: "Northwind Labs",
    legalName: "Northwind Labs Private Limited",
    entityType: "pvt-ltd",
    cin: "U72900KA2021PTC145678",
    llpin: null,
    gstin: "29AAGCB7383J1Z4",
    pan: "AAGCB7383J",
    registeredAddress: "4th Floor, Prestige Tower, MG Road",
    city: "Bengaluru",
    state: "Karnataka",
    pincode: "560001",
    phone: "+91 80 4567 8900",
    email: "hello@northwind.in",
    kit: null,
    ...overrides,
  };
  db.brands.push(brand);
  return brand;
}

function subscribe(plan: string, opts: Partial<SubscriptionRow> = {}) {
  db.subscriptions.set("user-1", {
    userId: "user-1",
    plan,
    cycle: "monthly",
    status: "active",
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 3600 * 1000),
    ...opts,
  });
}

function exportRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/studio/export", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function webhookRequest(payload: unknown, opts: { secret?: string; signature?: string } = {}) {
  const raw = JSON.stringify(payload);
  const signature =
    opts.signature ??
    crypto
      .createHmac("sha256", opts.secret ?? WEBHOOK_SECRET)
      .update(raw)
      .digest("hex");
  return new Request("http://localhost/api/studio/webhooks/razorpay", {
    method: "POST",
    headers: { "content-type": "application/json", "x-razorpay-signature": signature },
    body: raw,
  });
}

function subscriptionEvent(event: string, entity: Record<string, unknown>) {
  return { event, payload: { subscription: { entity } } };
}

const exportsUsed = () =>
  db.counters.get(counterKey({ userId: "user-1", period: currentPeriod(), metric: "exports" }))
    ?.count ?? 0;

beforeEach(() => {
  db.subscriptions.clear();
  db.counters.clear();
  db.brands = [];
  db.employees = [];
  db.assets = [];
  signedInUser = "user-1";
});

// --- export gating ----------------------------------------------------------

describe("POST /api/studio/export — authentication", () => {
  it("rejects a signed-out request with 401", async () => {
    signedInUser = null;
    const res = await exportRoute(exportRequest({ brandId: "brand-1", asset: "letterhead" }));
    expect(res.status).toBe(401);
  });
});

describe("POST /api/studio/export — plan gating", () => {
  it("refuses a print PDF on the free plan and names the plan that unlocks it", async () => {
    seedBrand();
    const res = await exportRoute(exportRequest({ brandId: "brand-1", asset: "letterhead" }));
    const body = await res.json();

    expect(res.status).toBe(402);
    expect(body.reason).toBe("capability");
    expect(body.requiredPlan).toBe("launch");
    // Nothing was rendered, metered, or recorded.
    expect(exportsUsed()).toBe(0);
    expect(db.assets).toHaveLength(0);
  });

  it("returns a real PDF on Launch and meters exactly one export", async () => {
    seedBrand();
    subscribe("launch");

    const res = await exportRoute(exportRequest({ brandId: "brand-1", asset: "letterhead" }));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/pdf");
    expect(res.headers.get("content-disposition")).toContain("letterhead.pdf");

    const bytes = new Uint8Array(await res.arrayBuffer());
    expect(Buffer.from(bytes.subarray(0, 5)).toString()).toBe("%PDF-");
    expect(bytes.byteLength).toBeGreaterThan(1000);

    expect(exportsUsed()).toBe(1);
    expect(db.assets).toEqual([
      expect.objectContaining({ brandId: "brand-1", type: "letterhead" }),
    ]);
  });

  it("treats a lapsed subscription as free", async () => {
    seedBrand();
    subscribe("growth", { currentPeriodEnd: new Date(Date.now() - 1000) });

    expect((await resolvePlan("user-1")).id).toBe("free");
    const res = await exportRoute(exportRequest({ brandId: "brand-1", asset: "letterhead" }));
    expect(res.status).toBe(402);
  });

  it("treats a halted subscription as free even inside its paid period", async () => {
    seedBrand();
    subscribe("growth", { status: "halted" });

    expect((await resolvePlan("user-1")).id).toBe("free");
    expect(
      (await exportRoute(exportRequest({ brandId: "brand-1", asset: "letterhead" }))).status,
    ).toBe(402);
  });

  it("does not leak another user's brand", async () => {
    seedBrand({ userId: "someone-else" });
    subscribe("launch");
    const res = await exportRoute(exportRequest({ brandId: "brand-1", asset: "letterhead" }));
    expect(res.status).toBe(404);
  });
});

describe("POST /api/studio/export — quota", () => {
  it("stops at the plan's monthly allowance and rolls the counter back", async () => {
    seedBrand();
    subscribe("launch"); // 50 exports/month
    db.counters.set(counterKey({ userId: "user-1", period: currentPeriod(), metric: "exports" }), {
      userId: "user-1",
      period: currentPeriod(),
      metric: "exports",
      count: 50,
    });

    const res = await exportRoute(exportRequest({ brandId: "brand-1", asset: "letterhead" }));
    const body = await res.json();

    expect(res.status).toBe(402);
    expect(body.reason).toBe("quota");
    // The rejected attempt must not consume the 51st unit.
    expect(exportsUsed()).toBe(50);
  });

  it("does not meter unlimited plans into a wall", async () => {
    seedBrand();
    subscribe("growth"); // exportsPerMonth: null
    db.counters.set(counterKey({ userId: "user-1", period: currentPeriod(), metric: "exports" }), {
      userId: "user-1",
      period: currentPeriod(),
      metric: "exports",
      count: 9_999,
    });

    const res = await exportRoute(exportRequest({ brandId: "brand-1", asset: "letterhead" }));
    expect(res.status).toBe(200);
  });
});

describe("POST /api/studio/export — ID cards", () => {
  beforeEach(() => {
    seedBrand();
    db.employees.push(
      { id: "emp-1", brandId: "brand-1", name: "Ananya Rao", empCode: "NWL-004" },
      { id: "emp-2", brandId: "brand-1", name: "Rahul Menon", empCode: "NWL-011" },
    );
  });

  it("is not available on Launch and points at Growth", async () => {
    subscribe("launch");
    const res = await exportRoute(exportRequest({ brandId: "brand-1", asset: "id-cards" }));
    const body = await res.json();
    expect(res.status).toBe(402);
    expect(body.requiredPlan).toBe("growth");
  });

  it("renders a batch on Growth", async () => {
    subscribe("growth");
    const res = await exportRoute(exportRequest({ brandId: "brand-1", asset: "id-cards" }));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-disposition")).toContain("id-cards-2.pdf");
  });

  it("rejects a batch with no employees before charging quota", async () => {
    subscribe("growth");
    db.employees = [];
    const res = await exportRoute(exportRequest({ brandId: "brand-1", asset: "id-cards" }));
    expect(res.status).toBe(400);
    expect(exportsUsed()).toBe(0);
  });
});

describe("POST /api/studio/export — validation", () => {
  it("rejects an unknown asset type", async () => {
    seedBrand();
    subscribe("growth");
    const res = await exportRoute(exportRequest({ brandId: "brand-1", asset: "poster" }));
    expect(res.status).toBe(400);
  });

  it("requires holder details for a visiting card", async () => {
    seedBrand();
    subscribe("launch");
    const res = await exportRoute(exportRequest({ brandId: "brand-1", asset: "business-card" }));
    expect(res.status).toBe(400);
  });
});

// --- billing webhook --------------------------------------------------------

describe("POST /api/studio/webhooks/razorpay", () => {
  const activation = subscriptionEvent("subscription.activated", {
    id: "sub_test_001",
    status: "active",
    current_end: Math.floor(Date.now() / 1000) + 30 * 24 * 3600,
    customer_id: "cust_test_001",
    notes: { userId: "user-1", plan: "growth", cycle: "monthly" },
  });

  it("activates the subscription and unlocks entitlements", async () => {
    const res = await webhookRoute(webhookRequest(activation));
    expect(res.status).toBe(200);

    const row = db.subscriptions.get("user-1");
    expect(row).toMatchObject({
      plan: "growth",
      cycle: "monthly",
      status: "active",
      razorpaySubscriptionId: "sub_test_001",
    });
    expect((await resolvePlan("user-1")).id).toBe("growth");

    // The gate that was closed before the webhook is open after it.
    seedBrand();
    const exported = await exportRoute(
      exportRequest({ brandId: "brand-1", asset: "letterhead" }),
    );
    expect(exported.status).toBe(200);
  });

  it("rejects a tampered body and writes nothing", async () => {
    const raw = JSON.stringify(activation);
    const signature = crypto
      .createHmac("sha256", WEBHOOK_SECRET)
      .update(raw)
      .digest("hex");
    const tampered = JSON.stringify({
      ...activation,
      payload: {
        subscription: {
          entity: {
            ...activation.payload.subscription.entity,
            notes: { userId: "user-1", plan: "agency", cycle: "monthly" },
          },
        },
      },
    });

    const res = await webhookRoute(
      new Request("http://localhost/api/studio/webhooks/razorpay", {
        method: "POST",
        headers: { "content-type": "application/json", "x-razorpay-signature": signature },
        body: tampered,
      }),
    );

    expect(res.status).toBe(400);
    expect(db.subscriptions.size).toBe(0);
  });

  it("rejects a signature made with the wrong secret", async () => {
    const res = await webhookRoute(webhookRequest(activation, { secret: "whsec_wrong" }));
    expect(res.status).toBe(400);
    expect(db.subscriptions.size).toBe(0);
  });

  it("rejects a missing signature", async () => {
    const res = await webhookRoute(
      new Request("http://localhost/api/studio/webhooks/razorpay", {
        method: "POST",
        body: JSON.stringify(activation),
      }),
    );
    expect(res.status).toBe(400);
    expect(db.subscriptions.size).toBe(0);
  });

  it("drops entitlements immediately on cancellation but keeps the record", async () => {
    await webhookRoute(webhookRequest(activation));
    const cancelled = subscriptionEvent("subscription.cancelled", {
      ...activation.payload.subscription.entity,
      status: "cancelled",
    });

    const res = await webhookRoute(webhookRequest(cancelled));
    expect(res.status).toBe(200);

    const row = db.subscriptions.get("user-1");
    expect(row?.status).toBe("cancelled");
    expect(row?.plan).toBe("growth"); // history retained
    expect(row?.cancelAtPeriodEnd).toBe(true);
    expect((await resolvePlan("user-1")).id).toBe("free"); // access gone now
  });

  it("halts entitlements when a renewal payment fails", async () => {
    await webhookRoute(webhookRequest(activation));
    const halted = subscriptionEvent("subscription.halted", {
      ...activation.payload.subscription.entity,
      status: "halted",
    });

    expect((await webhookRoute(webhookRequest(halted))).status).toBe(200);
    expect(db.subscriptions.get("user-1")?.status).toBe("halted");
    expect((await resolvePlan("user-1")).id).toBe("free");
  });

  it("extends the period on a renewal charge", async () => {
    await webhookRoute(webhookRequest(activation));
    const nextEnd = Math.floor(Date.now() / 1000) + 60 * 24 * 3600;
    const charged = subscriptionEvent("subscription.charged", {
      ...activation.payload.subscription.entity,
      current_end: nextEnd,
    });

    await webhookRoute(webhookRequest(charged));
    expect(db.subscriptions.get("user-1")?.currentPeriodEnd?.getTime()).toBe(nextEnd * 1000);
  });

  it("acknowledges but ignores events it does not handle", async () => {
    const res = await webhookRoute(
      webhookRequest(subscriptionEvent("payment.captured", { id: "pay_1", status: "captured" })),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ignored: "payment.captured" });
    expect(db.subscriptions.size).toBe(0);
  });

  it("ignores a subscription it cannot attribute to a user", async () => {
    const res = await webhookRoute(
      webhookRequest(
        subscriptionEvent("subscription.activated", {
          id: "sub_other",
          status: "active",
          notes: { source: "somewhere-else" },
        }),
      ),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ignored: "unattributable" });
    expect(db.subscriptions.size).toBe(0);
  });

  it("refuses to grant the free plan through a webhook", async () => {
    const res = await webhookRoute(
      webhookRequest(
        subscriptionEvent("subscription.activated", {
          id: "sub_free",
          status: "active",
          notes: { userId: "user-1", plan: "free", cycle: "monthly" },
        }),
      ),
    );
    expect(res.status).toBe(200);
    expect(db.subscriptions.size).toBe(0);
  });
});
