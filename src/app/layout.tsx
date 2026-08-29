import type { Metadata, Viewport } from "next";
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
import { ServiceWorkerRegister } from "@/components/providers/service-worker-register";
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

// Chrome fires `beforeinstallprompt` ONCE, on its own schedule, and it can beat
// React's hydration — a listener attached by a component would simply miss it
// and the "เพิ่มไปหน้าจอโฮม" button would never appear. Parking the event on
// `window` from the document head guarantees it survives until `useInstallPrompt`
// mounts and adopts it.
const CAPTURE_INSTALL_PROMPT_SCRIPT = `addEventListener("beforeinstallprompt",function(e){e.preventDefault();window.__mcInstallEvent=e})`;

const SITE_TITLE = "Meecard — เช็คราคาการ์ดวันพีช (One Piece Card Game)";
// Owner decision (2026-08-06): no source-brand names in site metadata — the
// trust claim is "ตลาดญี่ปุ่น"; the brand is named only in the home FAQ answer.
// Owner ruling 2026-08-28: no "อัปเดตทุกวัน" claim anywhere on the site — prices
// are not scraped on a schedule (demo site). Real per-page "อัปเดตล่าสุด" dates
// carry freshness instead; site-wide metadata just states what the site is.
const SITE_DESCRIPTION =
  "เช็คราคาการ์ดวันพีซทุกใบ ทุกเกรด — ราคากลางอ้างอิงตลาดญี่ปุ่น พร้อมกราฟราคาย้อนหลัง ราคา PSA 10 พอร์ตสะสม และแจ้งเตือนราคา";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s | Meecard",
  },
  description: SITE_DESCRIPTION,
  applicationName: "Meecard",
  manifest: "/manifest.webmanifest",
  // iOS has no install API and ignores the manifest almost entirely: these
  // meta tags are the only way a home-screen launch opens without Safari's
  // chrome and carries the right title under the icon.
  appleWebApp: {
    capable: true,
    title: "Meecard",
    statusBarStyle: "black-translucent",
  },
  keywords: [
    "Meecard",
    "ราคาการ์ดวันพีช",
    "ราคาการ์ดวันพีซ",
    "เช็คราคาการ์ดวันพีช",
    "การ์ดวันพีช",
    "วันพีชการ์ดเกม",
    "OPTCG",
    "OPCG",
    "One Piece Card Game",
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

/**
 * `themeColor` paints the phone's status bar and the browser's own UI around
 * the page, so it tracks the theme rather than picking one — and matches
 * `--background` in globals.css exactly, or the seam between the two shows.
 *
 * `viewportFit: "cover"` lets the page reach under the notch/home indicator,
 * which is what a home-screen launch expects; the chrome already carries its
 * own safe-area padding.
 */
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
    { media: "(prefers-color-scheme: dark)", color: "#100C09" },
  ],
  viewportFit: "cover",
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
        <Script
          id="capture-install-prompt"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: CAPTURE_INSTALL_PROMPT_SCRIPT }}
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
          <ServiceWorkerRegister />
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
