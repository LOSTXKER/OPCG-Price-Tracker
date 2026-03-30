import type { Metadata } from "next";
import { Breadcrumb } from "@/components/shared/breadcrumb";
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
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Pricing" }]} />
      <PricingClient />
      <FaqSection items={[
        { question: "แพลน Pro ได้อะไรเพิ่ม?", answer: "Pro ได้ Price Alerts, Portfolio ไม่จำกัด, กราฟขั้นสูง, Export ข้อมูล และ Priority Support" },
        { question: "ยกเลิกได้มั้ย?", answer: "ยกเลิกได้ตลอดเวลา แพลนจะยังใช้ได้จนหมดรอบบิล ไม่มีค่าธรรมเนียมยกเลิก" },
        { question: "มีทดลองใช้มั้ย?", answer: "มี! สามารถทดลองใช้ Pro ได้ฟรี 7 วัน ไม่ต้องใส่บัตรเครดิต" },
        { question: "ใช้ฟรีได้มั้ย?", answer: "ฟีเจอร์หลักเช่นดูราคา กราฟ ข้อมูลชุดการ์ด และ Pull Calculator ใช้ได้ฟรีตลอด" },
      ]} />
    </>
  );
}
