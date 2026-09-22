import { NextResponse } from "next/server";
import { prisma } from "@/server/db";

export async function GET() {
  try {
    const redirects = await prisma.redirect.findMany({
      where: { active: true },
      select: { id: true, source: true, destination: true, statusCode: true }
    });
    return NextResponse.json(redirects);
  } catch (error) {
    return NextResponse.json([], { status: 500 });
  }
}
