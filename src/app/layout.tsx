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
    default: "Meecard — ราคาการ์ด OPCG อัปเดตทุกวัน",
    template: "%s | Meecard",
  },
  description:
    "Meecard — ราคากลางการ์ด One Piece Card Game อัปเดตทุกวัน ดูราคา Yuyu-tei แปลงเป็นบาท กราฟราคาย้อนหลัง Portfolio ติดตามมูลค่า",
  keywords: [
    "Meecard",
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
            <Toaster position="bottom-center" />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
