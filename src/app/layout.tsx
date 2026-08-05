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
const GOOGLE_SITE_VERIFICATION = clientEnv().NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;

// Keep static rendering while setting the persisted document language before
// the body is parsed. StoreHydrator keeps it in sync after hydration.
const INITIAL_HTML_LANG_SCRIPT = `(()=>{const m=document.cookie.match(/(?:^|; )kuma-lang=([^;]*)/);const l=m?decodeURIComponent(m[1]):"TH";document.documentElement.lang=l==="EN"?"en":l==="JP"?"ja":"th"})()`;

const SITE_TITLE = "Meecard — เช็คราคาการ์ดวันพีซ (One Piece Card Game) อัปเดตทุกวัน";
const SITE_DESCRIPTION =
  "เช็คราคาการ์ดวันพีชทุกใบ ทุกเกรด — ราคากลางจาก Yuyu-tei อัปเดตทุกวัน พร้อมกราฟราคาย้อนหลัง ราคา PSA 10 พอร์ตสะสม และแจ้งเตือนราคา";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s | Meecard",
  },
  description: SITE_DESCRIPTION,
  applicationName: "Meecard",
  keywords: [
    "Meecard",
    "ราคาการ์ดวันพีซ",
    "ราคาการ์ดวันพีช",
    "เช็คราคาการ์ดวันพีซ",
    "การ์ดวันพีซ",
    "วันพีซการ์ดเกม",
    "OPTCG",
    "OPCG",
    "One Piece Card Game",
    "Yuyu-tei",
  ],
  openGraph: {
    type: "website",
    siteName: "Meecard",
    locale: "th_TH",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  robots: { index: true, follow: true },
  // NOTE: no `alternates.canonical` here on purpose — a canonical set on the
  // root layout is inherited by every page that doesn't declare its own, which
  // made pages like /guide announce themselves as duplicates of "/". Each page
  // owns its canonical; the homepage declares "/" in src/app/page.tsx.
  ...(GOOGLE_SITE_VERIFICATION
    ? { verification: { google: GOOGLE_SITE_VERIFICATION } }
    : {}),
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
