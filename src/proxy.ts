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

export async function proxy(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get("host") || "";
  
  // 1. Admin Subdomain Routing
  const isAdminHost = hostname.startsWith("admin.") || hostname.includes(":3001");
  
  if (isAdminHost) {
    if (url.pathname.startsWith('/admin')) {
      return NextResponse.next();
    }
    
    if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/studio/signin')) {
      return NextResponse.next();
    }
    
    const rewriteUrl = new URL(`/admin${url.pathname === '/' ? '' : url.pathname}`, request.url);
    return NextResponse.rewrite(rewriteUrl);
  }
  
  // Remove strict 404 blocking so `/admin` can be accessed directly on localhost:3000
  // if (url.pathname.startsWith('/admin') && !isAdminHost) {
  //   return NextResponse.rewrite(new URL('/404', request.url)); 
  // }
  
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


  // 3. SEO Edge Redirects
  // Fetch redirects (cached for 60 seconds)
  if (request.method === 'GET' && !url.pathname.startsWith('/_next') && !url.pathname.startsWith('/api') && !url.pathname.includes('.')) {
    try {
      const protocol = request.headers.get("x-forwarded-proto") || "http";
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${hostname}`;
      
      const res = await fetch(`${appUrl}/api/seo/redirects`, {
        next: { revalidate: 60, tags: ['seo-redirects'] }
      });
      
      if (res.ok) {
        const redirects = await res.json();
        const match = redirects.find((r: any) => r.source === url.pathname);
        if (match) {
          return NextResponse.redirect(new URL(match.destination, request.url), match.statusCode);
        }
      }
    } catch (e) {
      // Fail silently
    }
  }

  return NextResponse.next();

}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
