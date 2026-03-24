import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "คู่มือ OPCG",
  description: "เรียนรู้ One Piece Card Game ตั้งแต่เริ่มต้น — ประเภทการ์ด ความหายาก สี และอื่นๆ",
};

export default function GuideLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
