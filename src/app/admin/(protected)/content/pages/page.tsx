import { requireAdminAuth } from "@/server/admin-auth";
import { prisma } from "@/server/db";
import { ContentListClient } from "../ContentListClient";
import { ContentType } from "@prisma/client";

export const metadata = { title: "Pages | Admin" };

export default async function PagesAdminPage() {
  await requireAdminAuth("content.view");
  const items = await prisma.contentItem.findMany({
    where: { contentType: ContentType.PAGE },
    orderBy: { updatedAt: "desc" }
  });
  return <ContentListClient initialItems={items} fixedType={ContentType.PAGE} />;
}
