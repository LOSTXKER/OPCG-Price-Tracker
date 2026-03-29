import type { Metadata } from "next";
import {
  DM_Sans,
  Kanit,
  JetBrains_Mono,
} from "next/font/google";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { MainChrome, PageContent } from "@/components/layout/main-chrome";
import { ScrollToTop } from "@/components/shared/scroll-to-top";

import { ThemeProvider } from "@/providers/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const kanit = Kanit({
  variable: "--font-thai",
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Meecard — OPCG Card Prices Updated Daily",
    template: "%s | Meecard",
  },
  description:
    "Meecard — One Piece Card Game market prices updated daily. Track Yuyu-tei prices, view price history charts, manage your portfolio and collection value.",
  keywords: [
    "Meecard",
    "OPCG",
    "One Piece Card Game",
    "card price",
    "OPCG price",
    "One Piece card price",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" suppressHydrationWarning>
      <body
        className={`${dmSans.variable} ${kanit.variable} ${jetbrainsMono.variable} flex min-h-dvh flex-col font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>
            <MainChrome>
              <Header />
            </MainChrome>
            <PageContent>{children}</PageContent>
            <MainChrome>
              <Footer />
              <BottomNav />
            </MainChrome>
            <ScrollToTop />
            <Toaster position="bottom-center" />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
