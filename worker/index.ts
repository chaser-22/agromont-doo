/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

const ALLOWED_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const MAX_REQUEST_URL_LENGTH = 4096;

function addBaselineSecurityHeaders(headers: Headers, isHttps: boolean): void {
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("X-XSS-Protection", "0");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set(
    "Permissions-Policy",
    "accelerometer=(), autoplay=(), camera=(), display-capture=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=(), browsing-topics=()",
  );
  headers.set("Cross-Origin-Opener-Policy", "same-origin");
  headers.set("Cross-Origin-Resource-Policy", "same-origin");
  headers.set("Origin-Agent-Cluster", "?1");
  headers.set("X-Permitted-Cross-Domain-Policies", "none");
  headers.set("X-DNS-Prefetch-Control", "off");
  headers.delete("X-Powered-By");

  if (isHttps) {
    headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains");
  }
}

async function secureResponse(response: Response, requestUrl: URL): Promise<Response> {
  const headers = new Headers(response.headers);
  addBaselineSecurityHeaders(headers, requestUrl.protocol === "https:");

  const contentType = headers.get("Content-Type")?.toLowerCase() ?? "";
  const isHtml = contentType.includes("text/html");

  if (!isHtml || !response.body) {
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }

  const nonce = crypto.randomUUID().replaceAll("-", "");
  headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
      "script-src-attr 'none'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob:",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self'",
      "media-src 'self'",
      "manifest-src 'self'",
      "worker-src 'self' blob:",
      "frame-src 'none'",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self' mailto:",
      "upgrade-insecure-requests",
    ].join("; "),
  );

  const html = await response.text();
  const securedHtml = html.replace(
    /<script\b(?![^>]*\bnonce=)/gi,
    `<script nonce="${nonce}"`,
  );

  return new Response(securedHtml, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function rejectedRequest(status: number, message: string, url: URL, allow?: string): Response {
  const headers = new Headers({
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store",
  });
  if (allow) headers.set("Allow", allow);
  addBaselineSecurityHeaders(headers, url.protocol === "https:");
  return new Response(status === 204 ? null : message, { status, headers });
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (request.url.length > MAX_REQUEST_URL_LENGTH) {
      return rejectedRequest(414, "Request URI too long", url);
    }

    if (!ALLOWED_METHODS.has(request.method)) {
      return rejectedRequest(405, "Method not allowed", url, "GET, HEAD, OPTIONS");
    }

    if (request.method === "OPTIONS") {
      return rejectedRequest(204, "", url, "GET, HEAD, OPTIONS");
    }

    if (url.pathname === "/_vinext/image") {
      const source = url.searchParams.get("url");
      if (!source || !source.startsWith("/images/") || source.startsWith("//") || source.includes("\\")) {
        return rejectedRequest(400, "Invalid image source", url);
      }

      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      const imageResponse = await handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
      return secureResponse(imageResponse, url);
    }

    const response = await handler.fetch(request, env, ctx);
    return secureResponse(response, url);
  },
};

export default worker;
