import { describe, expect, it } from "vitest";
import {
  buildCardHtml,
  buildVCard,
  cardFilename,
  contactRows,
  DEFAULT_CARD_COLORS,
  initials,
  normalizeSocial,
  cardPhotos,
  MAX_PHOTOS,
  normalizeUrl,
  socialLinks,
  telHref,
  validateBusinessCard,
  whatsappHref,
  type BusinessCardInput,
} from "@/tools/compute/legal/business-card";

const PHOTO = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD";

function card(over: Partial<BusinessCardInput> = {}): BusinessCardInput {
  return {
    name: "Priya Sharma",
    title: "Founder & CEO",
    company: "Northwind Labs",
    tagline: "Helping small businesses go digital",
    phone: "+91 98765 43210",
    whatsapp: "",
    email: "priya@northwind.in",
    website: "northwind.in",
    address: "4th Floor, Prestige Tower, MG Road, Bengaluru",
    socials: {},
    ...DEFAULT_CARD_COLORS,
    theme: "light",
    ...over,
  };
}

describe("normalizeUrl", () => {
  it("adds https to a bare domain and keeps http(s) URLs", () => {
    expect(normalizeUrl("northwind.in")).toBe("https://northwind.in/");
    expect(normalizeUrl("http://northwind.in/about")).toBe("http://northwind.in/about");
  });

  it("rejects non-web schemes and hostnames without a dot", () => {
    expect(normalizeUrl("javascript:alert(1)")).toBeNull();
    expect(normalizeUrl("data:text/html,hi")).toBeNull();
    expect(normalizeUrl("ftp://northwind.in")).toBeNull();
    expect(normalizeUrl("localhost")).toBeNull();
    expect(normalizeUrl("   ")).toBeNull();
  });
});

describe("normalizeSocial", () => {
  it("builds a profile URL from a handle, with or without @", () => {
    expect(normalizeSocial("instagram", "@priya.sharma")).toBe("https://www.instagram.com/priya.sharma");
    expect(normalizeSocial("linkedin", "priyasharma")).toBe("https://www.linkedin.com/in/priyasharma");
    expect(normalizeSocial("youtube", "northwind")).toBe("https://www.youtube.com/@northwind");
  });

  it("accepts full and scheme-less links", () => {
    expect(normalizeSocial("linkedin", "linkedin.com/in/priyasharma")).toBe("https://linkedin.com/in/priyasharma");
    expect(normalizeSocial("x", "https://x.com/priya")).toBe("https://x.com/priya");
  });

  it("rejects handles with spaces or markup and unsafe links", () => {
    expect(normalizeSocial("x", "priya sharma")).toBeNull();
    expect(normalizeSocial("x", "<b>")).toBeNull();
    expect(normalizeSocial("github", "javascript:alert(1)")).toBeNull();
  });
});

describe("links", () => {
  it("keeps the leading + and digits only in tel: links", () => {
    expect(telHref("+91 98765-43210")).toBe("tel:+919876543210");
    expect(telHref("080 4567 8900")).toBe("tel:08045678900");
  });

  it("uses digits only for wa.me", () => {
    expect(whatsappHref("+91 98765 43210")).toBe("https://wa.me/919876543210");
  });

  it("builds initials and filenames", () => {
    expect(initials("priya sharma")).toBe("PS");
    expect(initials("  ")).toBe("•");
    expect(cardFilename("Priya Sharma", "html")).toBe("priya-sharma.html");
    expect(cardFilename("Priya Sharma", "png")).toBe("priya-sharma-qr.png");
    expect(cardFilename("", "vcf")).toBe("business-card.vcf");
  });
});

describe("validateBusinessCard", () => {
  it("accepts a complete card", () => {
    expect(validateBusinessCard(card())).toBeNull();
  });

  it("requires a name and at least one way to get in touch", () => {
    expect(validateBusinessCard(card({ name: " " }))).toMatch(/name/);
    expect(validateBusinessCard(card({ phone: "", email: "", website: "" }))).toMatch(/at least one way/);
  });

  it("rejects malformed contact details", () => {
    expect(validateBusinessCard(card({ phone: "123" }))).toMatch(/7 to 15 digits/);
    expect(validateBusinessCard(card({ whatsapp: "98765" }))).toMatch(/country code/);
    expect(validateBusinessCard(card({ email: "priya@" }))).toMatch(/email/);
    expect(validateBusinessCard(card({ website: "javascript:alert(1)" }))).toMatch(/website/);
    expect(validateBusinessCard(card({ socials: { x: "two words" } }))).toMatch(/X link/);
  });

  it("rejects colours that are not #rrggbb and photos that are not PNG/JPEG data URLs", () => {
    expect(validateBusinessCard(card({ primaryColor: "red;}body{display:none" }))).toMatch(/colours/);
    expect(validateBusinessCard(card({ photo: "https://evil.example/x.png" }))).toMatch(/PNG or JPEG/);
    expect(validateBusinessCard(card({ photo: PHOTO }))).toBeNull();
    expect(validateBusinessCard(card({ logo: "data:image/svg+xml;base64,PHN2Zz4=" }))).toMatch(/logo/);
  });

  it("enforces the length limits", () => {
    expect(validateBusinessCard(card({ tagline: "x".repeat(161) }))).toMatch(/tagline/);
  });
});

