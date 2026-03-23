import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Noto_Sans_Thai } from "next/font/google";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Header } from "@/components/layout/header";
import { ThemeProvider } from "@/providers/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const notoSansThai = Noto_Sans_Thai({
  variable: "--font-thai",
  subsets: ["thai"],
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "TCG Price Tracker - ราคาการ์ดเกมอัปเดตทุกวัน",
    template: "%s | TCG Price Tracker",
  },
  description:
    "ราคากลางการ์ด One Piece Card Game อัปเดตทุกวัน ดูราคา Yuyu-tei แปลงเป็นบาท กราฟราคาย้อนหลัง Portfolio ติดตามมูลค่าคอลเลกชัน",
  keywords: [
    "OPCG",
    "One Piece Card Game",
    "ราคาการ์ด",
    "TCG Price",
    "Yuyu-tei",
    "การ์ดวันพีช",
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
        className={`${inter.variable} ${notoSansThai.variable} ${jetbrainsMono.variable} flex min-h-dvh flex-col font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>
            <Header />
            <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-4 pb-20 md:pb-0 lg:px-6">
              {children}
            </main>
            <BottomNav />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
