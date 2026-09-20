import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/server/db";
import { auth } from "@/server/auth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  const type = searchParams.get("type");

  if (!slug || !type) {
    return new Response("Missing parameters", { status: 400 });
  }

  const session = await auth();
  if (!session?.user?.role || !["admin", "superadmin", "editor"].includes(session.user.role)) {
    return new Response("Unauthorized for preview", { status: 401 });
  }

  const post = await prisma.contentItem.findUnique({
    where: { slug }
  });

  if (!post) {
    return new Response("Content not found", { status: 404 });
  }

  (await draftMode()).enable();

  if (type === "BLOG") {
    redirect(`/blog/${slug}`);
  } else if (type === "GUIDE") {
    redirect(`/guides/${slug}`);
  } else if (type === "DOCUMENTATION") {
    redirect(`/docs/${slug}`);
  } else if (type === "FAQ") {
    redirect(`/faq`);
  } else {
    redirect(`/legal/${slug}`);
  }
}
