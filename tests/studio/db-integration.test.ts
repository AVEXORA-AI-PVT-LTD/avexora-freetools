import crypto from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Live-database integration tests (spec 22 §11, runbook §1).
 *
 * Everything else in `tests/studio/` runs against pure functions or an
 * in-memory double, which proves our logic but not the driver. These drive the
 * real route handlers through a real `PrismaClient` against a real
 * MongoDB-wire-protocol server: collections, indexes, the atomic quota upsert,
 * and cross-user isolation as the database actually enforces it.
 *
 * Opt-in, and deliberately gated on its **own** env var rather than
 * `DATABASE_URL`, so pointing a shell at production cannot cause this suite to
 * write to it:
 *
 *   npx prisma db push                       # once, against the test database
 *   STUDIO_TEST_DATABASE_URL="mongodb://127.0.0.1:27017/studio_test" \
 *     npx vitest run tests/studio/db-integration.test.ts
 */

const TEST_URL = process.env.STUDIO_TEST_DATABASE_URL ?? "";

// The `@/server/db` singleton reads DATABASE_URL at construction, so it has to
// be pointed at the test database before the handlers are imported below.
if (TEST_URL) process.env.DATABASE_URL = TEST_URL;

let signedInUser: string | null = null;
vi.mock("@/server/auth", () => ({
  currentUserId: async () => signedInUser,
  auth: async () => (signedInUser ? { user: { id: signedInUser } } : null),
}));

const WEBHOOK_SECRET = "whsec_integration";
process.env.RAZORPAY_WEBHOOK_SECRET = WEBHOOK_SECRET;

