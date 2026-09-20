import { requireAdminAuth } from "@/server/admin-auth";
import { prisma } from "@/server/db";
import { ContentListClient } from "../ContentListClient";
import { ContentType } from "@prisma/client";

export const metadata = { title: "Guides | Admin" };

export default async function GuideAdminPage() {
  await requireAdminAuth("content.view");
  const items = await prisma.contentItem.findMany({
    where: { contentType: ContentType.GUIDE },
    orderBy: { updatedAt: "desc" }
  });
  return <ContentListClient initialItems={items} fixedType={ContentType.GUIDE} />;
}
