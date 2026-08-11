import type { Metadata, Viewport } from "next";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE, siteUrl } from "./site";
import { RegisterSW } from "./components/RegisterSW";
import "./globals.css";

const title = `${SITE_NAME} — ${SITE_TAGLINE}`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: title, template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  keywords: [
    "Sunday Ki Cutting",
    "90s Indian Nostalgia",
    "Deluxe Salon",
    "Old Barber Shop Radio",
    "90s Hindi Songs",
    "Retro India",
    "Bhojpuri Salon Radio",
    "Punjabi Salon Radio",
    "90s Nostalgia Experience"
  ],
  applicationName: SITE_NAME,
  manifest: "/manifest.webmanifest",
  alternates: {
    canonical: siteUrl(),
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: SITE_NAME,
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon.svg",
    apple: "/icons/icon-192.png",
  },
  openGraph: {
    title,
    description: SITE_DESCRIPTION,
    type: "website",
    siteName: SITE_NAME,
    url: siteUrl(),
    images: [{ url: "/images/wallpapers/01-old-barber-shop.jpg", width: 1600, height: 900, alt: title }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description: SITE_DESCRIPTION,
    images: ["/images/wallpapers/01-old-barber-shop.jpg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0908",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="hi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Baloo+Paaji+2:wght@500;600;700&family=Catamaran:wght@500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&family=Noto+Sans+Telugu:wght@500;600;700&family=Special+Elite&family=Yatra+One&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <RegisterSW />
      </body>
    </html>
  );
}
