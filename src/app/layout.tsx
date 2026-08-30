import type { Metadata, Viewport } from "next";
import { Orbitron } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { IPTVProvider } from "@/context/iptv-context";
import { generateWebsiteJsonLd } from "@/lib/seo";
import { PWARegister } from "@/components/pwa-register";

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://iptv.usama.dev"),
  title: {
    default: "IPTV - Live TV & Streaming",
    template: "%s | IPTV",
  },
  description:
    "Stream live IPTV channels, movies, sports, documentaries, and international broadcasts with a sleek modern player. Free legal open IPTV.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: ["/favicon.ico"],
  },
  keywords: [
    "IPTV",
    "Live TV",
    "Free Live Streaming",
    "M3U Player",
    "HLS Stream Player",
    "Online TV",
    "Sports Live",
    "News Live Stream",
    "Cinematic IPTV Player",
  ],
  authors: [{ name: "Usama Sarwar", url: "https://usama.dev" }],
  creator: "Usama Sarwar",
  publisher: "Usama Sarwar",
  alternates: {
    canonical: "https://iptv.usama.dev",
  },
  openGraph: {
    title: "IPTV - Live TV & Streaming",
    description:
      "Stream live IPTV channels, movies, sports, documentaries, and international broadcasts with a sleek modern player.",
    url: "https://iptv.usama.dev",
    siteName: "IPTV",
    images: [
      {
        url: "https://iptv.usama.dev/opengraph-image",
        width: 1200,
        height: 630,
        alt: "IPTV - Live TV & Streaming (Landscape)",
      },
      {
        url: "https://iptv.usama.dev/icon-512.png",
        width: 512,
        height: 512,
        alt: "IPTV - Live TV & Streaming (Square)",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "IPTV - Live TV & Streaming",
    description:
      "Stream live IPTV channels, movies, sports, documentaries, and international broadcasts with a sleek modern player.",
    images: ["https://iptv.usama.dev/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "IPTV",
  },
};

export const viewport: Viewport = {
  themeColor: "#7e22ce",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = generateWebsiteJsonLd();

  return (
    <html lang="en" className={`dark ${orbitron.variable}`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-[#09090b] text-zinc-100 antialiased">
        <IPTVProvider>
          {children}
          <PWARegister />
        </IPTVProvider>
        <Script
          id="bmc-widget"
          src="https://cdnjs.buymeacoffee.com/1.0.0/widget.prod.min.js"
          strategy="lazyOnload"
          data-name="BMC-Widget"
          data-cfasync="false"
          data-id="usamasarwar"
          data-description="Support me on Buy me a coffee!"
          data-message=""
          data-color="#9333ea"
          data-position="Right"
          data-x_margin="18"
          data-y_margin="18"
        />
      </body>
    </html>
  );
}
