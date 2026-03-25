import type { Metadata } from "next";
import {
  IBM_Plex_Sans_Thai,
  Inter,
  JetBrains_Mono,
} from "next/font/google";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { MainChrome, PageContent } from "@/components/layout/main-chrome";

import { ThemeProvider } from "@/providers/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const ibmPlexThai = IBM_Plex_Sans_Thai({
  variable: "--font-thai",
  subsets: ["thai"],
  weight: ["300", "400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Kuma Tracker — ราคาการ์ด OPCG อัปเดตทุกวัน",
    template: "%s | Kuma Tracker",
  },
  description:
    "ราคากลางการ์ด One Piece Card Game อัปเดตทุกวัน ดูราคา Yuyu-tei แปลงเป็นบาท กราฟราคาย้อนหลัง Portfolio ติดตามมูลค่า",
  keywords: [
    "Kuma Tracker",
    "OPCG",
    "One Piece Card Game",
    "ราคาการ์ด",
    "การ์ดวันพีช",
    "ราคาการ์ดวันพีช",
    "OPCG price",
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
        className={`${inter.variable} ${ibmPlexThai.variable} ${jetbrainsMono.variable} flex min-h-dvh flex-col font-sans antialiased`}
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
            <Toaster position="bottom-center" />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
