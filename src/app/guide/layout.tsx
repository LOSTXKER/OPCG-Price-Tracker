import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "คู่มือ OPCG",
    template: "%s | Meecard",
  },
  description: "เรียนรู้ One Piece Card Game ตั้งแต่เริ่มต้น — ประเภทการ์ด ความหายาก สี และอื่นๆ",
  alternates: { canonical: "/guide" },
};

export default function GuideLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
