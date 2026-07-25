import type { Metadata } from "next";
import Script from "next/script";
import { Kanit, JetBrains_Mono } from "next/font/google";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { MainChrome, SiteChrome, FooterChrome, PageContent, SkipToContent } from "@/components/layout/main-chrome";
import { CompareFloatingBar } from "@/components/compare/compare-floating-bar";
import { ScrollToTop } from "@/components/shared/scroll-to-top";
import { MissionTracker } from "@/components/honey/mission-tracker";
import { CardMiniPreviewDialog } from "@/components/shared/card-mini-preview-dialog";
import { AdAudienceProvider } from "@/components/ads/ad-audience-provider";
import { FloatingBottomAd } from "@/components/ads/floating-bottom-ad";

import { ThemeProvider } from "@/providers/theme-provider";
import { StoreHydrator } from "@/components/providers/store-hydrator";
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

// Keep static rendering while setting the persisted document language before
// the body is parsed. StoreHydrator keeps it in sync after hydration.
const INITIAL_HTML_LANG_SCRIPT = `(()=>{const m=document.cookie.match(/(?:^|; )kuma-lang=([^;]*)/);const l=m?decodeURIComponent(m[1]):"TH";document.documentElement.lang=l==="EN"?"en":l==="JP"?"ja":"th"})()`;

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
        <Script
          id="initial-html-language"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: INITIAL_HTML_LANG_SCRIPT }}
        />
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
          <StoreHydrator />
          <TooltipProvider>
            <ConfirmDialogProvider>
              <UpgradeDialogProvider>
                <AdAudienceProvider>
                  <SiteChrome>
                    <SkipToContent />
                    <Header />
                  </SiteChrome>
                  <PageContent>{children}</PageContent>
                  <FooterChrome>
                    <Footer />
                  </FooterChrome>
                  <MainChrome>
                    <FloatingBottomAd />
                    <BottomNav />
                  </MainChrome>
                  <CompareFloatingBar />
                  <CardMiniPreviewDialog />
                  <ScrollToTop />
                  <MissionTracker />
                  <Toaster position="top-center" />
                </AdAudienceProvider>
              </UpgradeDialogProvider>
            </ConfirmDialogProvider>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
