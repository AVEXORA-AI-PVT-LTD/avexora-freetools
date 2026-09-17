import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const hostname = req.headers.get("host") || "";
  const url = req.nextUrl;

  // Determine if it's the admin subdomain
  const isAdminSubdomain = hostname.startsWith("admin.") || hostname.startsWith("admin-");

  // Rewrite /admin requests if coming from the admin subdomain
  if (isAdminSubdomain && !url.pathname.startsWith("/admin") && !url.pathname.startsWith("/_next") && !url.pathname.startsWith("/api") && !url.pathname.startsWith("/studio")) {
    // Rewrite requests to the /admin folder
    return NextResponse.rewrite(new URL(`/admin${url.pathname}`, req.url));
  }

  // Optional: Prevent access to /admin routes directly from the main domain (tools.avexora.in)
  // This enforces the use of the admin subdomain
  if (!isAdminSubdomain && url.pathname.startsWith("/admin") && process.env.NODE_ENV === "production") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
