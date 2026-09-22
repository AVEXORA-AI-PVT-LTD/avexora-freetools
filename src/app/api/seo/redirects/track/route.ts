import { NextResponse } from "next/server";
import { prisma } from "@/server/db";

export async function POST(req: Request) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    // Fire and forget increment
    await prisma.redirect.update({
      where: { id },
      data: { 
        hitCount: { increment: 1 },
        lastHitAt: new Date()
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to track" }, { status: 500 });
  }
}
