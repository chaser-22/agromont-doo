import type { NextConfig } from "next";
import { BASELINE_SECURITY_HEADERS, STRICT_TRANSPORT_SECURITY } from "./security/policy";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  reactStrictMode: true,
  images: {
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          ...BASELINE_SECURITY_HEADERS.map(([key, value]) => ({ key, value })),
          { key: "Strict-Transport-Security", value: STRICT_TRANSPORT_SECURITY },
        ],
      },
    ];
  },
};

export default nextConfig;
