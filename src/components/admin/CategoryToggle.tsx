"use client";

import { useTransition, useState } from "react";
import { updateCategoryStatus } from "@/app/admin/categories/actions";

export function CategoryToggle({ slug, initialStatus }: { slug: string; initialStatus: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState(initialStatus);
  const [error, setError] = useState<string | null>(null);

  const handleToggle = () => {
    const newStatus = !status;
    setStatus(newStatus); // Optimistic UI
    setError(null);

    startTransition(async () => {
      const result = await updateCategoryStatus(slug, newStatus);
      if (!result.success) {
        setStatus(!newStatus); // Rollback
        setError(result.error || "Failed to update status");
      }
    });
  };

  return (
    <div className="flex flex-col gap-1 items-start">
      <button
        onClick={handleToggle}
        disabled={isPending}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-900 ${
          status ? "bg-green-600" : "bg-zinc-300"
        } ${isPending ? "opacity-50 cursor-wait" : ""}`}
        aria-label={`Toggle ${slug}`}
        aria-pressed={status}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            status ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
