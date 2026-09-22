import { requireAdminAuth } from "@/server/admin-auth";
import { prisma } from "@/server/db";
import { ContentListClient } from "./ContentListClient";

export const metadata = { title: "Content Management | Avex Tools Admin" };

export default async function ContentAdminPage() {
  await requireAdminAuth("content.view");
  const items = await prisma.contentItem.findMany({
    orderBy: { updatedAt: "desc" }
  });
  return <ContentListClient initialItems={items} />;
}