describe("contactRows and socialLinks", () => {
  it("lists only filled contact methods, in a fixed order", () => {
    const rows = contactRows(card({ email: "", whatsapp: "+91 90000 00000" }));
    expect(rows.map((r) => r.kind)).toEqual(["phone", "whatsapp", "website", "address"]);
    expect(rows.find((r) => r.kind === "website")).toMatchObject({ value: "northwind.in", href: "https://northwind.in/" });
    expect(rows.find((r) => r.kind === "address")!.href).toContain("google.com/maps/search/?api=1&query=4th%20Floor");
  });

  it("drops invalid social entries", () => {
    const links = socialLinks(card({ socials: { linkedin: "priyasharma", x: "bad handle" } }));
    expect(links).toEqual([{ network: "linkedin", url: "https://www.linkedin.com/in/priyasharma" }]);
  });
});

describe("buildVCard", () => {
  it("is a CRLF-terminated vCard 3.0 with the contact's details", () => {
    const v = buildVCard(card({ socials: { linkedin: "priyasharma" } }));
    expect(v.startsWith("BEGIN:VCARD\r\nVERSION:3.0\r\n")).toBe(true);
    expect(v.endsWith("END:VCARD\r\n")).toBe(true);
    expect(v).not.toMatch(/[^\r]\n/);
    expect(v).toContain("N:Sharma;Priya;;;");
    expect(v).toContain("FN:Priya Sharma");
    expect(v).toContain("TITLE:Founder & CEO");
    expect(v).toContain("TEL;TYPE=CELL,VOICE:+919876543210");
    expect(v).toContain("URL:https://northwind.in/");
    expect(v).toContain("X-SOCIALPROFILE;TYPE=linkedin:https://www.linkedin.com/in/priyasharma");
  });

  it("escapes commas, semicolons and newlines", () => {
    const v = buildVCard(card({ address: "MG Road; Block 2,\nBengaluru" }));
    expect(v).toContain("ADR;TYPE=WORK:;;MG Road\\; Block 2\\,\\nBengaluru;;;;");
  });

  it("adds WhatsApp only when it differs from the phone", () => {
    expect(buildVCard(card({ whatsapp: "+91 98765 43210" })).match(/^TEL/gm)).toHaveLength(1);
    expect(buildVCard(card({ whatsapp: "+91 90000 00000" }))).toContain("TEL;TYPE=CELL:+919000000000");
  });

  it("embeds the photo, folded to 75 characters, unless asked not to", () => {
    const photo = `data:image/jpeg;base64,${"A".repeat(300)}`;
    const v = buildVCard(card({ photo }));
    expect(v).toContain("PHOTO;ENCODING=b;TYPE=JPEG:");
    for (const line of v.split("\r\n")) expect(line.length).toBeLessThanOrEqual(75);
    expect(buildVCard(card({ photo }), { includePhoto: false })).not.toContain("PHOTO");
  });
});

