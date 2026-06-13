import type { Metadata } from "next";
import { Kanit, JetBrains_Mono } from "next/font/google";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { MainChrome, PageContent } from "@/components/layout/main-chrome";
import { CompareFloatingBar } from "@/components/compare/compare-floating-bar";
import { ConsentBanner } from "@/components/ads/consent-banner";
import { ScrollToTop } from "@/components/shared/scroll-to-top";
import { MissionTracker } from "@/components/honey/mission-tracker";
import { CardMiniPreviewDialog } from "@/components/shared/card-mini-preview-dialog";

import { ThemeProvider } from "@/providers/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { ConfirmDialogProvider } from "@/components/shared/confirm-dialog";
import { UpgradeDialogProvider } from "@/components/shared/upgrade-dialog";
import { JsonLd } from "@/lib/seo/json-ld-script";
import { websiteJsonLd } from "@/lib/seo/json-ld";
import "./globals.css";

const kanit = Kanit({
  variable: "--font-sans",
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

import { clientEnv } from "@/lib/env";
const BASE_URL = clientEnv().NEXT_PUBLIC_APP_URL;

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Meecard — OPCG Card Prices Updated Daily",
    template: "%s | Meecard",
  },
  description:
    "Meecard — One Piece Card Game market prices updated daily. Track Yuyu-tei prices, view price history charts, manage your portfolio and collection value.",
  applicationName: "Meecard",
  keywords: [
    "Meecard",
    "OPCG",
    "One Piece Card Game",
    "card price",
    "OPCG price",
    "One Piece card price",
    "ราคาการ์ด",
    "วันพีชการ์ดเกม",
    "Yuyu-tei",
  ],
  openGraph: {
    type: "website",
    siteName: "Meecard",
    locale: "th_TH",
    title: "Meecard — OPCG Card Prices Updated Daily",
    description:
      "One Piece Card Game market prices updated daily. Track Yuyu-tei prices, view price history charts, manage your portfolio and collection value.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Meecard — OPCG Card Prices Updated Daily",
    description:
      "One Piece Card Game market prices updated daily. Track prices, charts, portfolio and collection value.",
  },
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" suppressHydrationWarning>
      <head>
        <JsonLd data={websiteJsonLd()} />
      </head>
      <body
        className={`${kanit.variable} ${jetbrainsMono.variable} flex min-h-dvh flex-col font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>
            <ConfirmDialogProvider>
              <UpgradeDialogProvider>
                <MainChrome>
                  <Header />
                </MainChrome>
                <PageContent>{children}</PageContent>
                <MainChrome>
                  <Footer />
                  <BottomNav />
                </MainChrome>
                <CompareFloatingBar />
                <CardMiniPreviewDialog />
                <ScrollToTop />
                <MissionTracker />
                <ConsentBanner />
                <Toaster position="top-center" />
              </UpgradeDialogProvider>
            </ConfirmDialogProvider>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
