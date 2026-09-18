"use client";

import type { BlobDownloadResume } from "./account-resume";
import { useAuthDownload } from "./use-auth-download";
import { primaryBtn } from "@/tools/ui/ui-tokens";

/**
 * Shown by tools that cannot rehydrate their own result UI after the sign-in
 * round trip (editors, pickers whose file state is lost on remount). Presents
 * the Blob(s) that `useAuthDownload` persisted before the redirect so the user
 * can still download them after signing in.
 */
export function RestoredDownload({ restored }: { restored: BlobDownloadResume | null }) {
  const { download, downloadOne } = useAuthDownload();
  if (!restored) return null;
  const extras = restored.extras ?? [];
  const total = extras.length + 1;

  const onDownload = () => {
    if (extras.length === 0) {
      void downloadOne(restored.blob, restored.filename);
      return;
    }
    void download([
      { blob: restored.blob, filename: restored.filename },
      ...extras,
    ]);
  };

  return (
    <div className="space-y-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
      <p role="status">
        You&apos;re signed in — your file{total > 1 ? "s" : ""} are ready to download.
      </p>
      <button
        type="button"
        onClick={onDownload}
        className={primaryBtn}
        data-lead-action="download"
      >
        Download {total > 1 ? "all files" : "file"}
      </button>
    </div>
  );
}