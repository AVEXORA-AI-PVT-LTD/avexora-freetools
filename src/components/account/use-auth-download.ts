"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  type BlobDownloadResume,
  consumeBlobDownloadResume,
  saveBlobDownloadResume,
} from "./account-resume";

/**
 * Shared authentication gate for binary-file downloads (spec §20–§21).
 *
 * Every file-tool that produces a Blob routes its Download button through
 * `useAuthDownload().download` so the decision is made in exactly one place:
 *
 *   click Download
 *     ├─ authenticated → trigger the browser download(s) immediately
 *     └─ unauthenticated → persist the Blob(s) (IndexedDB), redirect to
 *        /studio/signin?next=<tool path>; the tool rehydrates the saved blob
 *        via `useRestoredDownload` on return and the next click downloads it.
 *
 * While the session is still resolving a click is buffered and completed as
 * soon as the status settles — the gate never guesses and never lets a
 * download through while auth state is unknown.
 */

export interface DownloadFile {
  blob: Blob;
  filename: string;
}

export function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function triggerDownloads(files: DownloadFile[]) {
  files.forEach((f, i) => {
    // Sequential blobs are clicked one microtask apart so browsers treat each
    // as a user gesture and don't block the batch as a pop-up.
    setTimeout(() => triggerBlobDownload(f.blob, f.filename), i * 120);
  });
}

export function useAuthDownload() {
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const pendingRef = useRef<DownloadFile[] | null>(null);
  const gateActionRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (status !== "authenticated" || !pendingRef.current) return;
    const pending = pendingRef.current;
    pendingRef.current = null;
    triggerDownloads(pending);
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated" || !gateActionRef.current) return;
    const fn = gateActionRef.current;
    gateActionRef.current = null;
    fn();
  }, [status]);

  const download = useCallback(
    async (files: DownloadFile[]) => {
      if (status === "loading") {
        if (!pendingRef.current) pendingRef.current = files;
        return;
      }
      if (status === "authenticated") {
        triggerDownloads(files);
        return;
      }
      // Unauthenticated: keep the result, then go sign in. The blob is saved
      // before navigation so the round trip never loses the generated file.
      const primary = files[0];
      if (!primary) return;
      await saveBlobDownloadResume({
        path: pathname,
        blob: primary.blob,
        filename: primary.filename,
        extras: files.length > 1 ? files.slice(1) : undefined,
      });
      router.push(`/studio/signin?next=${encodeURIComponent(pathname)}`);
    },
    [status, router, pathname],
  );

  // Convenience for single-file tools.
  const downloadOne = useCallback(
    (blob: Blob, filename: string) => void download([{ blob, filename }]),
    [download],
  );

  /**
   * For outputs that cannot be persisted as a Blob (browser print/Save-as-PDF
   * flows — there is no binary result to save). The action either runs when
   * authenticated or redirects to sign-in; buffered while status resolves.
   * Returns a boolean "already handled" marker so callers can skip work.
   */
  const requireAuth = useCallback(
    (fn: () => void) => {
      if (status === "loading") {
        gateActionRef.current = fn;
        return;
      }
      if (status === "authenticated") {
        fn();
        return;
      }
      void router.push(`/studio/signin?next=${encodeURIComponent(pathname)}`);
    },
    [status, router, pathname],
  );

  return { status, download, downloadOne, requireAuth };
}

/**
 * Restores a blob that was persisted for this path when an unauthenticated
 * visitor tried to download it. Returns the restored `{ blob, filename }`
 * (consumed — deleted from IndexedDB after read) and `checked` once the
 * (async) lookup has settled so bail-outs don't flash.
 */
export function useRestoredDownload(): {
  restored: BlobDownloadResume | null;
  checked: boolean;
} {
  const pathname = usePathname();
  const pathRef = useRef(pathname);
  const [restored, setRestored] = useState<BlobDownloadResume | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    pathRef.current = pathname;
    let alive = true;
    void consumeBlobDownloadResume(pathname)
      .then((entry) => {
        if (alive && pathRef.current === pathname) {
          setRestored(entry);
          setChecked(true);
        }
      })
      .catch(() => {
        if (alive && pathRef.current === pathname) setChecked(true);
      });
    return () => {
      alive = false;
    };
  }, [pathname]);

  return { restored, checked };
}