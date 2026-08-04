import { NextResponse, type NextRequest } from "next/server";

/**
 * Next.js 16 renamed Middleware to Proxy (`proxy.ts`, project root or `src/`).
 *
 * This is an *optimistic* check only — it looks for the presence of a session
 * cookie to avoid rendering the app shell for obviously-signed-out visitors.
 * It is deliberately not the authorization boundary: every Studio server
 * component and route handler re-checks the real session. The Next docs are
 * explicit that Proxy must not be used as a session/authorization solution.
 */

const SESSION_COOKIES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
];

export function proxy(request: NextRequest) {
  const hasSession = SESSION_COOKIES.some((name) =>
    request.cookies.has(name),
  );

  if (!hasSession) {
    const signin = new URL("/studio/signin", request.url);
    signin.searchParams.set(
      "next",
      request.nextUrl.pathname + request.nextUrl.search,
    );
    return NextResponse.redirect(signin);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/studio/app/:path*"],
};
