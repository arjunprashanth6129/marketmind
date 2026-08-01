import type { Metadata } from "next";
import { IBM_Plex_Sans, JetBrains_Mono } from "next/font/google";
import { PROJECT } from "@/lib/stats";
import "./globals.css";

// Plex Sans for prose and labels; JetBrains Mono for every figure. The pairing
// reads as research software rather than generic startup sans.
const plexSans = IBM_Plex_Sans({
  variable: "--font-plex",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const jetMono = JetBrains_Mono({
  variable: "--font-jet",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const title = `${PROJECT.name} - ${PROJECT.tagline}`;

export const metadata: Metadata = {
  metadataBase: new URL(PROJECT.live),
  title: {
    default: title,
    template: `%s · ${PROJECT.name}`,
  },
  description: PROJECT.description,
  applicationName: PROJECT.name,
  authors: [{ name: PROJECT.author }],
  keywords: [
    "financial literacy",
    "stock screener",
    "portfolio backtesting",
    "fundamental analysis",
    "NSE",
    "Next.js",
    "TypeScript",
  ],
  openGraph: {
    type: "website",
    url: PROJECT.live,
    title,
    description: PROJECT.description,
    siteName: PROJECT.name,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description: PROJECT.description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plexSans.variable} ${jetMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-ink-900 text-fg">
        {children}
      </body>
    </html>
  );
}