describe("buildCardHtml", () => {
  it("renders the details, links and Save Contact", () => {
    const html = buildCardHtml(card({ socials: { instagram: "@priya" } }), { qrSvg: "<svg></svg>" });
    expect(html).toContain("<h1");
    expect(html).toContain("Priya Sharma");
    expect(html).toContain('href="tel:+919876543210"');
    expect(html).toContain('href="mailto:priya@northwind.in"');
    expect(html).toContain('href="https://www.instagram.com/priya"');
    expect(html).toContain('download="priya-sharma.vcf"');
    expect(html).toContain("href=\"data:text/vcard;charset=utf-8,BEGIN%3AVCARD");
    expect(html).toContain("Scan to save this contact");
  });

  it("makes no external requests", () => {
    const html = buildCardHtml(card());
    expect(html).not.toMatch(/<(link|script)[^>]+(href|src)=/i);
    expect(html).not.toContain("fonts.googleapis");
  });

  it("escapes user text so it cannot inject markup", () => {
    const html = buildCardHtml(
      card({ name: '<script>alert(1)</script>', tagline: '"><img src=x onerror=alert(1)>', company: "A & B" }),
    );
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).not.toContain("<img src=x");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).toContain("A &amp; B");
  });

  it("never emits unsafe links or unvalidated colours", () => {
    const html = buildCardHtml(
      card({ website: "javascript:alert(1)", primaryColor: "red;}</style><script>x()</script>", socials: { x: "javascript:alert(1)" } }),
    );
    expect(html).not.toContain("javascript:");
    expect(html).not.toContain("<script>x()");
    expect(html).toContain(`--primary:${DEFAULT_CARD_COLORS.primaryColor}`);
  });

  it("shows the whole photo in the header", () => {
    const html = buildCardHtml(card({ photo: PHOTO, photoRatio: 0.75 }));
    expect(html).toContain('class="banner hero"');
    expect(html).toContain(`--p0:url('${PHOTO}');--ratio:0.75`);
    // The header takes the photo's proportions and anchors it at the top: no cropped heads.
    expect(html).toContain("aspect-ratio:var(--ratio)");
    expect(html).toContain("background-position:center top");
    // One photo: a slow zoom, no crossfade.
    expect(html).toContain("@keyframes zoom1");
    expect(html).not.toContain("@keyframes shot");
  });

  it("plays several poses as a motion picture, each image embedded once", () => {
    const poses = ["A", "B", "C", "D"].map((c) => `data:image/jpeg;base64,${c.repeat(40)}`);
    const html = buildCardHtml(card({ photo: poses[0], morePhotos: poses.slice(1) }));
    for (let i = 0; i < 4; i++) {
      expect(html).toContain(`--p${i}:url('${poses[i]}')`);
      expect(html.split(poses[i]!).length - 1).toBe(1);
    }
    expect(html.match(/class="shot/g)).toHaveLength(4);
    expect(html).toContain("@keyframes shot");
    expect(html).toContain(".shot:nth-child(4){animation-delay:10.50s}");
    expect(html).toContain("prefers-reduced-motion");
  });

  it("shows only the main photo, still, when motion is off", () => {
    const html = buildCardHtml(card({ photo: PHOTO, morePhotos: [PHOTO.replace("AAAQ", "BBBQ")], photoMotion: false }));
    expect(html.match(/class="shot/g)).toHaveLength(1);
    expect(html).not.toContain("@keyframes shot");
    expect(html).not.toContain("@keyframes zoom");
  });

  it("validates the extra photos", () => {
    expect(validateBusinessCard(card({ photo: PHOTO, morePhotos: [PHOTO, PHOTO, PHOTO] }))).toBeNull();
    expect(validateBusinessCard(card({ photo: PHOTO, morePhotos: [PHOTO, PHOTO, PHOTO, PHOTO] }))).toMatch(new RegExp(`${MAX_PHOTOS} photos`));
    expect(validateBusinessCard(card({ morePhotos: [PHOTO] }))).toMatch(/main photo/);
    expect(validateBusinessCard(card({ photo: PHOTO, morePhotos: ["javascript:alert(1)"] }))).toMatch(/PNG or JPEG/);
    expect(cardPhotos(card({ photo: PHOTO, morePhotos: ["javascript:x", PHOTO] }))).toEqual([PHOTO, PHOTO]);
    expect(validateBusinessCard(card({ photo: PHOTO, photoRatio: 50 }))).toMatch(/photo/);
    expect(buildCardHtml(card({ photo: PHOTO, photoRatio: 50 }))).toContain("--ratio:0.8");
  });

  it("shows the logo large on a white panel", () => {
    const html = buildCardHtml(card({ photo: PHOTO, logo: PHOTO }));
    expect(html).toContain('class="brandbar');
    expect(html).toContain(`<img src="${PHOTO}" alt="Northwind Labs logo">`);
    expect(html).not.toContain('class="avatar');
    expect(buildCardHtml(card({ logo: "javascript:alert(1)" }))).not.toContain("javascript:");
  });

  it("adds share metadata for saved cards, escaping the URL into the script", () => {
    const html = buildCardHtml(card(), {
      shareUrl: "https://tools.avexora.in/card/priya-sharma-abc123",
      ogImageUrl: "https://tools.avexora.in/card/priya-sharma-abc123/photo",
      noindex: true,
      qrTarget: "card",
      qrSvg: "<svg></svg>",
    });
    expect(html).toContain('<meta name="robots" content="noindex">');
    expect(html).toContain('<link rel="canonical" href="https://tools.avexora.in/card/priya-sharma-abc123">');
    expect(html).toContain('<meta property="og:image" content="https://tools.avexora.in/card/priya-sharma-abc123/photo">');
    expect(html).toContain('var url="https://tools.avexora.in/card/priya-sharma-abc123"');
    expect(html).toContain("Scan to open this card");
    const evil = buildCardHtml(card(), { shareUrl: "https://x.test/</script><script>alert(1)</script>" });
    expect(evil).not.toContain("</script><script>alert(1)");
  });

  it("uses initials without a photo and can skip the entrance", () => {
    expect(buildCardHtml(card())).toContain(">PS</span>");
    expect(buildCardHtml(card(), { entrance: false })).toContain('class="no-entrance"');
    expect(buildCardHtml(card({ theme: "dark" }))).toContain('data-theme="dark"');
  });
});
