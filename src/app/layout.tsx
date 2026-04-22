import type { Metadata } from "next";
import {
  IBM_Plex_Sans,
  IBM_Plex_Sans_Condensed,
  Jolly_Lodger,
} from "next/font/google";
import { DesktopMobileFrame } from "@/components/layout/desktop-mobile-frame";
import { AppProviders } from "@/components/providers/app-providers";
import "./globals.css";

/** Me tab quote/affirmation — matches Figma V1 typography */
const quoteSans = IBM_Plex_Sans({
  variable: "--font-quote-sans",
  subsets: ["latin"],
  weight: ["400"],
});

const quoteCondensed = IBM_Plex_Sans_Condensed({
  variable: "--font-quote-condensed",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
});

/** Wordmark / logo */
const brandWordmark = Jolly_Lodger({
  variable: "--font-brand-wordmark",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "LifeCanvas",
  description: "Your personal journal and planner on the web.",
};

/** Root app shell: fonts, providers, and desktop framing wrapper. */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${quoteSans.variable} ${quoteCondensed.variable} ${brandWordmark.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <AppProviders>
          <DesktopMobileFrame>{children}</DesktopMobileFrame>
        </AppProviders>
      </body>
    </html>
  );
}
