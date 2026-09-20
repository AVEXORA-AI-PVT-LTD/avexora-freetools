import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { SITE_URL } from "@/tools/categories";

export const revalidate = 3600;

export async function GET() {
  const existing = await prisma.contentBlock.findUnique({
    where: { key: "robots_txt" }
  });

  const defaultContent = `User-Agent: *\nAllow: /\nDisallow: /api/\nDisallow: /admin/\n\nSitemap: ${SITE_URL}/sitemap.xml`;
  const content = existing?.value || defaultContent;

  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "public, max-age=3600, s-maxage=3600"
    }
  });
}
