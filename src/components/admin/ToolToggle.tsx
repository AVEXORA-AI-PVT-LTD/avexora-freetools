"use client";

import { useTransition, useState } from "react";
import { updateToolStatus } from "@/app/admin/(protected)/tools/actions";

export function ToolToggle({ slug, initialStatus }: { slug: string; initialStatus: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState(initialStatus);
  const [error, setError] = useState<string | null>(null);

  const handleToggle = () => {
    const newStatus = !status;
    setStatus(newStatus);
    setError(null);

    startTransition(async () => {
      const result = await updateToolStatus(slug, newStatus);
      if (!result.success) {
        setStatus(!newStatus);
        setError(result.error || "Failed to update status");
      }
    });
  };

  return (
    <div className="flex flex-col gap-1 relative">
      <button
        type="button"
        onClick={handleToggle}
        disabled={isPending}
        className={`${
          status ? 'bg-emerald-500/20' : 'bg-red-500/20'
        } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${isPending ? 'opacity-50 cursor-wait' : ''}`}
        role="switch"
        aria-checked={status}
      >
        <span className="sr-only">Use setting</span>
        <span
          aria-hidden="true"
          className={`${
            status ? 'translate-x-5 bg-emerald-500' : 'translate-x-0 bg-red-500'
          } pointer-events-none inline-block h-5 w-5 transform rounded-full shadow ring-0 transition duration-200 ease-in-out`}
        />
      </button>
      {error && <span className="absolute top-full left-0 mt-1 text-xs text-red-600 whitespace-nowrap">{error}</span>}
    </div>
  );
}
