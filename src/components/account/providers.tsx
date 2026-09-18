"use client";

import { SessionProvider } from "next-auth/react";

/**
 * Client session boundary for the whole app. Wrapping at the root keeps the
 * server layout static (no `auth()` call → tool pages stay statically
 * generated) while any client component — the navbar account control and the
 * download auth gate — can read the session via `useSession()`.
 */
export default function AccountProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SessionProvider>{children}</SessionProvider>;
}