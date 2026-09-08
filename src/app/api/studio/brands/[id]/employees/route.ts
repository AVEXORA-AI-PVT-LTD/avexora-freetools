import { z } from "zod";
import { prisma } from "@/server/db";
import { errorResponse, HttpError, readJson, requireUser } from "@/server/studio/route-helpers";

export const runtime = "nodejs";

/**
 * Employee roster for ID-card batches (spec 21 §3, gap 3).
 *
 * Photos are intentionally absent from this API: they stay in the browser and
 * are composited at render time, matching the free-tools engine's rule that
 * user files never leave the device.
 */

const employeeSchema = z.object({
  name: z.string().min(1).max(80),
  designation: z.string().max(80).optional(),
  empCode: z.string().max(30).optional(),
  department: z.string().max(60).optional(),
  bloodGroup: z.string().max(6).optional(),
  phone: z.string().max(30).optional(),
  email: z.string().max(120).optional(),
  validUntil: z.string().max(20).optional(),
});

const bulkSchema = z.object({
  employees: z.array(employeeSchema).min(1).max(200),
  /** Replace the whole roster instead of appending. */
  replace: z.boolean().optional(),
});

async function ownedBrand(userId: string, id: string) {
  const brand = await prisma.brand.findFirst({ where: { id, userId } });
  if (!brand) throw new HttpError(404, "Brand not found.");
  return brand;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await requireUser();
    const { id } = await params;
    const brand = await ownedBrand(userId, id);

    const employees = await prisma.employee.findMany({
      where: { brandId: brand.id },
      orderBy: { createdAt: "asc" },
    });
    return Response.json({ employees });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await requireUser();
    const { id } = await params;
    const brand = await ownedBrand(userId, id);

    const parsed = bulkSchema.safeParse(await readJson(req));
    if (!parsed.success) throw new HttpError(400, "Check the employee list.");

    if (parsed.data.replace) {
      await prisma.employee.deleteMany({ where: { brandId: brand.id } });
    }

    await prisma.employee.createMany({
      data: parsed.data.employees.map((e) => ({ ...e, brandId: brand.id })),
    });

    const employees = await prisma.employee.findMany({
      where: { brandId: brand.id },
      orderBy: { createdAt: "asc" },
    });
    return Response.json({ employees });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await requireUser();
    const { id } = await params;
    const brand = await ownedBrand(userId, id);
    await prisma.employee.deleteMany({ where: { brandId: brand.id } });
    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
