import { useEffect, useRef } from "react";
import { recordToolUsage } from "@/app/actions/analytics";

export function useToolTracking(toolSlug: string, isSuccessful: boolean, dependencyString: string) {
  const lastTracked = useRef<string | null>(null);

  useEffect(() => {
    if (isSuccessful && lastTracked.current !== dependencyString) {
      lastTracked.current = dependencyString;
      const timeout = setTimeout(() => {
        recordToolUsage(toolSlug).catch(console.error);
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [toolSlug, isSuccessful, dependencyString]);
}
