"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { DateRange } from "@/server/admin/dashboard-stats";

export function DateRangePicker() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentRange = searchParams.get("range") || "last30days";

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRange = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", newRange);
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="date-range" className="text-sm font-medium text-zinc-600">
        Date Range:
      </label>
      <select
        id="date-range"
        value={currentRange}
        onChange={handleChange}
        className="block w-40 pl-3 pr-10 py-2 text-base border-zinc-300 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm rounded-md bg-white border shadow-sm"
      >
        <option value="today">Today</option>
        <option value="yesterday">Yesterday</option>
        <option value="last7days">Last 7 Days</option>
        <option value="last30days">Last 30 Days</option>
        <option value="last90days">Last 90 Days</option>
        <option value="thisMonth">This Month</option>
        <option value="lastMonth">Last Month</option>
        <option value="thisYear">This Year</option>
        <option value="allTime">All Time</option>
      </select>
    </div>
  );
}
