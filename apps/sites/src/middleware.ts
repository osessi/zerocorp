import { NextResponse, type NextRequest } from "next/server";

/**
 * Host -> tenant resolution.
 *
 * Runs on every request, including CDN cache hits, so it must never touch the
 * database or an API. The mapping is served from an edge-cached table,
 * invalidated when a customer connects or disconnects a domain.
 *
 * Resolution itself belongs to @zerocorp/tenancy; this file stays a thin adapter.
 */
export function middleware(request: NextRequest): NextResponse {
  const host = request.headers.get("host") ?? "";
  const response = NextResponse.next();
  response.headers.set("x-zerocorp-host", host);
  return response;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
