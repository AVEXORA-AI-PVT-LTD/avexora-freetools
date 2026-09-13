import { NextResponse, type NextRequest } from "next/server";

/**
 * Next.js 16 renamed Middleware to Proxy (`proxy.ts`, project root or `src/`).
 *
 * This file handles two things:
 * 1. Admin Subdomain Routing: Rewrites admin.tools.avexora.in/* to /admin/*
 * 2. Studio App Shell: Optimistic auth check for /studio/app/*
 */

const SESSION_COOKIES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
];

export function proxy(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get("host") || "";
  
  // 1. Admin Subdomain Routing
  const isAdminHost = hostname.startsWith("admin.") || hostname.includes(":3001");
  
  if (isAdminHost) {
    if (url.pathname.startsWith('/admin')) {
      return NextResponse.next();
    }
    
    if (url.pathname.startsWith('/api/auth') || url.pathname.startsWith('/studio/signin')) {
      return NextResponse.next();
    }
    
    const rewriteUrl = new URL(`/admin${url.pathname === '/' ? '' : url.pathname}`, request.url);
    return NextResponse.rewrite(rewriteUrl);
  }
  
  if (url.pathname.startsWith('/admin') && !isAdminHost) {
    return NextResponse.rewrite(new URL('/404', request.url)); 
  }
  
  // 2. Studio App Auth Check
  if (url.pathname.startsWith('/studio/app')) {
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
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
