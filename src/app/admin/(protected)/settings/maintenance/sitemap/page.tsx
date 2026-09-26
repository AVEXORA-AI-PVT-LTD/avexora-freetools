import { requireAdminAuth } from "@/server/admin-auth";
import { SitemapManagementClient } from "./SitemapManagementClient";

export const metadata = {
  title: "Sitemap Management — Avex Tools Admin",
  description: "XML sitemap generation, canonical domain validation, and indexing checks.",
};

export default async function SitemapPage() {
  await requireAdminAuth("maintenance.sitemap.rebuild");

  return <SitemapManagementClient />;
}
