import { useEffect, useRef } from "react";
import { trackToolExecution } from "@/lib/track-tool-execution";

export function useToolTracking(toolSlug: string, isSuccessful: boolean, dependencyString: string) {
  const lastTracked = useRef<string | null>(null);

  useEffect(() => {
    if (isSuccessful && lastTracked.current !== dependencyString) {
      lastTracked.current = dependencyString;
      const timeout = setTimeout(() => {
        trackToolExecution(toolSlug);
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [toolSlug, isSuccessful, dependencyString]);
}
