import { NextRequest, NextResponse } from "next/server";
import {
  ALLOWED_METHODS,
  ALLOW_HEADER,
  BASELINE_SECURITY_HEADERS,
  createContentSecurityPolicy,
  isAllowedImageSource,
  MAX_REQUEST_URL_LENGTH,
  STRICT_TRANSPORT_SECURITY,
} from "./security/policy";

function addSecurityHeaders(headers: Headers, includeHsts = true): void {
  for (const [key, value] of BASELINE_SECURITY_HEADERS) headers.set(key, value);
  if (includeHsts) headers.set("Strict-Transport-Security", STRICT_TRANSPORT_SECURITY);
  headers.delete("X-Powered-By");
}

function reject(status: number, message: string, allow = false): NextResponse {
  const response = new NextResponse(status === 204 ? null : message, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
  if (allow) response.headers.set("Allow", ALLOW_HEADER);
  addSecurityHeaders(response.headers);
  return response;
}

export function proxy(request: NextRequest): NextResponse {
  if (request.url.length > MAX_REQUEST_URL_LENGTH) return reject(414, "Request URI too long");
  if (!ALLOWED_METHODS.has(request.method)) return reject(405, "Method not allowed", true);
  if (request.method === "OPTIONS") return reject(204, "", true);

  if (request.nextUrl.pathname === "/_next/image" && !isAllowedImageSource(request.nextUrl.searchParams.get("url"))) {
    return reject(400, "Invalid image source");
  }

  const nonce = btoa(crypto.randomUUID());
  const csp = createContentSecurityPolicy(nonce, process.env.NODE_ENV === "development");
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  addSecurityHeaders(response.headers);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|favicon.ico).*)"],
};
