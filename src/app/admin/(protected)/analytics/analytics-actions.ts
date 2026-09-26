"use server";

import { requirePermission } from "@/server/permissions";
import {
  getAnalyticsOverview,
  getSingleToolAnalytics,
  AnalyticsDateRangeParams,
} from "@/server/admin/analytics-service";

/**
 * Fetch analytics overview data protected by server-side RBAC.
 */
export async function getAnalyticsOverviewAction(params: AnalyticsDateRangeParams = {}) {
  await requirePermission("analytics.view");
  return getAnalyticsOverview(params);
}

/**
 * Fetch detailed analytics for a single tool protected by server-side RBAC.
 */
export async function getSingleToolAnalyticsAction(slug: string, params: AnalyticsDateRangeParams = {}) {
  await requirePermission("analytics.view");
  return getSingleToolAnalytics(slug, params);
}
