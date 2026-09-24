import crypto from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Save & share for the Digital Business Card: the /api/cards routes and the
 * public /card/<slug> page, against an in-memory Prisma double. Plans resolve
 * through the real entitlements code, so "paid" means exactly what it means
 * everywhere else in the product.
 */

interface CardRow {
  id: string;
  userId: string;
  slug: string;
  data: unknown;
  qrTarget: string;
  views: number;
  createdAt: Date;
  updatedAt: Date;
}

const db = {
  cards: [] as CardRow[],
  subscriptions: new Map<string, { plan: string; status: string; currentPeriodEnd: Date | null }>(),
};
let nextId = 1;
const oid = () => (nextId++).toString(16).padStart(24, "0");

const prismaDouble = {
  plan: { findUnique: async () => null, findMany: async () => [] },
  subscription: {
    findUnique: async ({ where }: { where: { userId: string } }) => db.subscriptions.get(where.userId) ?? null,
  },
  digitalCard: {
    findMany: async ({ where }: { where: { userId: string } }) =>
      db.cards.filter((c) => c.userId === where.userId).sort((a, b) => +b.updatedAt - +a.updatedAt),
    count: async ({ where }: { where: { userId: string } }) => db.cards.filter((c) => c.userId === where.userId).length,
    create: async ({ data }: { data: Omit<CardRow, "id" | "views" | "createdAt" | "updatedAt"> }) => {
      const row = { ...data, id: oid(), views: 0, createdAt: new Date(), updatedAt: new Date() };
      db.cards.push(row);
      return row;
    },
    findFirst: async ({ where }: { where: { id: string; userId: string } }) =>
      db.cards.find((c) => c.id === where.id && c.userId === where.userId) ?? null,
    findUnique: async ({ where }: { where: { slug: string } }) => db.cards.find((c) => c.slug === where.slug) ?? null,
    update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
      const row = db.cards.find((c) => c.id === where.id)!;
      const views = data.views as { increment?: number } | undefined;
      Object.assign(row, { ...data, views: views?.increment ? row.views + views.increment : row.views, updatedAt: new Date() });
      return row;
    },
    delete: async ({ where }: { where: { id: string } }) => {
      db.cards = db.cards.filter((c) => c.id !== where.id);
      return {};
    },
  },
};

let signedInUser: string | null = "user-1";
vi.mock("@/server/db", () => ({ prisma: prismaDouble, isDatabaseConfigured: () => true }));
vi.mock("@/server/auth", () => ({
  currentUserId: async () => signedInUser,
  auth: async () => (signedInUser ? { user: { id: signedInUser } } : null),
}));

const cardsRoute = await import("@/app/api/cards/route");
const cardRoute = await import("@/app/api/cards/[id]/route");
const publicRoute = await import("@/app/card/[slug]/route");
const photoRoute = await import("@/app/card/[slug]/photo/route");
const { newCardSlug, parseCardPayload, MAX_CARDS_PER_USER } = await import("@/server/cards");

const PHOTO = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD";

function card(over: Record<string, unknown> = {}) {
  return {
    name: "Priya Sharma",
    title: "Founder & CEO",
    company: "Northwind Labs",
    tagline: "",
    phone: "+91 98765 43210",
    whatsapp: "",
    email: "priya@northwind.in",
    website: "northwind.in",
    address: "",
    socials: { linkedin: "priyasharma" },
    primaryColor: "#EA580C",
    accentColor: "#7C3AED",
    theme: "light",
    ...over,
  };
}