describe.runIf(TEST_URL)("live database", async () => {
  const { prisma } = await import("@/server/db");
  const { POST: exportRoute } = await import("@/app/api/studio/export/route");
  const { POST: webhookRoute } = await import(
    "@/app/api/studio/webhooks/razorpay/route"
  );
  const {
    resolvePlan,
    consumeQuota,
    assertBrandLimit,
    usageCount,
    currentPeriod,
    EntitlementError,
  } = await import("@/studio/entitlements");

  let userId = "";
  let otherUserId = "";
  let brandId = "";

  const suffix = crypto.randomBytes(4).toString("hex");
  const emailFor = (who: string) => `${who}+${suffix}@integration.test`;

  async function wipe() {
    const ids = [userId, otherUserId].filter(Boolean);
    if (!ids.length) return;
    const brands = await prisma.brand.findMany({ where: { userId: { in: ids } } });
    const brandIds = brands.map((b) => b.id);
    await prisma.employee.deleteMany({ where: { brandId: { in: brandIds } } });
    await prisma.asset.deleteMany({ where: { brandId: { in: brandIds } } });
    await prisma.brandKit.deleteMany({ where: { brandId: { in: brandIds } } });
    await prisma.brand.deleteMany({ where: { userId: { in: ids } } });
    await prisma.usageCounter.deleteMany({ where: { userId: { in: ids } } });
    await prisma.subscription.deleteMany({ where: { userId: { in: ids } } });
  }

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: { email: emailFor("owner"), name: "Integration Owner" },
    });
    const other = await prisma.user.create({
      data: { email: emailFor("other"), name: "Someone Else" },
    });
    userId = user.id;
    otherUserId = other.id;
  });

  afterAll(async () => {
    await wipe();
    await prisma.user.deleteMany({ where: { id: { in: [userId, otherUserId] } } });
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await wipe();
    signedInUser = userId;

    const brand = await prisma.brand.create({
      data: {
        userId,
        name: "Northwind Labs",
        industry: "technology",
        legalName: "Northwind Labs Private Limited",
        entityType: "pvt-ltd",
        cin: "U72900KA2021PTC145678",
        gstin: "29AAGCB7383J1Z4",
        pan: "AAGCB7383J",
        registeredAddress: "4th Floor, Prestige Tower, MG Road",
        city: "Bengaluru",
        state: "Karnataka",
        pincode: "560001",
        phone: "+91 80 4567 8900",
        email: "hello@northwind.in",
      },
    });
    brandId = brand.id;
  });

  const exportRequest = (body: Record<string, unknown>) =>
    new Request("http://localhost/api/studio/export", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });

  function webhookRequest(payload: unknown) {
    const raw = JSON.stringify(payload);
    return new Request("http://localhost/api/studio/webhooks/razorpay", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-razorpay-signature": crypto
          .createHmac("sha256", WEBHOOK_SECRET)
          .update(raw)
          .digest("hex"),
      },
      body: raw,
    });
  }

  const activation = (plan: string, status = "active") => ({
    event: status === "active" ? "subscription.activated" : `subscription.${status}`,
    payload: {
      subscription: {
        entity: {
          id: `sub_integration_${suffix}`,
          status,
          current_end: Math.floor(Date.now() / 1000) + 30 * 24 * 3600,
          customer_id: `cust_${suffix}`,
          notes: { userId, plan, cycle: "monthly" },
        },
      },
    },
  });

  // --- persistence ---------------------------------------------------------

  it("round-trips a brand with its kit and employees", async () => {
    await prisma.brandKit.create({
      data: {
        brandId,
        paletteId: "indigo-slate",
        fontPairId: "inter-inter",
        markStyle: "monogram",
        markSeed: 4242,
        logoLayout: "horizontal",
        tagline: "Ship it right",
        tokens: { note: "resolved at render time" },
      },
    });
    await prisma.employee.createMany({
      data: [
        { brandId, name: "Ananya Rao", designation: "Head of Operations", empCode: "NWL-004" },
        { brandId, name: "Rahul Menon", designation: "Backend Engineer", empCode: "NWL-011" },
      ],
    });

    const loaded = await prisma.brand.findFirst({
      where: { id: brandId, userId },
      include: { kit: true, employees: { orderBy: { createdAt: "asc" } } },
    });

    expect(loaded?.cin).toBe("U72900KA2021PTC145678");
    expect(loaded?.kit?.markSeed).toBe(4242);
    expect(loaded?.employees.map((e) => e.empCode)).toEqual(["NWL-004", "NWL-011"]);
  });

  it("enforces the one-brand-per-free-plan limit against a real count", async () => {
    await expect(assertBrandLimit(userId)).rejects.toBeInstanceOf(EntitlementError);

    await prisma.brand.deleteMany({ where: { userId } });
    await expect(assertBrandLimit(userId)).resolves.toMatchObject({ id: "free" });
  });

  // --- entitlements over real rows ----------------------------------------

  it("resolves to free with no subscription row", async () => {
    expect((await resolvePlan(userId)).id).toBe("free");
  });

  it("refuses a print PDF on free, then allows it once the webhook lands", async () => {
    const before = await exportRoute(exportRequest({ brandId, asset: "letterhead" }));
    expect(before.status).toBe(402);
    expect(await prisma.asset.count({ where: { brandId } })).toBe(0);

    const hook = await webhookRoute(webhookRequest(activation("launch")));
    expect(hook.status).toBe(200);

    const row = await prisma.subscription.findUnique({ where: { userId } });
    expect(row).toMatchObject({ plan: "launch", status: "active" });
    expect((await resolvePlan(userId)).id).toBe("launch");

    const after = await exportRoute(exportRequest({ brandId, asset: "letterhead" }));
    expect(after.status).toBe(200);
    expect(after.headers.get("content-type")).toBe("application/pdf");

    const bytes = new Uint8Array(await after.arrayBuffer());
    expect(Buffer.from(bytes.subarray(0, 5)).toString()).toBe("%PDF-");

    // The export was metered and recorded, both in real collections.
    expect(await usageCount(userId, "exports")).toBe(1);
    expect(await prisma.asset.count({ where: { brandId, type: "letterhead" } })).toBe(1);
  });

  it("drops access the moment a cancellation webhook arrives", async () => {
    await webhookRoute(webhookRequest(activation("growth")));
    expect((await resolvePlan(userId)).id).toBe("growth");

    await webhookRoute(webhookRequest(activation("growth", "cancelled")));

    const row = await prisma.subscription.findUnique({ where: { userId } });
    expect(row?.status).toBe("cancelled");
    expect(row?.plan).toBe("growth"); // the record survives
    expect((await resolvePlan(userId)).id).toBe("free");
    expect((await exportRoute(exportRequest({ brandId, asset: "letterhead" }))).status).toBe(402);
  });

  // --- the quota counter, against the real unique index --------------------

  it("increments one counter row rather than inserting duplicates", async () => {
    await webhookRoute(webhookRequest(activation("launch")));

    for (let i = 0; i < 3; i += 1) await consumeQuota(userId, "exports");

    const rows = await prisma.usageCounter.findMany({
      where: { userId, period: currentPeriod(), metric: "exports" },
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].count).toBe(3);
  });

  it("refuses past the plan allowance and leaves the counter where it was", async () => {
    await webhookRoute(webhookRequest(activation("launch"))); // 50/month
    await prisma.usageCounter.create({
      data: { userId, period: currentPeriod(), metric: "exports", count: 50 },
    });

    const res = await exportRoute(exportRequest({ brandId, asset: "letterhead" }));
    expect(res.status).toBe(402);
    expect(await res.json()).toMatchObject({ reason: "quota" });
    expect(await usageCount(userId, "exports")).toBe(50);
  });

  it("keeps concurrent exports inside the allowance", async () => {
    await webhookRoute(webhookRequest(activation("launch")));
    await prisma.usageCounter.create({
      data: { userId, period: currentPeriod(), metric: "exports", count: 48 },
    });

    // Four at once against two remaining units.
    const results = await Promise.allSettled(
      Array.from({ length: 4 }, () => consumeQuota(userId, "exports")),
    );
    const granted = results.filter((r) => r.status === "fulfilled").length;

    expect(granted).toBeLessThanOrEqual(2);
    expect(await usageCount(userId, "exports")).toBeLessThanOrEqual(50);
  });

  // --- isolation -----------------------------------------------------------

  it("will not export another user's brand", async () => {
    await webhookRoute(webhookRequest(activation("growth")));
    signedInUser = otherUserId;

    const res = await exportRoute(exportRequest({ brandId, asset: "letterhead" }));
    expect(res.status).toBe(404);
  });

  it("scopes an ID card batch to the requested brand's employees", async () => {
    await webhookRoute(webhookRequest(activation("growth")));

    const otherBrand = await prisma.brand.create({
      data: { userId: otherUserId, name: "Elsewhere Co", industry: "retail", entityType: "pvt-ltd" },
    });
    await prisma.employee.createMany({
      data: [
        { brandId, name: "Ananya Rao", empCode: "NWL-004" },
        { brandId: otherBrand.id, name: "Not Mine", empCode: "XXX-001" },
      ],
    });

    const res = await exportRoute(exportRequest({ brandId, asset: "id-cards" }));
    expect(res.status).toBe(200);
    // One employee on this brand → one card, front and back.
    expect(res.headers.get("content-disposition")).toContain("id-cards-1.pdf");
  });
});
