import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db";
import { auth } from "@/server/auth";

const submissionSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Valid email is required"),
  subject: z.string().trim().min(1, "Subject is required").max(200),
  message: z.string().trim().min(1, "Message is required").max(5000),
  type: z.enum(["Contact", "Bug Report", "Feature Request", "Tool Feedback", "Review"]).optional().default("Contact"),
  toolSlug: z.string().optional().nullable(),
  browser: z.string().optional().nullable(),
  device: z.string().optional().nullable(),
  userAgent: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = submissionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const session = await auth().catch(() => null);
    const data = parsed.data;

    const referenceId = `FB-${Date.now().toString().slice(-6)}${Math.floor(100 + Math.random() * 900)}`;

    const submission = await prisma.contactSubmission.create({
      data: {
        referenceId,
        type: data.type,
        name: data.name,
        email: data.email,
        subject: data.subject,
        message: data.message,
        toolSlug: data.toolSlug || null,
        userId: session?.user?.id || null,
        priority: data.type === "Bug Report" ? "High" : "Medium",
        status: "New",
        browser: data.browser || null,
        device: data.device || null,
        userAgent: data.userAgent || null,
        source: "website",
      },
    });

    return NextResponse.json(
      {
        success: true,
        referenceId: submission.referenceId,
        message: "Thank you! Your submission has been received.",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[public contact api] submission error:", error);
    return NextResponse.json(
      { error: "Failed to process contact submission. Please try again." },
      { status: 500 }
    );
  }
}
