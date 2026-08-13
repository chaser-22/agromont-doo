/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";
import {
  ALLOWED_METHODS,
  ALLOW_HEADER,
  BASELINE_SECURITY_HEADERS,
  createContentSecurityPolicy,
  isAllowedImageSource,
  MAX_REQUEST_URL_LENGTH,
  STRICT_TRANSPORT_SECURITY,
} from "../security/policy";

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

function addBaselineSecurityHeaders(headers: Headers, isHttps: boolean): void {
  for (const [key, value] of BASELINE_SECURITY_HEADERS) headers.set(key, value);
  headers.delete("X-Powered-By");

  if (isHttps) {
    headers.set("Strict-Transport-Security", STRICT_TRANSPORT_SECURITY);
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
  headers.set("Content-Security-Policy", createContentSecurityPolicy(nonce));

  const html = await response.text();
  const securedHtml = html.replace(/<script\b([^>]*)>/gi, (_tag, attributes: string) => {
    const withoutExistingNonce = attributes.replace(
      /\s+nonce=(?:"[^"]*"|'[^']*'|[^\s>]+)/gi,
      "",
    );
    return `<script nonce="${nonce}"${withoutExistingNonce}>`;
  });

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
      return rejectedRequest(405, "Method not allowed", url, ALLOW_HEADER);
    }

    if (request.method === "OPTIONS") {
      return rejectedRequest(204, "", url, ALLOW_HEADER);
    }

    if (url.pathname === "/_vinext/image" || url.pathname === "/_next/image") {
      const source = url.searchParams.get("url");
      if (!isAllowedImageSource(source)) {
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
