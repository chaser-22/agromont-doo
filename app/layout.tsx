import type { Metadata } from "next";
import { Manrope, Source_Serif_4 } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "latin-ext"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-serif",
  subsets: ["latin", "latin-ext"],
  style: ["normal", "italic"],
});

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const requestedHost = (requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "")
    .split(",")[0]
    .trim()
    .toLowerCase();

  const isLocal = requestedHost === "localhost:3005" || requestedHost === "127.0.0.1:3005";
  const isVercel = requestedHost.endsWith(".vercel.app");
  const isKnownHost = requestedHost === "agromont-crna-gora.ennnyy.chatgpt.site";
  const host = isLocal || isVercel || isKnownHost
    ? requestedHost
    : "agromont-crna-gora.ennnyy.chatgpt.site";
  const base = new URL(isLocal ? `http://${host}` : `https://${host}`);
  const socialImage = new URL("/og.png", base).toString();

  return {
    metadataBase: base,
    title: {
      default: "AgroMont — Od zrna do mreže",
      template: "%s | AgroMont",
    },
    description:
      "AgroMont povezuje žitarice, stočnu hranu, proizvodnju jaja, sortiranje, distribuciju i poljoprivredne centre u jedan sistem.",
    keywords: [
      "AgroMont",
      "stočna hrana Crna Gora",
      "jaja Crna Gora",
      "poljoprivredni centar",
      "žitarice",
      "poljoprivredna oprema",
    ],
    alternates: { canonical: base },
    openGraph: {
      title: "AgroMont — Od zrna do mreže",
      description: "Žitarice, stočna hrana, proizvodnja jaja, sortiranje, distribucija i poljoprivredni centri povezani u jedan sistem.",
      type: "website",
      locale: "sr_ME",
      siteName: "AgroMont",
      url: base,
      images: [{ url: socialImage, width: 1736, height: 904, alt: "AgroMont — proizvodni sistem od zrna do mreže" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "AgroMont — Od zrna do mreže",
      description: "Žitarice. Hrana. Farma. Distribucija.",
      images: [socialImage],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="sr-ME">
      <body className={`${manrope.variable} ${sourceSerif.variable}`}>{children}</body>
    </html>
  );
}
