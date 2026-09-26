import { requireAdminAuth } from "@/server/admin-auth";
import { checkSystemHealth } from "@/server/admin/maintenance-service";
import { SystemHealthClient } from "./SystemHealthClient";

export const metadata = {
  title: "System Health — Avex Tools Admin",
  description: "Real-time latency, storage connection, and service health checks.",
};

export default async function SystemHealthPage() {
  await requireAdminAuth("maintenance.health.view");

  const health = await checkSystemHealth();

  return <SystemHealthClient initialHealth={health} />;
}
