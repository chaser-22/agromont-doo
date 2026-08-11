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
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3005";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const base = new URL(`${protocol}://${host}`);
  const socialImage = new URL("/og.png", base).toString();

  return {
    metadataBase: base,
    title: {
      default: "AgroMont — Hranimo ono što raste",
      template: "%s | AgroMont",
    },
    description:
      "AgroMont — domaća proizvodnja jaja i stočne hrane, poljoprivredni centri i kompletan program za gazdinstva u Crnoj Gori.",
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
      title: "AgroMont — Hranimo ono što raste",
      description:
        "Domaća proizvodnja, pouzdan program i mreža centara za poljoprivredu koja raste.",
      type: "website",
      locale: "sr_ME",
      siteName: "AgroMont",
      url: base,
      images: [{ url: socialImage, width: 1736, height: 904, alt: "AgroMont — Hranimo ono što raste" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "AgroMont — Hranimo ono što raste",
      description: "Proizvodnja. Program. Partnerstvo.",
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
