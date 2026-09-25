import { requireAdminAuth } from "@/server/admin-auth";
import { CacheManagementClient } from "./CacheManagementClient";

export const metadata = {
  title: "Cache Management — Avex Tools Admin",
  description: "Targeted cache invalidation and application cache clearing.",
};

export default async function CachePage() {
  await requireAdminAuth("maintenance.cache.clear");

  return <CacheManagementClient />;
}
