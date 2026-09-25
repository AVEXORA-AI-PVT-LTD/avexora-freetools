import { NextResponse } from "next/server";
import { reportError, ErrorType, ErrorSeverity } from "@/server/error-monitoring";
import { auth } from "@/server/auth";
import { z } from "zod";

const errorReportSchema = z.object({
  errorType: z.string().optional(),
  toolSlug: z.string().optional(),
  errorCode: z.string().optional(),
  message: z.string().min(1, "Message is required"),
  requestId: z.string().optional(),
  severity: z.enum(["Low", "Medium", "High", "Critical"]).optional(),
  environment: z.string().optional(),
  stackTrace: z.string().optional(),
  endpoint: z.string().optional(),
  method: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const parseResult = errorReportSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const session = await auth().catch(() => null);
    const userId = session?.user?.id;
    const userAgent = req.headers.get("user-agent") || undefined;
    const referer = req.headers.get("referer") || undefined;

    const data = parseResult.data;

    reportError({
      errorType: (data.errorType as ErrorType) || "Server Error",
      toolSlug: data.toolSlug,
      userId,
      errorCode: data.errorCode,
      message: data.message,
      requestId: data.requestId,
      severity: (data.severity as ErrorSeverity) || "Medium",
      environment: data.environment,
      stackTrace: data.stackTrace,
      endpoint: data.endpoint || referer,
      method: data.method,
      metadata: {
        ...data.metadata,
        referer,
      },
      userAgent,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("[ErrorReportAPI] Failed:", error);
    return NextResponse.json({ error: "Failed to submit error report" }, { status: 500 });
  }
}
