import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Sans_Condensed } from "next/font/google";
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

export const metadata: Metadata = {
  title: "Life Canvas",
  description: "Your personal journal and planner on the web.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${quoteSans.variable} ${quoteCondensed.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <AppProviders>
          <DesktopMobileFrame>{children}</DesktopMobileFrame>
        </AppProviders>
      </body>
    </html>
  );
}
