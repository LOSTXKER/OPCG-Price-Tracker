import type { Metadata } from "next";
import { LocalizedBreadcrumb } from "@/components/shared/localized-breadcrumb";
import { JsonLd } from "@/lib/seo/json-ld-script";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { FaqSection } from "@/components/shared/faq-section";
import PricingClient from "./pricing-client";

export const metadata: Metadata = {
  title: "Pricing Plans",
  description:
    "Choose a Meecard plan that fits your needs. Free, Pro and Pro+ tiers with price alerts, portfolio analytics and more.",
  alternates: { canonical: "/pricing" },
};

export default function PricingPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", href: "/" }, { name: "Pricing", href: "/pricing" }])} />
      <LocalizedBreadcrumb items={[{ labelKey: "home", href: "/" }, { labelKey: "pricing" }]} />
      <PricingClient />
      <FaqSection items={[
        { question: "แพลน Pro ได้อะไรเพิ่ม?", answer: "ได้ Price Alerts, Portfolio ไม่จำกัด, กราฟขั้นสูง, Export ข้อมูล แล้วก็ Priority Support" },
        { question: "ยกเลิกได้มั้ย?", answer: "ยกเลิกได้ตลอด แพลนจะยังใช้ได้จนหมดรอบบิล ไม่มีค่าธรรมเนียม" },
        { question: "มีทดลองใช้มั้ย?", answer: "มี ทดลองใช้ Pro ฟรี 7 วัน ไม่ต้องใส่บัตรเครดิต" },
        { question: "ใช้ฟรีได้มั้ย?", answer: "ดูราคา กราฟ ข้อมูลชุดการ์ด Drop Calculator ใช้ฟรีหมด อัปเกรดเมื่อไรก็ได้" },
      ]} />
    </>
  );
}
