export const ALLOWED_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
export const ALLOW_HEADER = "GET, HEAD, OPTIONS";
export const MAX_REQUEST_URL_LENGTH = 4096;

export const BASELINE_SECURITY_HEADERS = [
  ["X-Content-Type-Options", "nosniff"],
  ["X-Frame-Options", "DENY"],
  ["X-XSS-Protection", "0"],
  ["Referrer-Policy", "strict-origin-when-cross-origin"],
  [
    "Permissions-Policy",
    "accelerometer=(), autoplay=(), camera=(), display-capture=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=(), browsing-topics=()",
  ],
  ["Cross-Origin-Opener-Policy", "same-origin"],
  ["Cross-Origin-Resource-Policy", "same-origin"],
  ["Origin-Agent-Cluster", "?1"],
  ["X-Permitted-Cross-Domain-Policies", "none"],
  ["X-DNS-Prefetch-Control", "off"],
] as const;

export const STRICT_TRANSPORT_SECURITY = "max-age=63072000; includeSubDomains";

export function createContentSecurityPolicy(nonce: string, development = false): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${development ? " 'unsafe-eval'" : ""}`,
    "script-src-attr 'none'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob:",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self'",
    "media-src 'self'",
    "manifest-src 'self'",
    "worker-src 'self' blob:",
    "frame-src https://www.openstreetmap.org",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self' mailto:",
    "upgrade-insecure-requests",
  ].join("; ");
}

export function isAllowedImageSource(source: string | null): boolean {
  if (!source || source.length > 512) return false;
  if (source.includes("..") || source.includes("%") || source.includes("\\") || source.includes("//")) return false;
  return /^\/images\/[a-z0-9/_-]+\.(?:avif|jpe?g|png|webp)$/i.test(source);
}
