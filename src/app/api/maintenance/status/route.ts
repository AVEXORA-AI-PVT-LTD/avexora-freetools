import { NextResponse } from "next/server";
import { getMaintenanceModeStatus } from "@/server/admin/maintenance-service";

export async function GET() {
  try {
    const config = await getMaintenanceModeStatus();
    return NextResponse.json(
      {
        enabled: Boolean(config?.enabled),
        message: config?.message,
        estimatedDuration: config?.estimatedDuration,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30",
        },
      }
    );
  } catch (err) {
    return NextResponse.json({ enabled: false }, { status: 200 });
  }
}
