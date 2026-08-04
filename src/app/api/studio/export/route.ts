import { z } from "zod";
import { prisma } from "@/server/db";
import {
  assertCapability,
  assertIdCardLimit,
  consumeQuota,
} from "@/studio/entitlements";
import { errorResponse, HttpError, readJson, requireUser } from "@/studio/route-helpers";
import { toComplianceInput, toTokens } from "@/studio/brand-context";
import { renderPdf } from "@/studio/engine/render/pdf";
import type { DocSpec } from "@/studio/engine/doc-spec";
import { letterheadSpec, LETTERHEAD_VARIANTS } from "@/studio/engine/layouts/letterhead";
import { envelopeSpec } from "@/studio/engine/layouts/envelope";
import { businessCardSpec } from "@/studio/engine/layouts/business-card";
import { idCardBatch } from "@/studio/engine/layouts/id-card";
import { composeLogo, LOGO_VARIANTS } from "@/studio/engine/logo";

export const runtime = "nodejs";

/**
 * Print-ready PDF export (spec 22 §3.2, §6).
 *
 * This is the paid action: `assertCapability("printPdf")` gates it before a
 * single byte is rendered, and the export is metered against the plan's
 * monthly allowance. Screen assets (social, ads) are rasterised client-side
 * and never come through here.
 */

const bodySchema = z.object({
  brandId: z.string().min(1),
  asset: z.enum([
    "letterhead",
    "envelope",
    "business-card",
    "id-cards",
    "logo-pack",
  ]),
  variant: z.string().max(40).optional(),
  envelopeSize: z.enum(["dl", "c5", "c4"]).optional(),
  holder: z
    .object({
      name: z.string().min(1).max(80),
      designation: z.string().max(80).optional(),
      phone: z.string().max(30).optional(),
      email: z.string().max(120).optional(),
      website: z.string().max(120).optional(),
    })
    .optional(),
  employeeIds: z.array(z.string()).max(200).optional(),
  orientation: z.enum(["portrait", "landscape"]).optional(),
});

export async function POST(req: Request) {
  try {
    const userId = await requireUser();

    const parsed = bodySchema.safeParse(await readJson(req));
    if (!parsed.success) {
      return Response.json({ error: "Invalid export request." }, { status: 400 });
    }
    const body = parsed.data;

    const brand = await prisma.brand.findFirst({
      where: { id: body.brandId, userId },
      include: { kit: true },
    });
    if (!brand) throw new HttpError(404, "Brand not found.");

    // Gate before rendering — never spend CPU on an export we won't return.
    await assertCapability(userId, "printPdf");

    const tokens = toTokens(brand, brand.kit);
    const compliance = toComplianceInput(brand);
    const variant = body.variant ?? "classic";

    let specs: DocSpec[];
    let filename: string;

    switch (body.asset) {
      case "letterhead": {
        const v = (LETTERHEAD_VARIANTS as string[]).includes(variant)
          ? (variant as (typeof LETTERHEAD_VARIANTS)[number])
          : "classic";
        specs = [
          letterheadSpec(tokens, compliance, {
            variant: v,
            showBodyPlaceholder: false,
          }),
        ];
        filename = "letterhead.pdf";
        break;
      }

      case "envelope": {
        const size = body.envelopeSize ?? "dl";
        specs = [envelopeSpec(tokens, compliance, { size })];
        filename = `envelope-${size}.pdf`;
        break;
      }

      case "business-card": {
        if (!body.holder) throw new HttpError(400, "Card holder details are required.");
        specs = [
          businessCardSpec(tokens, compliance, { holder: body.holder, side: "front" }),
          businessCardSpec(tokens, compliance, { holder: body.holder, side: "back" }),
        ];
        filename = "business-card.pdf";
        break;
      }

      case "id-cards": {
        const employees = await prisma.employee.findMany({
          where: {
            brandId: brand.id,
            ...(body.employeeIds?.length ? { id: { in: body.employeeIds } } : {}),
          },
          orderBy: { createdAt: "asc" },
        });
        if (employees.length === 0) {
          throw new HttpError(400, "Add at least one employee first.");
        }
        await assertIdCardLimit(userId, employees.length);

        specs = idCardBatch(tokens, compliance, employees, {
          orientation: body.orientation ?? "portrait",
        });
        filename = `id-cards-${employees.length}.pdf`;
        break;
      }

      case "logo-pack": {
        // Each logo variant on its own page, sized to the artwork.
        specs = LOGO_VARIANTS.map((v) => {
          const logo = composeLogo(tokens, { variant: v });
          const width = 160;
          const height = (logo.height / logo.width) * width;
          return {
            size: { w: width, h: height + 20, unit: "mm" as const },
            background: {
              type: "solid" as const,
              color:
                v === "mono-light"
                  ? tokens.palette.ink
                  : tokens.palette.surface,
            },
            elements: [
              {
                kind: "svg" as const,
                x: 10,
                y: 10,
                w: width - 20,
                h: height,
                viewBox: logo.viewBox,
                content: logo.content,
              },
            ],
            meta: { title: `${brand.name} logo — ${v}` },
          } satisfies DocSpec;
        });
        filename = "logo-pack.pdf";
        break;
      }
    }

    // Only meter once the export is known-good and the plan allows it.
    await consumeQuota(userId, "exports");

    const bytes = await renderPdf(specs, {
      title: `${brand.legalName ?? brand.name} — ${body.asset}`,
      author: brand.legalName ?? brand.name,
    });

    await prisma.asset.create({
      data: {
        brandId: brand.id,
        type: body.asset,
        variant,
        spec: { asset: body.asset, variant, pages: specs.length },
      },
    });

    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