const json = (body: unknown, method = "POST") =>
  new Request("http://localhost/api/cards", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
const ctx = <T extends Record<string, string>>(params: T) => ({ params: Promise.resolve(params) });

function subscribe(userId: string, plan = "launch", status = "active") {
  db.subscriptions.set(userId, { plan, status, currentPeriodEnd: new Date(Date.now() + 30 * 864e5) });
}

async function saveCard(body: unknown = { card: card() }) {
  const res = await cardsRoute.POST(json(body));
  return { res, body: (await res.json()) as { card?: { id: string; slug: string; url: string }; error?: string; requiredPlan?: string } };
}

beforeEach(() => {
  db.cards = [];
  db.subscriptions.clear();
  signedInUser = "user-1";
});

describe("saving requires a signed-in user on a paid plan", () => {
  it("rejects anonymous saves", async () => {
    signedInUser = null;
    expect((await saveCard()).res.status).toBe(401);
  });

  it("refuses the free plan with 402 and names the plan that unlocks it", async () => {
    const { res, body } = await saveCard();
    expect(res.status).toBe(402);
    expect(body.requiredPlan).toBe("launch");
    expect(db.cards).toHaveLength(0);
  });

  it("treats a lapsed subscription as free", async () => {
    subscribe("user-1", "growth", "halted");
    expect((await saveCard()).res.status).toBe(402);
  });

  it("saves on a paid plan and returns a public link", async () => {
    subscribe("user-1");
    const { res, body } = await saveCard();
    expect(res.status).toBe(201);
    expect(body.card!.slug).toMatch(/^priya-sharma-[a-z0-9]{6}$/);
    expect(body.card!.url).toBe(`https://tools.avexora.in/card/${body.card!.slug}`);
  });
});

describe("validation on write", () => {
  beforeEach(() => subscribe("user-1"));

  it("applies the same rules as the tool", async () => {
    expect((await saveCard({ card: card({ email: "priya@" }) })).body.error).toMatch(/email/);
    expect((await saveCard({ card: card({ website: "javascript:alert(1)" }) })).res.status).toBe(400);
    expect((await saveCard({ card: card({ photo: "https://evil.test/x.png" }) })).res.status).toBe(400);
    expect((await saveCard({ card: card(), qrTarget: "evil" })).res.status).toBe(400);
  });

  it(`caps each account at ${MAX_CARDS_PER_USER} cards`, async () => {
    for (let i = 0; i < MAX_CARDS_PER_USER; i++) {
      db.cards.push({ id: oid(), userId: "user-1", slug: `c-${i}`, data: card(), qrTarget: "contact", views: 0, createdAt: new Date(), updatedAt: new Date() });
    }
    expect((await saveCard()).res.status).toBe(409);
  });
});

describe("owner-only list, edit and delete", () => {
  it("lists only the caller's cards and hides other people's", async () => {
    subscribe("user-1");
    subscribe("user-2");
    const mine = (await saveCard()).body.card!;
    signedInUser = "user-2";
    await saveCard({ card: card({ name: "Someone Else" }) });

    const list = (await (await cardsRoute.GET()).json()) as { cards: { id: string }[] };
    expect(list.cards).toHaveLength(1);
    expect(list.cards[0]!.id).not.toBe(mine.id);

    // user-2 can neither read, edit nor delete user-1's card.
    expect((await cardRoute.GET(new Request("http://x"), ctx({ id: mine.id }))).status).toBe(404);
    expect((await cardRoute.PUT(json({ card: card() }, "PUT"), ctx({ id: mine.id }))).status).toBe(404);
    expect((await cardRoute.DELETE(new Request("http://x"), ctx({ id: mine.id }))).status).toBe(404);
    expect(db.cards.some((c) => c.id === mine.id)).toBe(true);
  });

  it("updates in place, keeping the slug", async () => {
    subscribe("user-1");
    const saved = (await saveCard()).body.card!;
    const res = await cardRoute.PUT(json({ card: card({ title: "CEO" }), qrTarget: "card" }, "PUT"), ctx({ id: saved.id }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { card: { slug: string; qrTarget: string } };
    expect(body.card.slug).toBe(saved.slug);
    expect(body.card.qrTarget).toBe("card");
    const loaded = (await (await cardRoute.GET(new Request("http://x"), ctx({ id: saved.id }))).json()) as { data: { title: string } };
    expect(loaded.data.title).toBe("CEO");
  });

  it("lets a lapsed owner delete but not update", async () => {
    subscribe("user-1");
    const saved = (await saveCard()).body.card!;
    db.subscriptions.clear();
    expect((await cardRoute.PUT(json({ card: card() }, "PUT"), ctx({ id: saved.id }))).status).toBe(402);
    expect((await cardRoute.DELETE(new Request("http://x"), ctx({ id: saved.id }))).status).toBe(200);
    expect(db.cards).toHaveLength(0);
  });
});

describe("the public card page", () => {
  it("serves the card with a CSP that allows only its own script, and counts the view", async () => {
    subscribe("user-1");
    const saved = (await saveCard({ card: card({ photo: PHOTO }), qrTarget: "card" })).body.card!;
    const res = await publicRoute.GET(new Request("http://x"), ctx({ slug: saved.slug }));
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/html");
    expect(res.headers.get("X-Robots-Tag")).toBe("noindex");
    const html = await res.text();
    expect(html).toContain("Priya Sharma");
    expect(html).toContain(`<link rel="canonical" href="${saved.url}">`);
    expect(html).toContain(`content="${saved.url}/photo"`);
    expect(html).toContain("Scan to open this card");

    const script = /<script>([\s\S]*?)<\/script>/.exec(html)![1]!;
    const hash = crypto.createHash("sha256").update(script).digest("base64");
    const csp = res.headers.get("Content-Security-Policy")!;
    expect(csp).toContain(`script-src 'sha256-${hash}'`);
    expect(csp).toContain("default-src 'none'");

    await new Promise((r) => setTimeout(r, 0));
    expect(db.cards[0]!.views).toBe(1);
  });

  it("serves the photo for link previews", async () => {
    subscribe("user-1");
    const saved = (await saveCard({ card: card({ photo: PHOTO }) })).body.card!;
    const res = await photoRoute.GET(new Request("http://x"), ctx({ slug: saved.slug }));
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("image/jpeg");
  });

  it("pauses the link when the owner's plan lapses, and 404s unknown or malformed slugs", async () => {
    subscribe("user-1");
    const saved = (await saveCard()).body.card!;
    db.subscriptions.clear();
    expect((await publicRoute.GET(new Request("http://x"), ctx({ slug: saved.slug }))).status).toBe(410);
    expect((await publicRoute.GET(new Request("http://x"), ctx({ slug: "nobody-000000" }))).status).toBe(404);
    expect((await publicRoute.GET(new Request("http://x"), ctx({ slug: "../../etc" }))).status).toBe(404);
  });
});

describe("helpers", () => {
  it("makes readable, random slugs", () => {
    const a = newCardSlug("Priya Sharma");
    expect(a).toMatch(/^priya-sharma-[a-z0-9]{6}$/);
    expect(newCardSlug("Priya Sharma")).not.toBe(a);
    expect(newCardSlug("!!!")).toMatch(/^card-[a-z0-9]{6}$/);
  });

  it("rejects the website QR without a website", () => {
    const r = parseCardPayload({ card: card({ website: "" }), qrTarget: "website" });
    expect(r.ok).toBe(false);
  });
});
