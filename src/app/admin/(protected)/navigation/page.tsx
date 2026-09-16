import { Metadata } from "next";
import { requireAdminAuth } from "@/server/admin-auth";
import { prisma } from "@/server/db";
import NavigationManager from "./NavigationManager";

export const metadata: Metadata = {
  title: "Navigation Management | Admin",
};

export default async function NavigationAdminPage() {
  await requireAdminAuth("navigation.view");

  const links = await prisma.navigationLink.findMany({
    orderBy: { displayOrder: "asc" },
  });

  const serializedLinks = links.map(link => ({
    id: link.id,
    label: link.label,
    href: link.href,
    location: link.location,
    displayOrder: link.displayOrder,
    status: link.status,
    type: link.type,
    openInNewTab: link.openInNewTab,
  }));

  return (
    <div className="mx-auto max-w-4xl p-6">
      <NavigationManager initialLinks={serializedLinks} />
    </div>
  );
}
